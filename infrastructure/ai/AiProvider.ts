export interface AiGenerateResult {
  kind: "ok" | "cached" | "rate_limited" | "loading" | "fallback";
  response: string;
  estimatedTime?: number;
}

export interface AiProvider {
  generate(prompt: string, cacheKey: string): Promise<AiGenerateResult>;
}
