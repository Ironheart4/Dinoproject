# Health module

Public liveness and database readiness checks.

| Layer | File |
|---|---|
| Schemas | `Health.schemas.ts` |
| Repository | `Health.repository.ts` |
| Service | `Health.service.ts` |
| Controller | `Health.controller.ts` |
| Routes | `Health.routes.ts` |

- `GET /health` — process up
- `GET /health/db` — Prisma connectivity (`503` when DB is missing or failing)

Auth: public (no middleware). Paths and response shapes match the Phase 1 contract.
