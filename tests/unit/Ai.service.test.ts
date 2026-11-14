import { describe, expect, it, vi } from "vitest";
import { hasActivePaidAccess } from "../../core/subscriptionAccess";
import { ForbiddenError, ServiceUnavailableError } from "../../core/errors";
import type { AiProvider } from "../../infrastructure/ai/AiProvider";
import { LocalDinoResponder } from "../../modules/ai/Ai.localResponder";
import { AiService } from "../../modules/ai/Ai.service";

const now = new Date("2026-06-01T00:00:00Z");
const future = new Date("2026-07-01T00:00:00Z");
const past = new Date("2026-05-01T00:00:00Z");
const sub = (plan: string, endDate: Date | null, status = "active") => ({ plan, endDate, status });

function build(subscription: unknown, generate: AiProvider["generate"], fallback = vi.fn().mockResolvedValue("fallback")) {
  const repository = { findSubscription: vi.fn().mockResolvedValue(subscription) };
  const service = new AiService(repository as never, { generate }, fallback, () => now);
  return { service, repository, fallback };
}

describe("hasActivePaidAccess", () => {
  it("allows active premium with no end date or a future end date", () => {
    expect(hasActivePaidAccess(sub("premium", null), now)).toBe(true);
    expect(hasActivePaidAccess(sub("premium", future), now)).toBe(true);
  });

  it("denies expired premium (it used to never expire)", () => {
    expect(hasActivePaidAccess(sub("premium", past), now)).toBe(false);
  });

  it("allows donors only within their end date", () => {
    expect(hasActivePaidAccess(sub("donor", future), now)).toBe(true);
    expect(hasActivePaidAccess(sub("donor", past), now)).toBe(false);
    expect(hasActivePaidAccess(sub("donor", null), now)).toBe(false);
  });

  it("denies free plans, inactive status and missing subscriptions", () => {
    expect(hasActivePaidAccess(sub("free", null), now)).toBe(false);
    expect(hasActivePaidAccess(sub("premium", future, "cancelled"), now)).toBe(false);
    expect(hasActivePaidAccess(null, now)).toBe(false);
  });
});

describe("AiService.chat", () => {
  it("rejects users without a paid subscription with 403 and a message", async () => {
    const { service } = build(null, vi.fn());
    await expect(service.chat({ id: "u1", role: "user" }, "hi")).rejects.toThrow(ForbiddenError);
    await expect(service.chat({ id: "u1", role: "user" }, "hi")).rejects.toMatchObject({
      body: { error: "Premium required", message: expect.stringContaining("Premium and Donor") },
    });
  });

  it("lets admins skip the subscription check", async () => {
    const generate = vi.fn().mockResolvedValue({ kind: "ok", response: "answer" });
    const { service, repository } = build(null, generate);
    await expect(service.chat({ id: "a1", role: "admin" }, "hello")).resolves.toEqual({ response: "answer" });
    expect(repository.findSubscription).not.toHaveBeenCalled();
  });

  it("passes the normalized question as the cache key", async () => {
    const generate = vi.fn().mockResolvedValue({ kind: "ok", response: "a" });
    await build(sub("premium", future), generate).service.chat({ id: "u1", role: "user" }, "What's T-Rex?");
    expect(generate).toHaveBeenCalledWith("What's T-Rex?", "whats trex");
  });

  it("flags cached and rate-limited replies", async () => {
    const user = { id: "u1", role: "user" };
    const cached = build(sub("premium", future), vi.fn().mockResolvedValue({ kind: "cached", response: "c" }));
    await expect(cached.service.chat(user, "q")).resolves.toEqual({ response: "c", cached: true });
    const limited = build(sub("premium", future), vi.fn().mockResolvedValue({ kind: "rate_limited", response: "r" }));
    await expect(limited.service.chat(user, "q")).resolves.toEqual({ response: "r", rateLimited: true });
  });

  it("returns 503 with the estimated time while the model loads", async () => {
    const { service } = build(sub("premium", future), vi.fn().mockResolvedValue({ kind: "loading", response: "", estimatedTime: 25 }));
    await expect(service.chat({ id: "u1", role: "user" }, "q")).rejects.toThrow(ServiceUnavailableError);
    await expect(service.chat({ id: "u1", role: "user" }, "q")).rejects.toMatchObject({
      body: { error: "Model loading", estimatedTime: 25 },
    });
  });

  it("never fails the user: provider errors use the local fallback", async () => {
    const { service, fallback } = build(sub("premium", future), vi.fn().mockRejectedValue(new Error("boom")));
    await expect(service.chat({ id: "u1", role: "user" }, "q")).resolves.toEqual({ response: "fallback" });
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
