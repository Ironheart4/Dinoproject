# Forum module

Community discussion: categories, posts and replies.

| Layer | File |
|---|---|
| Schemas | `Forum.schemas.ts` |
| Repository | `Forum.repository.ts` |
| Service | `Forum.service.ts` |
| Controller | `Forum.controller.ts` |
| Routes | `Forum.routes.ts` |

Routes (see `docs/api-reference.md`):
- `GET /api/forum/categories`, `/api/forum/posts/recent`, `/api/forum/category/:slug`, `/api/forum/post/:id` (public)
- `POST /api/forum/posts`, `POST /api/forum/posts/:id/replies` (user)

Rules:
- Titles up to 200 and content up to 10,000 characters; both are stored trimmed.
- Opening a post counts a view; an unknown post returns 404 `Post not found` (previously a 500).
- Posting to an unknown category returns 404 `Category not found`.
- Replies to an unknown post return 404; replies to a locked post return 403 `This post is locked`.
- A reply and the post's reply count are saved in one transaction.
