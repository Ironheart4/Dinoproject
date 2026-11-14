import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../middleware/errorHandler";
import { createQuizzesRouter } from "../../modules/quizzes/Quizzes.routes";

const allow: RequestHandler = (req, _res, next) => {
  (req as unknown as { user: unknown }).user = { id: "u1", role: "admin", name: null };
  next();
};
const deny: RequestHandler = (_req, res) => {
  res.status(401).json({ error: "No token" });
};

function buildApp(prisma: unknown, authMiddleware: RequestHandler = allow) {
  const app = express();
  app.use(express.json());
  app.use(createQuizzesRouter({ getPrisma: () => prisma as never, authMiddleware, adminMiddleware: allow }));
  app.use(errorHandler);
  return app;
}

const validQuestion = {
  questionText: "Q?",
  optionA: "a",
  optionB: "b",
  optionC: "c",
  optionD: "d",
  correctAnswer: "A",
};

describe("quizzes routes (HTTP behavior with a fake database)", () => {
  it("rejects a bad quiz id with the legacy message", async () => {
    const res = await request(buildApp({})).get("/api/quizzes/abc");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid quiz id" });
  });

  it("returns 404 for a missing quiz", async () => {
    const prisma = { quiz: { findUnique: vi.fn().mockResolvedValue(null) } };
    const res = await request(buildApp(prisma)).get("/api/quizzes/5");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Quiz not found" });
  });

  it("requires a title on create", async () => {
    const res = await request(buildApp({})).post("/api/quizzes").send({ questions: [] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "title required" });
  });

  it("rejects a malformed question", async () => {
    const res = await request(buildApp({}))
      .post("/api/quizzes")
      .send({ title: "T", questions: [{ questionText: "only text" }] });
    expect(res.status).toBe(400);
  });

  it("creates a quiz and returns 201", async () => {
    const created = { id: 1, title: "T", questions: [] };
    const prisma = { quiz: { create: vi.fn().mockResolvedValue(created) } };
    const res = await request(buildApp(prisma)).post("/api/quizzes").send({ title: "T", questions: [validQuestion] });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it("limits random question count to 100", async () => {
    const res = await request(buildApp({})).get("/api/quiz/random?count=101");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "count must be 100 or fewer" });
  });

  it("falls back to 10 questions for an invalid count", async () => {
    const questions = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      quiz: { title: "T", questionType: null, imageUrl: null, difficulty: null },
    }));
    const prisma = { question: { findMany: vi.fn().mockResolvedValue(questions) } };
    const res = await request(buildApp(prisma)).get("/api/quiz/random?count=abc");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
  });

  it("serves /recommend before /:id", async () => {
    const prisma = {
      score: { findMany: vi.fn().mockResolvedValue([]) },
      quiz: { findMany: vi.fn().mockResolvedValue([{ id: 3, title: "Only" }]) },
    };
    const res = await request(buildApp(prisma)).get("/api/quizzes/recommend");
    expect(res.status).toBe(200);
    expect(res.body.recommendedQuiz).toEqual({ id: 3, title: "Only" });
  });

  it("accepts quiz-level type, image and difficulty and rejects invalid values", async () => {
    const created = { id: 1, title: "T", questionType: "image", imageUrl: null, difficulty: "easy", questions: [] };
    const prisma = { quiz: { create: vi.fn().mockResolvedValue(created) } };
    const ok = await request(buildApp(prisma))
      .post("/api/quizzes")
      .send({ title: "T", questionType: "image", difficulty: "easy", questions: [validQuestion] });
    expect(ok.status).toBe(201);
    expect(ok.body.questionType).toBe("image");

    const bad = await request(buildApp(prisma)).post("/api/quizzes").send({ title: "T", difficulty: "extreme" });
    expect(bad.status).toBe(400);
  });

  it("treats type, image and difficulty as optional (title alone is enough)", async () => {
    const prisma = { quiz: { create: vi.fn().mockResolvedValue({ id: 1, title: "T", questions: [] }) } };
    const res = await request(buildApp(prisma)).post("/api/quizzes").send({ title: "T" });
    expect(res.status).toBe(201);
    expect(prisma.quiz.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ questionType: null, imageUrl: null, difficulty: null }),
      }),
    );
    expect(res.body.questions).toEqual([]);
  });

  it("stores an empty image URL as null and accepts explicit nulls", async () => {
    const prisma = { quiz: { create: vi.fn().mockResolvedValue({ id: 1, title: "T", questions: [] }) } };
    const res = await request(buildApp(prisma))
      .post("/api/quizzes")
      .send({ title: "T", imageUrl: "", questionType: null, difficulty: null });
    expect(res.status).toBe(201);
    expect(prisma.quiz.create.mock.calls[0][0].data.imageUrl).toBeNull();
  });

  it("update leaves omitted fields untouched and clears fields sent as null", async () => {
    const update = vi.fn().mockResolvedValue({ id: 2, title: "New", questions: [] });
    const tx = { question: { deleteMany: vi.fn() }, quiz: { update } };
    const prisma = { $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) };

    await request(buildApp(prisma)).put("/api/quizzes/2").send({ title: "New" });
    const titleOnly = update.mock.calls[0][0].data;
    expect(titleOnly.title).toBe("New");
    expect(titleOnly.imageUrl).toBeUndefined();
    expect(titleOnly.difficulty).toBeUndefined();
    expect(tx.question.deleteMany).not.toHaveBeenCalled();

    await request(buildApp(prisma)).put("/api/quizzes/2").send({ imageUrl: null, difficulty: null });
    const cleared = update.mock.calls[1][0].data;
    expect(cleared.imageUrl).toBeNull();
    expect(cleared.difficulty).toBeNull();
  });

  it("returns 404 on update of a missing quiz (transaction rolled back)", async () => {
    const prisma = {
      $transaction: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "P2025" })),
    };
    const res = await request(buildApp(prisma)).put("/api/quizzes/9").send({ title: "New" });
    expect(res.status).toBe(404);
  });

  it("deletes scores and questions together with the quiz", async () => {
    const tx = {
      score: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      question: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
      quiz: { delete: vi.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)) };
    const res = await request(buildApp(prisma)).delete("/api/quizzes/4");
    expect(res.status).toBe(200);
    expect(tx.score.deleteMany).toHaveBeenCalledWith({ where: { quizId: 4 } });
    expect(tx.question.deleteMany).toHaveBeenCalledWith({ where: { quizId: 4 } });
    expect(tx.quiz.delete).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it("blocks protected routes when auth denies", async () => {
    const app = buildApp({}, deny);
    expect((await request(app).post("/api/quizzes").send({ title: "T" })).status).toBe(401);
    expect((await request(app).put("/api/quizzes/1").send({ title: "T" })).status).toBe(401);
    expect((await request(app).delete("/api/quizzes/1")).status).toBe(401);
    expect((await request(app).get("/api/quizzes/recommend")).status).toBe(401);
  });
});
