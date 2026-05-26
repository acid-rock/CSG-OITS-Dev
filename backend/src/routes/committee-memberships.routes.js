import { Router } from 'express';
import { supabase, anonSupabase } from '../lib/supabaseClient.js';
import asyncHandler from 'express-async-handler';
import { requireAuth } from '../middlewares/auth.middleware.js';
import ApiError from '../lib/apiError.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  addMembershipSchema,
  editMembershipSchema,
  singleIdSchema,
} from '../schemas/index.js';
import { invalidateCachePrefix } from '../lib/cache.js';

const router = Router();

// ── GET /api/v1/memberships?officer_id=:id ────────────────────────────────────
// Public — returns all committee memberships for a specific officer (or all)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { officer_id } = req.query;

    let query = anonSupabase
      .from('committee_memberships')
      .select('*, committees(id, name)')
      .order('created_at', { ascending: true });

    if (officer_id) {
      if (typeof officer_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(officer_id)) {
        throw new ApiError(400, 'Invalid officer_id format');
      }
      query = query.eq('officer_id', officer_id);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    return res.json(data);
  }),
);

// ── POST /api/v1/memberships/add ──────────────────────────────────────────────
router.post(
  '/add',
  requireAuth,
  validate(addMembershipSchema),
  asyncHandler(async (req, res) => {
    const { officer_id, committee_id, role_title, is_official } = req.body;

    const { data, error } = await supabase
      .from('committee_memberships')
      .insert({ officer_id, committee_id, role_title, is_official })
      .select('*, committees(id, name)')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError(409, 'This officer already has a membership in that committee.');
      }
      throw new ApiError(500, 'Failed to add membership: ' + error.message);
    }

    invalidateCachePrefix('officers:');
    return res.status(201).json(data);
  }),
);

// ── POST /api/v1/memberships/edit ─────────────────────────────────────────────
router.post(
  '/edit',
  requireAuth,
  validate(editMembershipSchema),
  asyncHandler(async (req, res) => {
    const { id, role_title, is_official } = req.body;

    const updates = {};
    if (role_title !== undefined) updates.role_title = role_title;
    if (is_official !== undefined) updates.is_official = is_official;

    if (Object.keys(updates).length === 0) return res.sendStatus(200);

    const { error } = await supabase
      .from('committee_memberships')
      .update(updates)
      .eq('id', id);

    if (error) throw new ApiError(500, 'Failed to update membership: ' + error.message);

    invalidateCachePrefix('officers:');
    return res.sendStatus(200);
  }),
);

// ── DELETE /api/v1/memberships/delete ────────────────────────────────────────
router.delete(
  '/delete',
  requireAuth,
  validate(singleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.body;

    const { error } = await supabase
      .from('committee_memberships')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, 'Failed to delete membership: ' + error.message);

    invalidateCachePrefix('officers:');
    return res.sendStatus(200);
  }),
);

export default router;
