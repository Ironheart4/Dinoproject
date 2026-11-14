# Dashboard module

Personal dashboard data for the logged-in user.

| Layer | File |
|---|---|
| Schemas | `Dashboard.schemas.ts` |
| Repository | `Dashboard.repository.ts` |
| Service | `Dashboard.service.ts` |
| Controller | `Dashboard.controller.ts` |
| Routes | `Dashboard.routes.ts` |

Routes (all require login; see `docs/api-reference.md`):
- `GET /api/dashboard/stats`: profile, subscription (defaults to free), favorites count, quiz stats, activity streak
- `GET /api/dashboard/charts`: top 5 favorite dinosaur types, diet breakdown, quiz scores over time
- `GET /api/dashboard/activity`: favorites and quiz attempts, newest first

Rules: `summarizeScores` is a pure function (highest and rounded average); a missing type or diet is grouped as `Unknown`;
"activity streak" is the number of days since the account was created (kept from the old behavior).
