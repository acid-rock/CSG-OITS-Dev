# Authentication & Session Management

---

## Authentication method

Supabase Auth with email/password. On successful login, the backend issues two httpOnly cookies containing Supabase JWTs. All subsequent requests to protected endpoints include those cookies automatically.

---

## Login flow

```
1. Admin navigates to /admin/login
2. Enters email + password
3. Frontend: POST /api/v1/user/login { email, password }
   - withCredentials: true (sends/receives cookies)
4. Backend:
   a. validate(loginSchema) — Zod validates email format + non-empty password
   b. anonSupabase.auth.signInWithPassword({ email, password })
   c. On success → set two httpOnly cookies (see Cookie specification below)
   d. Return 200 { message: "Login successful." }
5. Frontend:
   a. localStorage.setItem('admin_authenticated', '1')  ← UI gate only
   b. navigate('/admin')
6. All subsequent admin API calls include sb_access_token cookie automatically
```

---

## Cookie specification

| Cookie | Value | httpOnly | Secure | SameSite | Max-Age |
|---|---|---|---|---|---|
| `sb_access_token` | Supabase JWT | Yes | Yes | Strict | 1 hour (3,600,000 ms) |
| `sb_refresh_token` | Supabase refresh token | Yes | Yes | Strict | 7 days (604,800,000 ms) |

**`httpOnly: true`** — JavaScript cannot read these cookies. `document.cookie` returns nothing for them. This prevents XSS from stealing session tokens.

**`secure: true`** — Cookies are only sent over HTTPS. This is why **local development requires HTTPS** (via mkcert). The browser will not send the cookie over plain HTTP.

**`sameSite: 'strict'`** — Cookies are only sent when the request originates from the same site as the cookie domain. Prevents CSRF.

---

## `requireAuth` middleware

Source: `backend/src/middlewares/auth.middleware.js`

Applied to every write endpoint and protected read endpoint. The middleware:

1. Reads `sb_access_token` from `req.cookies`.
2. If both `sb_access_token` and `sb_refresh_token` are absent: returns `403 { message: "Not authenticated." }`.
3. Calls `jwt.verify(accessToken, SUPABASE_JWT_SECRET)`.
4. On success: sets `req.user = payload` and `req.token = accessToken`, calls `next()`.
5. On JWT error (expired or invalid):
   - If no refresh token: returns `401 { error: "Session expired" }`.
   - If refresh token exists: calls `supabase.auth.refreshSession({ refresh_token })`.
     - On refresh success: sets new `sb_access_token` (1 h) and `sb_refresh_token` (7 d) cookies in the response, sets `req.user = data.session.user`, calls `next()`.
     - On refresh failure: returns `401 { error: "Session expired" }`.

### `req.user` shape after successful auth

```js
// When verified from JWT payload:
req.user = {
  sub: 'supabase-user-uuid',
  email: 'admin@cvsu.edu.ph',
  aud: 'authenticated',
  role: 'authenticated',
  exp: 1234567890,
  // ...other Supabase JWT claims
}

// When set from refreshed session:
req.user = {
  id: 'supabase-user-uuid',
  email: 'admin@cvsu.edu.ph',
  user_metadata: { full_name: 'Juan' },
  // ...full Supabase User object
}
```

**`req.token`** is also set to the raw access token string, used by `createUserClient(token)` for user-scoped Supabase operations.

---

## Session expiry handling

The `AdminPage.tsx` axios instance has an interceptor:

```tsx
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setSessionExpired(true);  // shows SessionExpiredModal
    }
    return Promise.reject(error);
  }
);
```

`SessionExpiredModal` shows a full-screen overlay with a "Go to Login" button. Clicking it:
1. Removes `localStorage.getItem('admin_authenticated')`.
2. Navigates to `/admin/login`.

---

## ProtectedRoute

Source: `frontend/src/admin/ProtectedRoute.tsx`

```tsx
const isAuthenticated = localStorage.getItem('admin_authenticated') === '1';

if (!isAuthenticated) {
  return <AccessRestrictedScreen />;  // shows "Access Restricted" + login button
}

return <AdminPage />;
```

**This is a UI gate only.** The httpOnly cookie is the real security boundary. `ProtectedRoute` just prevents the admin UI from rendering for unauthenticated users — it cannot verify the session (httpOnly cookies cannot be read by JavaScript). The backend's `requireAuth` middleware enforces actual authentication on every API call.

---

## Admin registration

**Endpoint:** `POST /api/v1/user/register`
**Auth required:** Yes (existing admin must be logged in)

The registering admin must have a valid session. The backend uses `supabase.auth.admin.createUser()` (service key) to create the new account.

**Password requirements** (from `registerSchema`):
- Minimum 8 characters
- Maximum 72 characters
- At least one uppercase letter
- At least one number
- Valid email address

After creation, a row is inserted into `profiles` with `owner_id` and `role`. The new account requires **email confirmation** from Supabase before it can log in.

---

## Forgot password

**Endpoint:** `POST /api/v1/user/forgot-password`
**Auth required:** No

Always returns 200 regardless of whether the email exists. This avoids user enumeration — an attacker cannot confirm which emails have accounts.

Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: FRONTEND_URL/admin/reset-password })`. Supabase sends a one-time link to the email.

---

## Reset password

**Endpoint:** `POST /api/v1/user/reset-password`
**Auth required:** No (uses one-time `access_token` from the email link)

The reset link from Supabase includes a token in the URL fragment. The frontend extracts it and passes it as `access_token` in the request body along with `new_password`.

**Validation:** `new_password` must be ≥ 8 characters; `access_token` must be provided.

---

## Change password (while logged in)

**Endpoint:** `POST /api/v1/user/change-password`
**Auth required:** Yes

The backend:
1. Verifies `requireAuth`.
2. Fetches the logged-in user's email via `createUserClient(token).auth.getUser()`.
3. Re-authenticates with `current_password` via `anonSupabase.auth.signInWithPassword()` to confirm identity.
4. If re-auth fails: returns `401 { error: "Current password is incorrect." }`.
5. On success: calls `userClient.auth.updateUser({ password: new_password })`.

---

## Logout

**Endpoint:** `POST /api/v1/user/logout`
**Auth required:** No

Clears both httpOnly cookies with the same attributes used to set them (`httpOnly`, `secure`, `sameSite: 'strict'`). Returns 200.

---

## Local development note

`secure: true` on cookies requires HTTPS. In local development, the browser will refuse to set or send cookies over plain `http://localhost`. You must configure local HTTPS using **mkcert**.

See [docs/local-setup.md](local-setup.md) → Step 3 for the mkcert setup instructions.

Without HTTPS locally:
- `POST /user/login` will succeed on the backend (200 response)
- But the cookies will not be stored by the browser
- All subsequent admin API calls will return 403 ("Not authenticated")
