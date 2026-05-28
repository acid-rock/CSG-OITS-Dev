/**
 * Concurrent-viewer slot manager
 *
 * Maintains an in-memory map of active visitor tokens.
 * MAX_SLOTS simultaneous public viewers; extras receive their queue position
 * and poll /join every 15 s until a slot opens.
 *
 * Tokens expire after TOKEN_TTL_MS of no heartbeat (browser closed / away).
 *
 * ── Rate limiting design ───────────────────────────────────────────────────
 *
 * The global publicLimiter (100 req/15 min per IP) MUST NOT be applied to
 * this router. Here is why:
 *
 *   All CVSU students share a single public campus IP.
 *   With MAX_SLOTS=35 active holders + 15 queued users from that IP:
 *     heartbeats  = 35 × (900 s / 20 s) = 1,575 req / 15 min
 *     queue polls = 15 × (900 s / 15 s) =   900 req / 15 min
 *     total                              = 2,475 req / 15 min
 *
 *   100/15 min is exhausted in ~36 seconds.
 *   Once 429s fire on /heartbeat, those slots expire (60 s TTL),
 *   queued users get slots → their heartbeats also 429 → infinite churn
 *   → the 35-slot cap is effectively bypassed.
 *
 * Per-endpoint strategy:
 *
 *   /join      — NO IP rate limit.
 *                The slot cap (MAX_SLOTS) is the protection mechanism.
 *                Every /join call either (a) refreshes an existing token O(1),
 *                (b) grants a new slot O(1), or (c) returns a queue position O(1).
 *                A bot spamming /join only ever gets queue-position responses —
 *                it cannot create more than MAX_SLOTS total slots.
 *                Real DDoS protection at this layer = Cloudflare WAF (see README).
 *
 *   /heartbeat — NO IP rate limit. The token itself is the authorization gate.
 *                A bot without a valid slot token gets 410 instantly at O(1).
 *                A legitimate holder heartbeats every 20 s ≈ 3 req/min.
 *
 *   /leave     — NO rate limit. Releasing a slot is beneficial.
 *                A bot can only call this with tokens it legitimately holds.
 */

import { Router }     from "express";
import { randomUUID } from "crypto";

const router = Router();

// ── Slot config ───────────────────────────────────────────────────────────────

const MAX_SLOTS    = 35;       // concurrent public viewers
const TOKEN_TTL_MS = 60_000;  // 60 s — client must heartbeat every ~20 s

// Map<token, lastSeenTimestamp>
const slots = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────

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

   No IP rate limit — the slot cap IS the protection.
   Each call is O(n ≤ MAX_SLOTS) for eviction + O(1) for the response.
   Bots cannot create more than MAX_SLOTS slots regardless of call frequency.
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

   No IP rate limit — the token is the authorization gate.
   Invalid/missing tokens return 410 immediately at O(1) cost.
   Legitimate holders heartbeat every 20 s ≈ 45 req / 15 min — negligible.
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
