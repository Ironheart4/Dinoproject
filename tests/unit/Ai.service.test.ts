import { describe, expect, it, vi } from "vitest";
import { ServiceUnavailableError } from "../../core/errors";
import type { AiProvider } from "../../infrastructure/ai/AiProvider";
import { LocalDinoResponder } from "../../modules/ai/Ai.localResponder";
import { AiService } from "../../modules/ai/Ai.service";

function build(generate: AiProvider["generate"], fallback = vi.fn().mockResolvedValue("fallback")) {
  const service = new AiService({ generate }, fallback);
  return { service, fallback };
}

describe("AiService.chat", () => {
  it("lets logged-in users chat without a subscription check", async () => {
    const generate = vi.fn().mockResolvedValue({ kind: "ok", response: "answer" });
    const { service } = build(generate);
    await expect(service.chat("hello")).resolves.toEqual({ response: "answer" });
    expect(generate).toHaveBeenCalledWith("hello", "hello");
  });

  it("passes the normalized question as the cache key", async () => {
    const generate = vi.fn().mockResolvedValue({ kind: "ok", response: "a" });
    await build(generate).service.chat("What's T-Rex?");
    expect(generate).toHaveBeenCalledWith("What's T-Rex?", "whats trex");
  });

  it("flags cached and rate-limited replies", async () => {
    const cached = build(vi.fn().mockResolvedValue({ kind: "cached", response: "c" }));
    await expect(cached.service.chat("q")).resolves.toEqual({ response: "c", cached: true });
    const limited = build(vi.fn().mockResolvedValue({ kind: "rate_limited", response: "r" }));
    await expect(limited.service.chat("q")).resolves.toEqual({ response: "r", rateLimited: true });
  });

  it("returns 503 with the estimated time while the model loads", async () => {
    const { service } = build(vi.fn().mockResolvedValue({ kind: "loading", response: "", estimatedTime: 25 }));
    await expect(service.chat("q")).rejects.toThrow(ServiceUnavailableError);
    await expect(service.chat("q")).rejects.toMatchObject({
      body: { error: "Model loading", estimatedTime: 25 },
    });
  });

  it("never fails the user: provider errors use the local fallback", async () => {
    const { service, fallback } = build(vi.fn().mockRejectedValue(new Error("boom")));
    await expect(service.chat("q")).resolves.toEqual({ response: "fallback" });
    expect(fallback).toHaveBeenCalledWith("q");
  });
});

describe("LocalDinoResponder", () => {
  it("answers from a matching dinosaur, else from the FAQ, even if the database fails", async () => {
    const dino = { name: "Triceratops", species: "T. horridus", description: "Three horns.", diet: null, period: null };
    const withDb = new LocalDinoResponder({ findDinosaurs: vi.fn().mockResolvedValue([dino]) });
    expect(await withDb.respond("tell me about triceratops")).toContain("Three horns.");

    const noMatch = new LocalDinoResponder({ findDinosaurs: vi.fn().mockResolvedValue([dino]) });
    expect(await noMatch.respond("hello")).toContain("DinoBot");

    const brokenDb = new LocalDinoResponder({ findDinosaurs: vi.fn().mockRejectedValue(new Error("down")) });
    expect(await brokenDb.respond("hello")).toContain("DinoBot");
  });
});
