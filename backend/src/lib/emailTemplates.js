/**
 * CSG-OITS Email Templates
 *
 * Design tokens (mirrors frontend/src/styles/tokens.css):
 *   --color-primary      #4F6EF7   primary blue
 *   --color-primary-dark #3D5CE8   hover / dark blue
 *   --color-footer-bg    #2D3A6B   dark navy (header + footer)
 *   --color-background   #F8F9FF   page background
 *   --color-surface      #FFFFFF   card surface
 *   --color-border       #E8EAF0   border
 *   --color-text-primary #0D1117
 *   --color-text-secondary #374151
 *   --color-text-muted   #6B7280
 *   --color-success      #16A34A
 *   --color-danger       #DC2626
 *
 * Font: Plus Jakarta Sans (web font reference) with Arial fallback.
 * Layout: table-based for maximum email-client compatibility.
 * CSS: fully inlined — no <style> blocks (Gmail strips them).
 */

const FONT = "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";
const NAVY = "#2D3A6B";
const PRIMARY = "#4F6EF7";
const PRIMARY_DARK = "#3D5CE8";
const BG = "#F8F9FF";
const SURFACE = "#FFFFFF";
const BORDER = "#E8EAF0";
const TEXT = "#0D1117";
const TEXT_SEC = "#374151";
const TEXT_MUTED = "#6B7280";
const SUCCESS = "#16A34A";
const SUCCESS_BG = "#DCFCE7";
const DANGER = "#DC2626";
const DANGER_BG = "#FEE2E2";
const WARN = "#D97706";
const WARN_BG = "#FEF3C7";

const LOGO_URL = `${process.env.FRONTEND_URL || ""}/CSG_logo.svg`;
const SITE_URL = process.env.FRONTEND_URL || "#";

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Formats a date string (YYYY-MM-DD) to "Month D, YYYY" */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Wraps content in the shared CSG header + footer shell */
function shell(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <title>CSG-OITS Notification</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${BG};padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card (max 600px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(13,17,23,0.10),0 1px 4px rgba(13,17,23,0.06);">

          <!-- ══ HEADER ════════════════════════════════════════════════════════ -->
          <tr>
            <td bgcolor="${NAVY}" align="center"
                style="padding:32px 40px 28px;background-color:${NAVY};">

              <!-- Logo row -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="padding-right:12px;">
                    <!-- SVG logo — renders in most clients; Gmail falls back to alt text -->
                    <img src="${LOGO_URL}" alt="CSG" width="44" height="44"
                         style="display:block;width:44px;height:44px;border:none;
                                border-radius:50%;background-color:rgba(255,255,255,0.15);
                                padding:4px;" />
                  </td>
                  <td align="left" valign="middle">
                    <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;
                               letter-spacing:0.08em;text-transform:uppercase;
                               color:rgba(255,255,255,0.65);line-height:1.2;">
                      Central Student Government
                    </p>
                    <p style="margin:2px 0 0;font-family:${FONT};font-size:11px;
                               font-weight:400;color:rgba(255,255,255,0.50);line-height:1.2;">
                      Cavite State University – Imus Campus
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-top:20px;">
                <tr>
                  <td style="height:1px;background-color:rgba(255,255,255,0.15);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- System label -->
              <p style="margin:16px 0 0;font-family:${FONT};font-size:12px;font-weight:600;
                         letter-spacing:0.06em;text-transform:uppercase;
                         color:rgba(255,255,255,0.55);">
                Online Information Transparency System
              </p>
            </td>
          </tr>

          <!-- ══ BODY ══════════════════════════════════════════════════════════ -->
          <tr>
            <td bgcolor="${SURFACE}" style="padding:40px;background-color:${SURFACE};">
              ${bodyContent}
            </td>
          </tr>

          <!-- ══ FOOTER ════════════════════════════════════════════════════════ -->
          <tr>
            <td bgcolor="${NAVY}" align="center"
                style="padding:24px 40px;background-color:${NAVY};">
              <p style="margin:0;font-family:${FONT};font-size:12px;
                         color:rgba(255,255,255,0.50);line-height:1.6;text-align:center;">
                This is an automated message from the CSG Online Information Transparency System.
                <br />Please do not reply to this email.
              </p>
              <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;
                         color:rgba(255,255,255,0.35);text-align:center;">
                &copy; ${new Date().getFullYear()} Central Student Government &nbsp;&middot;&nbsp;
                CvSU Imus Campus
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}" style="color:rgba(255,255,255,0.50);text-decoration:none;">
                  Visit CSG-OITS
                </a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Email wrapper -->

</body>
</html>`;
}

/** A horizontal detail row inside a details table */
function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 16px;font-family:${FONT};font-size:13px;
                 font-weight:600;color:${TEXT_MUTED};white-space:nowrap;
                 border-bottom:1px solid ${BORDER};width:160px;">
        ${label}
      </td>
      <td style="padding:10px 16px;font-family:${FONT};font-size:13px;
                 color:${TEXT};border-bottom:1px solid ${BORDER};">
        ${value || "—"}
      </td>
    </tr>`;
}

/** Wraps detail rows in a styled table */
function detailsTable(rows) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="border:1px solid ${BORDER};border-radius:8px;overflow:hidden;
                  margin-top:24px;border-collapse:collapse;">
      ${rows}
    </table>`;
}

/** Status badge pill */
function badge(text, color, bg) {
  return `<span style="display:inline-block;padding:4px 14px;border-radius:999px;
                        font-family:${FONT};font-size:12px;font-weight:700;
                        letter-spacing:0.06em;text-transform:uppercase;
                        color:${color};background-color:${bg};">${text}</span>`;
}

/** Primary CTA button */
function button(text, href) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"
           style="margin-top:28px;">
      <tr>
        <td bgcolor="${PRIMARY}" align="center"
            style="border-radius:10px;background-color:${PRIMARY};">
          <a href="${href}"
             style="display:inline-block;padding:14px 32px;
                    font-family:${FONT};font-size:14px;font-weight:700;
                    color:#FFFFFF;text-decoration:none;border-radius:10px;
                    background-color:${PRIMARY};">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Builds a readable equipment list string from equipment_items or falls back to single name */
function buildEquipmentList(equipmentItems, fallbackName, fallbackQty) {
  if (Array.isArray(equipmentItems) && equipmentItems.length > 0) {
    return equipmentItems
      .map((item) => `${item.quantity_requested}× ${item.name || item.equipment_id}`)
      .join(", ");
  }
  return fallbackQty ? `${fallbackQty}× ${fallbackName || "—"}` : (fallbackName || "—");
}

// ── Template 1: Submission Confirmation ──────────────────────────────────────

/**
 * Sent to the student immediately after they submit a borrow request.
 *
 * @param {{
 *   borrowerName: string,
 *   borrowerEmail: string,
 *   equipmentItems: Array<{name:string, quantity_requested:number}>,
 *   equipmentName: string,
 *   quantityRequested: number,
 *   borrowDate: string,
 *   organization?: string,
 *   activityName?: string,
 *   requestId: string,
 * }} data
 */
export function submissionConfirmationEmail(data) {
  const {
    borrowerName,
    equipmentItems,
    equipmentName,
    quantityRequested,
    borrowDate,
    organization,
    activityName,
    requestId,
  } = data;

  const equipList = buildEquipmentList(equipmentItems, equipmentName, quantityRequested);
  const shortId = requestId ? requestId.substring(0, 8).toUpperCase() : "—";

  const body = `
    <!-- Title + badge -->
    <p style="margin:0 0 8px;font-family:${FONT};font-size:24px;font-weight:800;
               color:${TEXT};line-height:1.2;">
      Request Received
    </p>
    ${badge("Pending Review", PRIMARY, "#EEF1FE")}

    <!-- Greeting -->
    <p style="margin:24px 0 0;font-family:${FONT};font-size:15px;color:${TEXT_SEC};
               line-height:1.7;">
      Hi <strong style="color:${TEXT};">${borrowerName}</strong>,
    </p>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:15px;color:${TEXT_SEC};
               line-height:1.7;">
      Your equipment borrow request has been received. The CSG Property Manager
      will review it and get back to you within <strong style="color:${TEXT};">24 hours</strong>
      through this email or your provided contact number.
    </p>

    <!-- Details -->
    ${detailsTable(`
      ${detailRow("Reference No.", `<span style="font-family:'Courier New',monospace;font-weight:700;">#${shortId}</span>`)}
      ${detailRow("Equipment", equipList)}
      ${detailRow("Date of Use", formatDate(borrowDate))}
      ${organization ? detailRow("Organization", organization) : ""}
      ${activityName ? detailRow("Activity", activityName) : ""}
    `)}

    <!-- Note -->
    <p style="margin:24px 0 0;font-family:${FONT};font-size:13px;color:${TEXT_MUTED};
               line-height:1.7;padding:16px;background-color:${BG};
               border-radius:8px;border-left:3px solid ${PRIMARY};">
      Keep this email for your records. If you need to follow up, you can visit the
      CSG office and provide your reference number <strong>#${shortId}</strong>.
    </p>

    ${button("Browse Equipment", `${SITE_URL}/borrow`)}
  `;

  return {
    subject: `Equipment Request Received – Reference #${shortId} | CSG-OITS`,
    html: shell(body),
  };
}

// ── Template 2: Approval Notification ────────────────────────────────────────

/**
 * Sent to the student when an admin approves their borrow request.
 *
 * @param {{
 *   borrowerName: string,
 *   equipmentItems: Array<{name:string, quantity_requested:number}>,
 *   equipmentName: string,
 *   quantityRequested: number,
 *   borrowDate: string,
 *   returnDate?: string,
 *   adminNotes?: string,
 *   requestId: string,
 * }} data
 */
export function approvalEmail(data) {
  const {
    borrowerName,
    equipmentItems,
    equipmentName,
    quantityRequested,
    borrowDate,
    returnDate,
    adminNotes,
    requestId,
  } = data;

  const equipList = buildEquipmentList(equipmentItems, equipmentName, quantityRequested);
  const shortId = requestId ? requestId.substring(0, 8).toUpperCase() : "—";

  const body = `
    <!-- Title + badge -->
    <p style="margin:0 0 8px;font-family:${FONT};font-size:24px;font-weight:800;
               color:${TEXT};line-height:1.2;">
      Request Approved
    </p>
    ${badge("Approved", SUCCESS, SUCCESS_BG)}

    <!-- Greeting -->
    <p style="margin:24px 0 0;font-family:${FONT};font-size:15px;color:${TEXT_SEC};
               line-height:1.7;">
      Hi <strong style="color:${TEXT};">${borrowerName}</strong>,
    </p>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:15px;color:${TEXT_SEC};
               line-height:1.7;">
      Great news! Your equipment borrow request has been
      <strong style="color:${SUCCESS};">approved</strong> by the CSG Property Manager.
      Please coordinate with the CSG office to pick up the equipment on your scheduled date.
    </p>

    <!-- Details -->
    ${detailsTable(`
      ${detailRow("Reference No.", `<span style="font-family:'Courier New',monospace;font-weight:700;">#${shortId}</span>`)}
      ${detailRow("Equipment", equipList)}
      ${detailRow("Date of Use", formatDate(borrowDate))}
      ${returnDate ? detailRow("Return By", formatDate(returnDate)) : ""}
      ${adminNotes ? detailRow("Note from CSG", `<em style="color:${TEXT_SEC};">"${adminNotes}"</em>`) : ""}
    `)}

    <!-- Reminder box -->
    <p style="margin:24px 0 0;font-family:${FONT};font-size:13px;color:${TEXT_SEC};
               line-height:1.7;padding:16px;background-color:${SUCCESS_BG};
               border-radius:8px;border-left:3px solid ${SUCCESS};">
      <strong style="color:${SUCCESS};">Reminders:</strong><br />
      Please return all equipment in good condition by the return date.
      You may be held liable for any loss or damage to the borrowed items.
    </p>

    ${button("Visit CSG-OITS", SITE_URL)}
  `;

  return {
    subject: `Your Equipment Request Has Been Approved – #${shortId} | CSG-OITS`,
    html: shell(body),
  };
}

// ── Template 3: Rejection Notification ───────────────────────────────────────

/**
 * Sent to the student when an admin rejects their borrow request.
 *
 * @param {{
 *   borrowerName: string,
 *   equipmentItems: Array<{name:string, quantity_requested:number}>,
 *   equipmentName: string,
 *   quantityRequested: number,
 *   borrowDate: string,
 *   adminNotes?: string,
 *   requestId: string,
 * }} data
 */
export function rejectionEmail(data) {
  const {
    borrowerName,
    equipmentItems,
    equipmentName,
    quantityRequested,
    borrowDate,
    adminNotes,
    requestId,
  } = data;

  const equipList = buildEquipmentList(equipmentItems, equipmentName, quantityRequested);
  const shortId = requestId ? requestId.substring(0, 8).toUpperCase() : "—";

  const body = `
    <!-- Title + badge -->
    <p style="margin:0 0 8px;font-family:${FONT};font-size:24px;font-weight:800;
               color:${TEXT};line-height:1.2;">
      Request Not Approved
    </p>
    ${badge("Not Approved", DANGER, DANGER_BG)}

    <!-- Greeting -->
    <p style="margin:24px 0 0;font-family:${FONT};font-size:15px;color:${TEXT_SEC};
               line-height:1.7;">
      Hi <strong style="color:${TEXT};">${borrowerName}</strong>,
    </p>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:15px;color:${TEXT_SEC};
               line-height:1.7;">
      We regret to inform you that your equipment borrow request could not be approved
      at this time. Please see the details below.
    </p>

    <!-- Details -->
    ${detailsTable(`
      ${detailRow("Reference No.", `<span style="font-family:'Courier New',monospace;font-weight:700;">#${shortId}</span>`)}
      ${detailRow("Equipment", equipList)}
      ${detailRow("Date of Use", formatDate(borrowDate))}
      ${adminNotes
        ? detailRow("Reason", `<em style="color:${TEXT_SEC};">"${adminNotes}"</em>`)
        : detailRow("Reason", `<span style="color:${TEXT_MUTED};">No reason provided. Please contact the CSG office for more information.</span>`)}
    `)}

    <!-- Re-apply note -->
    <p style="margin:24px 0 0;font-family:${FONT};font-size:13px;color:${TEXT_SEC};
               line-height:1.7;padding:16px;background-color:${WARN_BG};
               border-radius:8px;border-left:3px solid ${WARN};">
      <strong style="color:${WARN};">What you can do:</strong><br />
      If you believe this decision was made in error, or if your situation has changed,
      you may visit the CSG office or submit a new request through CSG-OITS.
    </p>

    ${button("Submit a New Request", `${SITE_URL}/borrow`)}
  `;

  return {
    subject: `Your Equipment Request Was Not Approved – #${shortId} | CSG-OITS`,
    html: shell(body),
  };
}
