/**
 * Global axios configuration — imported once for its side effects in main.tsx.
 *
 * The codebase calls the API via the raw `axios` default instance (each admin
 * call passes `withCredentials: true` per-call), so a single global request
 * interceptor is the one place that can attach the CSRF token to every request
 * without touching dozens of call sites.
 *
 * CSRF model (double-submit cookie):
 *   - On login the backend sets a non-httpOnly `csrf_token` cookie.
 *   - This interceptor reads that cookie and echoes it in the `X-CSRF-Token`
 *     header on every request.
 *   - The backend `requireAuth` middleware compares header vs cookie on unsafe
 *     methods (POST/PUT/PATCH/DELETE) and rejects mismatches with 403.
 * A forged cross-site request carries the cookies but cannot read the
 * csrf_token value to replay it in the header, so it fails the check.
 */
import axios from "axios";

function readCookie(name: string): string | null {
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + escaped + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

axios.interceptors.request.use((config) => {
  const token = readCookie("csrf_token");
  if (token) {
    config.headers.set("X-CSRF-Token", token);
  }
  return config;
});
