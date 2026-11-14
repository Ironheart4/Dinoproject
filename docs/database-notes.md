# Database notes

The live schema is the source of truth; `prisma/schema.prisma` must match it. Review any schema change by hand before it is
applied to the shared database.

## Quiz presentation columns (table `quizzes`)
`questionType`, `imageUrl` and `difficulty` are columns on `quizzes` (camelCase names, quoted in SQL).

Verify the exact column names in your database:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'quizzes'
order by ordinal_position;
```

If they exist as lowercase (`questiontype`, `imageurl`), either rename them or change the `@map(...)` values on the `Quiz`
model. To create them when missing:

```sql
alter table public.quizzes add column if not exists "questionType" text;
alter table public.quizzes add column if not exists "imageUrl" text;
alter table public.quizzes add column if not exists "difficulty" text;
```

Because these live on the quiz, all questions in a quiz share one type, image and difficulty. To make them per question,
add the same three columns to `questions` and move the fields in the quiz module.

## Foreign keys have no ON DELETE CASCADE
The live foreign keys do not cascade, so deleting a parent row with children fails. The repositories delete children
explicitly inside a transaction (quiz: scores and questions; dinosaur: favorites). To let the database do it instead:

```sql
alter table public.questions drop constraint questions_quiz_id_fkey,
  add constraint questions_quiz_id_fkey foreign key (quiz_id) references public.quizzes(id) on delete cascade;
alter table public.scores drop constraint scores_quiz_id_fkey,
  add constraint scores_quiz_id_fkey foreign key (quiz_id) references public.quizzes(id) on delete cascade;
alter table public.favorites drop constraint favorites_dino_id_fkey,
  add constraint favorites_dino_id_fkey foreign key (dino_id) references public.dinosaurs(id) on delete cascade;
```

## Other constraints worth knowing
- `dinosaurs.species` is unique; `dinosaurs.model_url` is required (the API stores `DEV_PENDING` when none is given).
- `scores.score` must be 0 to 100.
- `subscriptions.user_id` is unique (one subscription per user).
