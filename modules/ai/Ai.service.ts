import { ServiceUnavailableError } from "../../core/errors";
import { logger } from "../../core/logger";
import type { AiProvider } from "../../infrastructure/ai/AiProvider";
import { normalizeQuestion } from "./Ai.faq";

export interface AiChatReply {
  response: string;
  cached?: true;
  rateLimited?: true;
}

/**
 * DinoBot logic: caching and graceful fallback. No Express types here.
 */
export class AiService {
  constructor(
    private readonly provider: AiProvider,
    private readonly fallback: (message: string) => Promise<string>,
  ) {}

  async chat(message: string): Promise<AiChatReply> {
    try {
      const result = await this.provider.generate(message, normalizeQuestion(message));
      switch (result.kind) {
        case "cached":
          return { response: result.response, cached: true };
        case "rate_limited":
          return { response: result.response, rateLimited: true };
        case "loading":
          throw new ServiceUnavailableError("Model loading", {
            message: "DinoBot is warming up! Please try again in a few seconds.",
            estimatedTime: result.estimatedTime ?? 20,
          });
        default:
          return { response: result.response };
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error;
      logger.error("AI chat error", { message: String(error) });
      return { response: await this.fallback(message) };
    }
  }
}
