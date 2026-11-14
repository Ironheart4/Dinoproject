import type { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { UnauthorizedError } from "../../core/errors";
import type {
  CreateQuizBody,
  QuizIdParams,
  RandomQuestionsQuery,
  UpdateQuizBody,
} from "./Quizzes.schemas";
import type { QuizzesService } from "./Quizzes.service";

/**
 * HTTP adapter for quizzes. Maps service results to existing response shapes.
 */
export class QuizzesController {
  constructor(private readonly service: QuizzesService) {}

  list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list());
  });

  get = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as QuizIdParams;
    res.json(await this.service.get(id));
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body as CreateQuizBody));
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as QuizIdParams;
    res.json(await this.service.update(id, req.body as UpdateQuizBody));
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as QuizIdParams;
    res.json(await this.service.remove(id));
  });

  random = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { count } = req.query as unknown as RandomQuestionsQuery;
    res.json(await this.service.randomQuestions(count));
  });

  recommend = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError("Invalid token");
    res.json(await this.service.recommendFor(userId));
  });
}
