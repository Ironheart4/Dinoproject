# AI module (DinoBot)

Dinosaur Q&A for every logged-in user. No premium or donor subscription is required.

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
- Access: any authenticated user. The route still requires login and runs the AI rate limiter first.
- `message`: non-empty, at most 2,000 characters.
- The external model sits behind the `AiProvider` interface (`infrastructure/ai`). The Hugging Face provider calls the
  OpenAI-compatible router (`https://router.huggingface.co/v1/chat/completions`), owns the system prompt, response
  formatting and its 30-minute cache. Set `HUGGINGFACE_MODEL` to override the default model.
- The assistant never fails the user: provider errors, empty answers and rate limits fall back to a matching dinosaur
  from the database, then to the built-in FAQ. Only "model still loading" returns 503 with `estimatedTime`.
- Responses: `{ response }`, plus `cached: true` or `rateLimited: true` when applicable.
