/**
 * Global axios configuration — imported once for its side effects in main.tsx.
 *
 * The codebase calls the API via the raw `axios` default instance (each admin
 * call passes `withCredentials: true` per-call), so a single global request
 * interceptor is the one place that can attach the CSRF token to every request
 * without touching dozens of call sites.
 *
 * CSRF model (double-submit token, cross-site aware):
 *   - On login the backend sets a `csrf_token` cookie AND returns the same token
 *     in the response body. Because the frontend (vercel.app) and backend
 *     (onrender.com) are different sites, frontend JS cannot read the backend's
 *     cookie via document.cookie — so the token is delivered via the response
 *     body instead and stored here.
 *   - GET /user/me returns the current token (rehydration after a reload).
 *   - This interceptor echoes the stored token in the `X-CSRF-Token` header on
 *     every request; the backend `requireAuth` middleware compares header vs
 *     cookie on unsafe methods (POST/PUT/PATCH/DELETE) and rejects mismatches.
 * A forged cross-site request carries the cookie but cannot read the token (it
 * is only ever exposed through CORS-protected response bodies) to replay it.
 */
import axios from "axios";

const STORAGE_KEY = "csrf_token";

// Seed from sessionStorage so a reload before /user/me resolves is still covered.
let csrfToken: string | null = sessionStorage.getItem(STORAGE_KEY);

/** Store the CSRF token (called after login and after GET /user/me). */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
  if (token) {
    sessionStorage.setItem(STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

axios.interceptors.request.use((config) => {
  if (csrfToken) {
    config.headers.set("X-CSRF-Token", csrfToken);
  }
  return config;
});
