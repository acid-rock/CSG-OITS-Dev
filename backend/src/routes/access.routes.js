/**
 * Concurrent-viewer slot manager
 *
 * Maintains an in-memory map of active visitor tokens.
 * Max 10 simultaneous public viewers; extras receive their queue position
 * and must poll /join until a slot opens.
 *
 * Tokens expire after TOKEN_TTL_MS of no heartbeat (browser closed / away).
 */
import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const MAX_SLOTS    = 10;
const TOKEN_TTL_MS = 60_000; // 60 s — client must heartbeat every ~20 s

// Map<token, lastSeenTimestamp>
const slots = new Map();

// Evict tokens that haven't sent a heartbeat within TTL
function evictExpired() {
  const cutoff = Date.now() - TOKEN_TTL_MS;
  for (const [token, lastSeen] of slots) {
    if (lastSeen < cutoff) slots.delete(token);
  }
}

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/access/join
   Body (optional): { token }
   Returns: { allowed, token, position? }
───────────────────────────────────────────────────────────────── */
router.post("/join", (req, res) => {
  evictExpired();

  const existing = req.body?.token;

  // If client already holds a valid slot, just refresh and confirm
  if (existing && slots.has(existing)) {
    slots.set(existing, Date.now());
    return res.json({ allowed: true, token: existing });
  }

  if (slots.size < MAX_SLOTS) {
    const token = randomUUID();
    slots.set(token, Date.now());
    return res.json({ allowed: true, token });
  }

  // Over capacity — return position in queue (1-based, after current holders)
  const position = slots.size - MAX_SLOTS + 1;
  return res.json({ allowed: false, position });
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/access/heartbeat
   Body: { token }
   Returns: { ok }
───────────────────────────────────────────────────────────────── */
router.post("/heartbeat", (req, res) => {
  const { token } = req.body ?? {};
  if (token && slots.has(token)) {
    slots.set(token, Date.now());
    return res.json({ ok: true });
  }
  // Token gone (expired) — client should re-join
  return res.status(410).json({ ok: false, reason: "token_expired" });
});

/* ─────────────────────────────────────────────────────────────────
   POST /api/v1/access/leave
   Body: { token }
   Returns 204
───────────────────────────────────────────────────────────────── */
router.post("/leave", (req, res) => {
  const { token } = req.body ?? {};
  if (token) slots.delete(token);
  return res.sendStatus(204);
});

export default router;
