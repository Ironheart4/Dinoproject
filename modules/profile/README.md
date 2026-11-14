# Profile module

The logged-in user's own details, name and bio, and profile picture.

| Layer | File |
|---|---|
| Schemas | `Profile.schemas.ts` |
| Repository | `Profile.repository.ts` |
| Service | `Profile.service.ts` |
| Controller | `Profile.controller.ts` |
| Routes | `Profile.routes.ts` |

Routes (all require login; see `docs/api-reference.md`):
- `GET /api/user/me`, `PUT /api/user/profile`
- `POST /api/user/profile-pic` (multipart field `profilePic`), `DELETE /api/user/profile-pic`

Rules:
- Pictures go through the `StorageProvider` interface (Supabase Storage bucket, set by `SUPABASE_PROFILE_BUCKET`), never local disk.
- jpeg, png, webp and gif up to 5 MB; a wrong type or a too-large file returns 400 (previously a 500).
- The previous picture is deleted after a new one is saved. The old code never matched full public URLs, so old
  files were never deleted; the path is now extracted correctly.
- If saving the new URL fails, the freshly uploaded file is removed again.
- An empty `name` is ignored; `name` is limited to 100 characters (database limit) and `bio` to 2000.
