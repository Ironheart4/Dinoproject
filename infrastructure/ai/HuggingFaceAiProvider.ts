import { logger } from "../../core/logger";
import type { AiGenerateResult, AiProvider } from "./AiProvider";

const HF_MODEL_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base";
const CACHE_TTL = 1000 * 60 * 30;
const MAX_CACHE_SIZE = 100;

export type LocalFallbackFn = (message: string) => Promise<string>;

export class HuggingFaceAiProvider implements AiProvider {
  private readonly cache = new Map<string, { response: string; timestamp: number }>();

  constructor(
    private readonly apiKey: string | undefined,
    private readonly localFallback: LocalFallbackFn,
  ) {}

  async generate(message: string, cacheKey: string): Promise<AiGenerateResult> {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { kind: "cached", response: cached.response };
    }

    if (!this.apiKey) {
      return { kind: "fallback", response: await this.localFallback(message) };
    }

    try {
      const prompt = buildDinoPrompt(message);
      const response = await fetch(HF_MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 150, temperature: 0.7, do_sample: true },
          options: { wait_for_model: true },
        }),
      });

      if (response.status === 429) {
        logger.warn("Hugging Face rate limit hit");
        return {
          kind: "rate_limited",
          response: await this.localFallback(message),
        };
      }

      if (response.status === 503) {
        const data = await response.json() as { error?: string; estimated_time?: number };
        if (data.error?.includes("loading")) {
          return {
            kind: "loading",
            response: "",
            estimatedTime: data.estimated_time || 20,
          };
        }
      }

      if (!response.ok) {
        logger.error("Hugging Face API error", { status: response.status });
        return { kind: "fallback", response: await this.localFallback(message) };
      }

      const data = await response.json() as
        | Array<{ generated_text?: string }>
        | { generated_text?: string }
        | string;

      let aiResponse = "";
      if (Array.isArray(data) && data[0]?.generated_text) aiResponse = data[0].generated_text;
      else if (typeof data === "string") aiResponse = data;
      else if (data && typeof data === "object" && "generated_text" in data && data.generated_text) {
        aiResponse = data.generated_text;
      }

      if (!aiResponse || aiResponse.trim().length < 10) {
        return { kind: "fallback", response: await this.localFallback(message) };
      }

      const formatted = formatDinoResponse(aiResponse, message);
      this.cleanCache();
      this.cache.set(cacheKey, { response: formatted, timestamp: Date.now() });
      return { kind: "ok", response: formatted };
    } catch (error) {
      logger.error("AI generate error", error);
      return { kind: "fallback", response: await this.localFallback(message) };
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) this.cache.delete(key);
    }
    if (this.cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, entries.length - MAX_CACHE_SIZE).forEach(([key]) => this.cache.delete(key));
    }
  }
}

function buildDinoPrompt(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("t-rex") || msg.includes("tyrannosaurus")) {
    return `Answer this question about Tyrannosaurus Rex: ${userMessage}. Include facts about its size, diet, and when it lived.`;
  }
  if (msg.includes("velociraptor")) {
    return `Answer this question about Velociraptor: ${userMessage}. Mention it was actually turkey-sized with feathers.`;
  }
  if (msg.includes("biggest") || msg.includes("largest") || msg.includes("huge")) {
    return `What were the largest dinosaurs? Answer: ${userMessage}`;
  }
  if (msg.includes("smallest") || msg.includes("tiny")) {
    return `What were the smallest dinosaurs? Answer: ${userMessage}`;
  }
  if (msg.includes("when") || msg.includes("period") || msg.includes("era")) {
    return `Question about dinosaur time periods: ${userMessage}. Mention Triassic, Jurassic, or Cretaceous periods.`;
  }
  if (msg.includes("eat") || msg.includes("diet") || msg.includes("food")) {
    return `Question about dinosaur diets: ${userMessage}. Explain herbivore, carnivore, or omnivore diets.`;
  }
  if (msg.includes("extinct") || msg.includes("die") || msg.includes("asteroid")) {
    return `Why did dinosaurs go extinct? Answer: ${userMessage}`;
  }
  return `You are a dinosaur expert. Answer this question about dinosaurs or prehistoric life: ${userMessage}`;
}

function formatDinoResponse(aiResponse: string, originalQuestion: string): string {
  let response = aiResponse.trim();
  const msg = originalQuestion.toLowerCase();
  if (msg.includes("t-rex") || msg.includes("carnivore") || msg.includes("meat")) {
    response = "🦖 " + response;
  } else if (msg.includes("sauropod") || msg.includes("long neck") || msg.includes("herbivore")) {
    response = "🦕 " + response;
  } else {
    response = "🦴 " + response;
  }
  if (!response.includes("Encyclopedia") && response.length < 200) {
    response += "\n\n💡 Explore our Encyclopedia to learn more!";
  }
  return response;
}
