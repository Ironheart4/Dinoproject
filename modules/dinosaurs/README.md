# Dinosaurs module

Encyclopedia data: public reads, admin-only writes.

| Layer | File |
|---|---|
| Schemas | `Dinosaurs.schemas.ts` |
| Repository | `Dinosaurs.repository.ts` |
| Service | `Dinosaurs.service.ts` |
| Controller | `Dinosaurs.controller.ts` |
| Routes | `Dinosaurs.routes.ts` |

Routes (see `docs/api-reference.md`):
- `GET /api/dinosaurs`, `GET /api/dinosaurs/featured`, `GET /api/dinosaurs/:id` (public)
- `POST /api/dinosaurs`, `PUT /api/dinosaurs/:id`, `DELETE /api/dinosaurs/:id` (admin)

Rules:
- `name` and `species` are required on create and update (400 otherwise).
- Empty or missing `lengthMeters` / `weightKg` are stored as null; non-numeric values return 400.
- `modelUrl` is a required database column; a blank value is stored as `DEV_PENDING` (the app-wide "no model yet" placeholder).
- A duplicate `species` (unique) returns 409 `A dinosaur with this species already exists`.
- Deleting a dinosaur also deletes its favorites in one transaction (the database foreign key has no cascade).
- Update or delete of a missing id returns 404 `Dinosaur not found` (previously a generic 500).
- `/featured` must stay registered before `/:id`.

Errors: `BadRequestError`, `NotFoundError`, `ServiceUnavailableError` (database not ready).
