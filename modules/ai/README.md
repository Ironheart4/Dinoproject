# AI module (DinoBot)

Dinosaur Q&A for Premium and Donor members.

| Layer | File |
|---|---|
| Schemas | `Ai.schemas.ts` |
| FAQ answers (pure) | `Ai.faq.ts` |
| Repository | `Ai.repository.ts` |
| Offline responder | `Ai.localResponder.ts` |
| Service | `Ai.service.ts` |
| Controller | `Ai.controller.ts` |
| Routes | `Ai.routes.ts` |

Route (see `docs/api-reference.md`): `POST /api/ai/chat` with `{ message }`, rate-limited, login required.

Rules:
- Access: admins, or an active premium/donor subscription that has not expired (`core/subscriptionAccess.ts`,
  the same rule the favorites limit uses). Others get 403 `Premium required`.
- `message`: non-empty, at most 2,000 characters.
- The external model sits behind the `AiProvider` interface (`infrastructure/ai`). The Hugging Face provider owns the
  prompt building, response formatting and its 30-minute cache.
- The assistant never fails the user: provider errors, empty answers and rate limits fall back to a matching dinosaur
  from the database, then to the built-in FAQ. Only "model still loading" returns 503 with `estimatedTime`.
- Responses: `{ response }`, plus `cached: true` or `rateLimited: true` when applicable.
