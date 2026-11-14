import { hasActivePaidAccess } from "../../core/subscriptionAccess";
import { ForbiddenError, ServiceUnavailableError } from "../../core/errors";
import { logger } from "../../core/logger";
import type { AiProvider } from "../../infrastructure/ai/AiProvider";
import { normalizeQuestion } from "./Ai.faq";
import type { AiRepository } from "./Ai.repository";

export interface AiChatReply {
  response: string;
  cached?: true;
  rateLimited?: true;
}

export interface ChatUser {
  id: string;
  role: string;
}

const PREMIUM_REQUIRED_MESSAGE =
  "AI Assistant is available for Premium and Donor members only. Upgrade to access DinoBot!";

/**
 * DinoBot logic: who may use it, caching, and graceful fallback. No Express types here.
 * Entitlement: admins, or an active premium/donor subscription that has not expired.
 */
export class AiService {
  constructor(
    private readonly repository: Pick<AiRepository, "findSubscription">,
    private readonly provider: AiProvider,
    private readonly fallback: (message: string) => Promise<string>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async chat(user: ChatUser, message: string): Promise<AiChatReply> {
    if (user.role !== "admin") {
      const subscription = await this.repository.findSubscription(user.id);
      if (!hasActivePaidAccess(subscription, this.now())) {
        throw new ForbiddenError("Premium required", { message: PREMIUM_REQUIRED_MESSAGE });
      }
    }

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
