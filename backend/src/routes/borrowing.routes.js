// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS organization text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS position_in_org text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS contact_number text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS purpose_type text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS purpose_others_detail text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS activity_name text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS venue text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS time_of_use text;
// MANUAL STEP: ALTER TABLE borrowing_requests ADD COLUMN IF NOT EXISTS equipment_items jsonb;

// MANUAL STEPS REQUIRED — apply in Supabase dashboard before testing:
//
// 1. Create borrowing_requests table:
//    CREATE TABLE borrowing_requests (
//      id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//      created_at         timestamptz DEFAULT now(),
//      borrower_name      text NOT NULL,
//      borrower_id        text NOT NULL,
//      borrower_email     text,
//      equipment_id       uuid NOT NULL REFERENCES inventory(id),
//      quantity_requested integer NOT NULL DEFAULT 1,
//      purpose            text,
//      borrow_date        date NOT NULL,
//      return_date        date NOT NULL,
//      actual_return      timestamptz,
//      status             text NOT NULL DEFAULT 'pending'
//                         CHECK (status IN ('pending','approved','rejected','returned')),
//      admin_notes        text,
//      processed_by       uuid REFERENCES auth.users(id),
//      processed_at       timestamptz
//    );
//
// 2. Enable RLS on borrowing_requests:
//    ALTER TABLE borrowing_requests ENABLE ROW LEVEL SECURITY;
//    -- Allow public insert (students submit requests without accounts):
//    CREATE POLICY "allow_public_insert" ON borrowing_requests FOR INSERT TO anon WITH CHECK (true);
//    -- Allow authenticated reads and updates (admins only):
//    CREATE POLICY "allow_auth_all" ON borrowing_requests FOR ALL TO authenticated USING (true);

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { anonSupabase, createUserClient, supabase } from "../lib/supabaseClient.js";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middlewares/auth.middleware.js";
import ApiError from "../lib/apiError.js";
import multer from "multer";
import { sendEmail } from "../lib/mailer.js";
import {
  submissionConfirmationEmail,
  approvalEmail,
  rejectionEmail,
} from "../lib/emailTemplates.js";

// Dedicated limiter for the public borrow-request submission endpoint.
// Students are unlikely to need more than a handful of submissions per day,
// so 5 per hour per IP is generous without opening the door to spam.
const borrowSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many borrow requests submitted from this device. Please wait an hour before trying again.",
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Resolve a stored image filename to a public CDN URL (returns null if no image)
const resolveImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return anonSupabase.storage.from("equipment").getPublicUrl(imagePath).data.publicUrl;
};

const transformInventory = (item) => ({
  ...item,
  image: resolveImageUrl(item.image),
});

const router = Router();

// ── Inventory (public reads) ──────────────────────────────────────────────────

router.get(
  "/inventory",
  asyncHandler(async (req, res) => {
    const { data, error } = await anonSupabase
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data.map(transformInventory));
  }),
);

router.get(
  "/inventory/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await anonSupabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, "Equipment not found.");
    return res.status(200).json(transformInventory(data));
  }),
);

// ── Inventory management (admin) ──────────────────────────────────────────────

router.post(
  "/inventory/add",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { name, max_quantity } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, "name is required.");
    const qty = parseInt(max_quantity);
    if (!qty || qty < 1) throw new ApiError(400, "max_quantity must be at least 1.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { data, error } = await userSupabase.from("inventory").insert({
      name: name.trim(),
      quantity: qty,
      max_quantity: qty,
      is_available: qty > 0,
    }).select().single();
    if (error) throw new ApiError(500, error.message);

    // Upload image if provided (non-fatal on failure)
    if (req.file) {
      try {
        const ext = req.file.originalname?.split(".").pop() || req.file.mimetype.split("/")[1] || "jpg";
        const imagePath = `${data.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("equipment")
          .upload(imagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
        if (!uploadError) {
          await supabase.from("inventory").update({ image: imagePath }).eq("id", data.id);
        }
      } catch (imgErr) {
        console.error("[INVENTORY ADD] Image upload failed:", imgErr.message);
      }
    }

    return res.sendStatus(200);
  }),
);

router.post(
  "/inventory/edit",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { id, name, max_quantity } = req.body;
    if (!id) throw new ApiError(400, "id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (max_quantity !== undefined) {
      const qty = parseInt(max_quantity);
      if (!qty || qty < 1) throw new ApiError(400, "max_quantity must be at least 1.");
      updates.max_quantity = qty;
      const { data: current } = await userSupabase
        .from("inventory")
        .select("quantity")
        .eq("id", id)
        .single();
      if (current) {
        updates.is_available = current.quantity > 0;
      }
    }

    // Replace image if a new file was provided
    if (req.file) {
      try {
        // Remove old image first
        const { data: existing } = await userSupabase
          .from("inventory").select("image").eq("id", id).single();
        if (existing?.image) {
          await supabase.storage.from("equipment").remove([existing.image]);
        }
        const ext = req.file.originalname?.split(".").pop() || req.file.mimetype.split("/")[1] || "jpg";
        const imagePath = `${id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("equipment")
          .upload(imagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
        if (!uploadError) updates.image = imagePath;
      } catch (imgErr) {
        console.error("[INVENTORY EDIT] Image upload failed:", imgErr.message);
      }
    }

    if (Object.keys(updates).length === 0) return res.sendStatus(200);

    const { error } = await userSupabase
      .from("inventory")
      .update(updates)
      .eq("id", id);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

router.delete(
  "/inventory/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new ApiError(400, "id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    // Guard: reject if there are active (pending or approved) requests for this equipment
    const { count, error: guardError } = await userSupabase
      .from("borrowing_requests")
      .select("*", { count: "exact", head: true })
      .eq("equipment_id", id)
      .in("status", ["pending", "approved"]);
    if (guardError) throw new ApiError(500, guardError.message);
    if (count > 0) {
      throw new ApiError(400, "Cannot delete equipment with active borrow requests.");
    }

    // Remove image from storage (non-fatal)
    try {
      const { data: existing } = await userSupabase
        .from("inventory").select("image").eq("id", id).single();
      if (existing?.image) {
        await supabase.storage.from("equipment").remove([existing.image]);
      }
    } catch (imgErr) {
      console.error("[INVENTORY DELETE] Image cleanup failed:", imgErr.message);
    }

    const { error } = await userSupabase.from("inventory").delete().eq("id", id);
    if (error) throw new ApiError(500, error.message);
    return res.sendStatus(200);
  }),
);

// ── Borrow requests ───────────────────────────────────────────────────────────

router.get(
  "/requests",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.token;
    const userSupabase = createUserClient(token);

    let query = userSupabase
      .from("borrowing_requests")
      .select("*, inventory(name)")
      .order("created_at", { ascending: false });

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    const payload = data.map((r) => ({
      ...r,
      equipment_name: r.inventory?.name ?? "Unknown",
      inventory: undefined,
    }));

    return res.status(200).json(payload);
  }),
);

router.post(
  "/request",
  borrowSubmitLimiter,
  asyncHandler(async (req, res) => {
    const {
      borrower_name,
      borrower_id,
      borrower_email,
      contact_number,
      organization,
      position_in_org,
      purpose_type,
      purpose_others_detail,
      activity_name,
      venue,
      borrow_date,
      return_date,
      time_of_use,
      equipment_items, // array: [{ equipment_id, quantity_requested }]
    } = req.body;

    if (!borrower_name || !borrower_id || !borrow_date) {
      throw new ApiError(400, "Missing required fields.");
    }

    if (!Array.isArray(equipment_items) || equipment_items.length === 0) {
      throw new ApiError(400, "At least one equipment item is required.");
    }

    // Validate and check availability for each item
    for (const item of equipment_items) {
      const qty = parseInt(item.quantity_requested);
      if (!item.equipment_id) throw new ApiError(400, "Each item requires an equipment_id.");
      if (!qty || qty < 1) throw new ApiError(400, "Quantity must be at least 1 for each item.");

      const { data: inv, error: invErr } = await anonSupabase
        .from("inventory")
        .select("quantity, name")
        .eq("id", item.equipment_id)
        .single();
      if (invErr || !inv) throw new ApiError(404, `Equipment not found: ${item.equipment_id}`);
      if (qty > inv.quantity) {
        throw new ApiError(
          400,
          `Not enough units available for ${inv.name}. Only ${inv.quantity} unit(s) left.`,
        );
      }

      // Option B: one active pending request per student per equipment.
      // Prevents the same student from spamming multiple requests for the same
      // item before the Equipment Manager has had a chance to review.
      const { data: existingPending } = await anonSupabase
        .from("borrowing_requests")
        .select("id")
        .eq("equipment_id", item.equipment_id)
        .eq("borrower_id", borrower_id)
        .eq("status", "pending")
        .maybeSingle();
      if (existingPending) {
        throw new ApiError(
          409,
          `You already have a pending request for ${inv.name}. Please wait for it to be reviewed before submitting another.`,
        );
      }
    }

    // Use first item for the main (backward-compat) columns
    const firstItem = equipment_items[0];
    const firstQty = parseInt(firstItem.quantity_requested);

    // Derive return_date: use provided value or default to borrow_date + 1 day
    let effectiveReturnDate = return_date;
    if (!effectiveReturnDate) {
      const d = new Date(borrow_date);
      d.setDate(d.getDate() + 1);
      effectiveReturnDate = d.toISOString().split("T")[0];
    }

    const { error } = await anonSupabase.from("borrowing_requests").insert({
      borrower_name,
      borrower_id,
      borrower_email: borrower_email || null,
      contact_number: contact_number || null,
      organization: organization || null,
      position_in_org: position_in_org || null,
      purpose_type: purpose_type || null,
      purpose_others_detail: purpose_others_detail || null,
      activity_name: activity_name || null,
      venue: venue || null,
      time_of_use: time_of_use || null,
      equipment_id: firstItem.equipment_id,
      quantity_requested: firstQty,
      equipment_items: equipment_items,
      borrow_date,
      return_date: effectiveReturnDate,
      status: "pending",
    });
    if (error) throw new ApiError(500, error.message);

    // Send submission confirmation email to the student
    let emailSent = false;
    if (borrower_email) {
      try {
        // Enrich equipment_items with names for the email
        const enrichedItems = await Promise.all(
          equipment_items.map(async (item) => {
            const { data: inv } = await anonSupabase
              .from("inventory")
              .select("name")
              .eq("id", item.equipment_id)
              .single();
            return { ...item, name: inv?.name ?? item.equipment_id };
          }),
        );

        // Fetch the newly-created request ID for the reference number
        const { data: newRequest } = await anonSupabase
          .from("borrowing_requests")
          .select("id")
          .eq("borrower_id", borrower_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { subject, html } = submissionConfirmationEmail({
          borrowerName: borrower_name,
          borrowerEmail: borrower_email,
          equipmentItems: enrichedItems,
          equipmentName: enrichedItems[0]?.name,
          quantityRequested: parseInt(firstItem.quantity_requested),
          borrowDate: borrow_date,
          organization: organization || null,
          activityName: activity_name || null,
          requestId: newRequest?.id ?? "",
        });

        // Await so that SMTP errors surface instead of being silently dropped
        await sendEmail({ to: borrower_email, subject, html });
        emailSent = true;
      } catch (emailErr) {
        // Non-fatal — request is already saved; just log the failure
        console.error("[BORROWING] Confirmation email failed:", emailErr?.message ?? emailErr);
      }
    }

    return res.status(201).json({
      message: "Request submitted successfully.",
      email_sent: emailSent,
    });
  }),
);

router.delete(
  "/requests/delete",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "ids required");
    }
    const token = req.token;
    const userSupabase = createUserClient(token);
    const { error } = await userSupabase
      .from("borrowing_requests")
      .delete()
      .in("id", ids);
    if (error) throw new ApiError(500, "Delete failed: " + error.message);
    return res.sendStatus(200);
  }),
);

router.post(
  "/approve",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { request_id, admin_notes } = req.body;
    if (!request_id) throw new ApiError(400, "request_id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { data: request, error: reqError } = await userSupabase
      .from("borrowing_requests")
      .select("*")
      .eq("id", request_id)
      .single();
    if (reqError || !request) throw new ApiError(404, "Request not found.");
    if (request.status !== "pending") {
      throw new ApiError(400, "Only pending requests can be approved.");
    }

    const { data: inventory, error: invError } = await userSupabase
      .from("inventory")
      .select("quantity")
      .eq("id", request.equipment_id)
      .single();
    if (invError || !inventory) throw new ApiError(404, "Equipment not found.");
    if (inventory.quantity < request.quantity_requested) {
      throw new ApiError(400, "Insufficient inventory to approve this request.");
    }

    const newQty = inventory.quantity - request.quantity_requested;
    const { error: invUpdateError } = await userSupabase
      .from("inventory")
      .update({ quantity: newQty, is_available: newQty > 0 })
      .eq("id", request.equipment_id);
    if (invUpdateError) throw new ApiError(500, invUpdateError.message);

    const { error: reqUpdateError } = await userSupabase
      .from("borrowing_requests")
      .update({
        status: "approved",
        processed_by: req.user.sub,
        processed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      })
      .eq("id", request_id);

    if (reqUpdateError) {
      // Compensating rollback: restore inventory quantity
      await userSupabase
        .from("inventory")
        .update({ quantity: inventory.quantity, is_available: true })
        .eq("id", request.equipment_id);
      throw new ApiError(500, reqUpdateError.message);
    }

    // Send approval notification email to student (fire-and-forget — non-fatal)
    if (request.borrower_email) {
      // Resolve equipment name for the email
      const { data: inv } = await userSupabase
        .from("inventory")
        .select("name")
        .eq("id", request.equipment_id)
        .single();

      // Enrich equipment_items with names if stored as JSONB
      const enrichedItems = Array.isArray(request.equipment_items)
        ? await Promise.all(
            request.equipment_items.map(async (item) => {
              if (item.name) return item;
              const { data: itemInv } = await userSupabase
                .from("inventory")
                .select("name")
                .eq("id", item.equipment_id)
                .single();
              return { ...item, name: itemInv?.name ?? item.equipment_id };
            }),
          )
        : null;

      const { subject, html } = approvalEmail({
        borrowerName: request.borrower_name,
        equipmentItems: enrichedItems,
        equipmentName: inv?.name ?? "Equipment",
        quantityRequested: request.quantity_requested,
        borrowDate: request.borrow_date,
        returnDate: request.return_date,
        adminNotes: admin_notes || null,
        requestId: request_id,
      });
      sendEmail({ to: request.borrower_email, subject, html });
    }

    return res.sendStatus(200);
  }),
);

router.post(
  "/reject",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { request_id, admin_notes } = req.body;
    if (!request_id) throw new ApiError(400, "request_id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { data: request, error: reqError } = await userSupabase
      .from("borrowing_requests")
      .select("status, borrower_email")
      .eq("id", request_id)
      .single();
    if (reqError || !request) throw new ApiError(404, "Request not found.");
    if (request.status !== "pending") {
      throw new ApiError(400, "Only pending requests can be rejected.");
    }

    const { error } = await userSupabase
      .from("borrowing_requests")
      .update({
        status: "rejected",
        processed_by: req.user.sub,
        processed_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
      })
      .eq("id", request_id);
    if (error) throw new ApiError(500, error.message);

    // Send rejection notification email to student (fire-and-forget — non-fatal)
    if (request.borrower_email) {
      // Fetch full request details for the email (we only selected 'status' above)
      const { data: fullRequest } = await userSupabase
        .from("borrowing_requests")
        .select("*")
        .eq("id", request_id)
        .single();

      if (fullRequest) {
        const { data: inv } = await userSupabase
          .from("inventory")
          .select("name")
          .eq("id", fullRequest.equipment_id)
          .single();

        const enrichedItems = Array.isArray(fullRequest.equipment_items)
          ? await Promise.all(
              fullRequest.equipment_items.map(async (item) => {
                if (item.name) return item;
                const { data: itemInv } = await userSupabase
                  .from("inventory")
                  .select("name")
                  .eq("id", item.equipment_id)
                  .single();
                return { ...item, name: itemInv?.name ?? item.equipment_id };
              }),
            )
          : null;

        const { subject, html } = rejectionEmail({
          borrowerName: fullRequest.borrower_name,
          equipmentItems: enrichedItems,
          equipmentName: inv?.name ?? "Equipment",
          quantityRequested: fullRequest.quantity_requested,
          borrowDate: fullRequest.borrow_date,
          adminNotes: admin_notes || null,
          requestId: request_id,
        });
        sendEmail({ to: request.borrower_email, subject, html });
      }
    }

    return res.sendStatus(200);
  }),
);

router.post(
  "/return",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { request_id } = req.body;
    if (!request_id) throw new ApiError(400, "request_id is required.");

    const token = req.token;
    const userSupabase = createUserClient(token);

    const { data: request, error: reqError } = await userSupabase
      .from("borrowing_requests")
      .select("*")
      .eq("id", request_id)
      .single();
    if (reqError || !request) throw new ApiError(404, "Request not found.");
    if (request.status !== "approved") {
      throw new ApiError(400, "Only approved requests can be marked as returned.");
    }

    const { data: inventory, error: invError } = await userSupabase
      .from("inventory")
      .select("quantity")
      .eq("id", request.equipment_id)
      .single();
    if (invError || !inventory) throw new ApiError(404, "Equipment not found.");

    const newQty = inventory.quantity + request.quantity_requested;
    const { error: invUpdateError } = await userSupabase
      .from("inventory")
      .update({ quantity: newQty, is_available: newQty > 0 })
      .eq("id", request.equipment_id);
    if (invUpdateError) throw new ApiError(500, invUpdateError.message);

    const { error } = await userSupabase
      .from("borrowing_requests")
      .update({ status: "returned", actual_return: new Date().toISOString() })
      .eq("id", request_id);
    if (error) throw new ApiError(500, error.message);

    return res.sendStatus(200);
  }),
);

// ── Public availability (no auth) ────────────────────────────────────────────
// Returns only APPROVED borrow windows for a specific equipment item so
// the frontend calendar can shade dates as available / partial / fully booked.
// Pending requests do NOT block dates — students can continue submitting new
// requests for the same dates, and the Equipment Manager decides who is approved.

router.get(
  '/availability/:equipment_id',
  asyncHandler(async (req, res) => {
    const { equipment_id } = req.params;
    const { data, error } = await anonSupabase
      .from('borrowing_requests')
      .select('borrow_date, return_date, status, quantity_requested')
      .eq('equipment_id', equipment_id)
      .in('status', ['approved']);
    if (error) throw new ApiError(500, error.message);
    return res.status(200).json(data);
  }),
);

export default router;
