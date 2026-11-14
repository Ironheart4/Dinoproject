# Auth module

Registration, login, token refresh, logout and "who am I". Supabase Auth owns passwords and tokens
(behind the `AuthProvider` interface); our `users` table owns the role and profile.

| Layer | File |
|---|---|
| Schemas | `Auth.schemas.ts` |
| Repository | `Auth.repository.ts` |
| Service | `Auth.service.ts` |
| Controller | `Auth.controller.ts` |
| Routes | `Auth.routes.ts` |

Routes (see `docs/api-reference.md`):
- `POST /api/auth/register`, `POST /api/auth/login` (public, rate limited)
- `POST /api/auth/logout`, `POST /api/auth/refresh` (public)
- `GET /api/auth/me` (user)

Rules:
- Registration checks, in order: name, email and password present; password at least 6 characters; email contains `@`;
  name at most 100 characters (database limit).
- A user who signed up but has no profile row gets one on first login or first authenticated request
  (`AuthRepository.findOrCreateUser`, safe under concurrent first requests).
- Duplicate profile rows return 400 `User already exists`.
- Logout calls Supabase `signOut` on the server client. Access tokens are stateless JWTs and stay valid until they
  expire; revoking them early would need a Supabase admin sign-out.
- The `authMiddleware` (`middleware/auth.ts`) verifies the bearer token through `AuthProvider` and loads or creates the
  profile through `AuthRepository`.
