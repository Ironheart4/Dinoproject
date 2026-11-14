# Quizzes module

Quiz CRUD, random questions for quick quizzes, and personalized recommendations.

| Layer | File |
|---|---|
| Schemas | `Quizzes.schemas.ts` |
| Repository | `Quizzes.repository.ts` |
| Service | `Quizzes.service.ts` |
| Controller | `Quizzes.controller.ts` |
| Routes | `Quizzes.routes.ts` |

Routes (see `docs/api-reference.md`):
- `GET /api/quizzes`, `GET /api/quizzes/:id`, `GET /api/quiz/random?count=` (public)
- `GET /api/quizzes/recommend` (user)
- `POST /api/quizzes`, `PUT /api/quizzes/:id`, `DELETE /api/quizzes/:id` (admin)

Rules:
- `/api/quizzes/recommend` must stay registered before `/api/quizzes/:id`.
- `count` defaults to 10 when missing or invalid; more than 100 returns 400.
- Updating with `questions` replaces all questions inside one transaction. Omitting `questions` leaves them unchanged
  (the old code silently deleted them).
- Update or delete of a missing quiz returns 404 `Quiz not found` (previously a generic 500).
- Random questions use a Fisher-Yates shuffle (the old sort-based shuffle was biased).

Recommendation logic (`QuizzesService.recommendFor`): no scores gives a random quiz; otherwise the lowest score to retake;
if every score is 100, an untaken quiz when one exists.
Known legacy quirk kept on purpose: all scores 100 and no untaken quiz returns `recommendedQuiz: null`.

## Quiz-level type, image and difficulty (all optional)
A quiz needs only a `title`. `questionType`, `imageUrl` and `difficulty` can each be left out or sent as `null`;
an empty image URL is stored as `null`. On update, omitted fields stay unchanged and fields sent as `null` are cleared.
The image is mainly useful for `image` and `identify` quizzes, but it is never required.

`questionType`, `imageUrl` and `difficulty` are columns on the `quizzes` table (camelCase column names).
The API copies them onto every question it returns (`questionType` defaults to `text`, `difficulty` to `medium`),
so the quiz page keeps reading them per question. A consequence of the schema: all questions in one quiz share the
same type, image and difficulty. To make them per question, add the columns to `questions` instead.

Deleting a quiz also deletes its scores and questions in one transaction (the database foreign keys have no cascade).
