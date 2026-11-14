import type { PrismaClient } from "@prisma/client";
import { logger } from "../../core/logger";
import { describeDinosaur, faqResponse, matchDinosaur, type DinosaurFacts } from "./Ai.faq";
import { AiRepository } from "./Ai.repository";

const LOOKUP_LIMIT = 100;

/**
 * Offline answer source: a matching dinosaur from the database first, then the built-in FAQ.
 * Never throws; if the database is unavailable it answers from the FAQ alone.
 */
export class LocalDinoResponder {
  constructor(private readonly repository: Pick<AiRepository, "findDinosaurs">) {}

  respond = async (message: string): Promise<string> => {
    try {
      const dinosaurs: DinosaurFacts[] = await this.repository.findDinosaurs(LOOKUP_LIMIT);
      const match = matchDinosaur(message, dinosaurs);
      if (match) return describeDinosaur(match);
    } catch (error) {
      logger.warn("DinoBot dinosaur lookup failed, using FAQ only", { message: String(error) });
    }
    return faqResponse(message);
  };
}

/** Builds the responder used by both the AI provider and the AI service (composition helper). */
export function createLocalDinoResponder(getPrisma: () => PrismaClient | undefined): LocalDinoResponder {
  return new LocalDinoResponder(new AiRepository(getPrisma));
}
