import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HF_MODEL,
  HuggingFaceAiProvider,
} from "../../infrastructure/ai/HuggingFaceAiProvider";

const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

function jsonResponse(status: number, data: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

function successResponse(content: string): Response {
  return jsonResponse(200, { choices: [{ message: { content } }] });
}

function build(fetchMock: ReturnType<typeof vi.fn>, model?: string) {
  vi.stubGlobal("fetch", fetchMock);
  const fallback = vi.fn().mockResolvedValue("local answer");
  const provider = new HuggingFaceAiProvider("hf_test", fallback, model);
  return { provider, fallback };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HuggingFaceAiProvider", () => {
  it("uses the local fallback without a key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const fallback = vi.fn().mockResolvedValue("local answer");
    const provider = new HuggingFaceAiProvider(undefined, fallback);

    await expect(provider.generate("hi", "hi")).resolves.toEqual({ kind: "fallback", response: "local answer" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the Hugging Face router chat endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse("Tyrannosaurus rex was a large carnivore from the Late Cretaceous."),
    );
    const { provider, fallback } = build(fetchMock);

    const result = await provider.generate("Tell me about T-Rex", "tell me about trex");

    expect(result).toEqual({
      kind: "ok",
      response: "🦖 Tyrannosaurus rex was a large carnivore from the Late Cretaceous.\n\n💡 Explore our Encyclopedia to learn more!",
    });
    expect(fallback).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(HF_CHAT_URL);
    expect(init.headers).toMatchObject({ Authorization: "Bearer hf_test" });
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(DEFAULT_HF_MODEL);
    expect(body.messages[1]).toEqual({ role: "user", content: "Tell me about T-Rex" });
  });

  it("uses a configured model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse("A long answer about dinosaurs."));
    const { provider } = build(fetchMock, "meta-llama/Llama-3.2-3B-Instruct");

    await provider.generate("hi", "hi");

    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.model).toBe("meta-llama/Llama-3.2-3B-Instruct");
  });

  it("caches successful answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse("Dinosaurs lived in the Mesozoic era."));
    const { provider } = build(fetchMock);

    await provider.generate("hi", "hi");
    await expect(provider.generate("hi", "hi")).resolves.toMatchObject({ kind: "cached" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back when Hugging Face rate limits", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(429, { error: "rate limited" }));
    const { provider, fallback } = build(fetchMock);

    await expect(provider.generate("hi", "hi")).resolves.toEqual({
      kind: "rate_limited",
      response: "local answer",
    });
    expect(fallback).toHaveBeenCalledWith("hi");
  });

  it("reports a loading model", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(503, { error: "Model is loading", estimated_time: 12 }),
    );
    const { provider } = build(fetchMock);

    await expect(provider.generate("hi", "hi")).resolves.toEqual({
      kind: "loading",
      response: "",
      estimatedTime: 12,
    });
  });

  it("falls back on other API and network errors", async () => {
    const apiError = vi.fn().mockResolvedValue(jsonResponse(402, { error: "Payment required" }));
    const api = build(apiError);
    await expect(api.provider.generate("hi", "hi")).resolves.toMatchObject({ kind: "fallback" });

    const networkError = vi.fn().mockRejectedValue(new Error("network down"));
    const network = build(networkError);
    await expect(network.provider.generate("hi", "hi")).resolves.toEqual({
      kind: "fallback",
      response: "local answer",
    });
  });

  it("falls back on an empty answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse(""));
    const { provider, fallback } = build(fetchMock);

    await expect(provider.generate("hi", "hi")).resolves.toMatchObject({ kind: "fallback" });
    expect(fallback).toHaveBeenCalledWith("hi");
  });
});
