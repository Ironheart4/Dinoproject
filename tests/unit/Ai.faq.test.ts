import { describe, expect, it } from "vitest";
import { describeDinosaur, faqResponse, matchDinosaur, normalizeQuestion } from "../../modules/ai/Ai.faq";

describe("normalizeQuestion", () => {
  it("lowercases, strips punctuation and collapses spaces", () => {
    expect(normalizeQuestion("  What did T-Rex EAT?!  ")).toBe("what did trex eat");
  });
});

describe("matchDinosaur", () => {
  const dinos = [
    { name: "Triceratops", species: "Triceratops horridus" },
    { name: null, species: "Stegosaurus stenops" },
  ];

  it("matches by common name or species, case-insensitively", () => {
    expect(matchDinosaur("Tell me about TRICERATOPS", dinos)?.name).toBe("Triceratops");
    expect(matchDinosaur("what is stegosaurus stenops", dinos)?.species).toBe("Stegosaurus stenops");
  });

  it("returns undefined when nothing matches", () => {
    expect(matchDinosaur("hello", dinos)).toBeUndefined();
  });
});

describe("describeDinosaur", () => {
  it("uses the description when present, else builds one from diet and period", () => {
    expect(describeDinosaur({ name: "Rex", species: "x", description: "Big.", diet: null, period: null })).toContain("Big.");
    expect(describeDinosaur({ name: "Rex", species: "x", description: null, diet: "Carnivorous", period: "Cretaceous" })).toContain(
      "Carnivorous from the Cretaceous",
    );
  });
});

describe("faqResponse", () => {
  it("answers common topics", () => {
    expect(faqResponse("how big was a t-rex")).toContain("Tyrannosaurus Rex");
    expect(faqResponse("what happened, why extinct")).toContain("asteroid");
    expect(faqResponse("do you have a quiz")).toContain("Quiz");
  });

  it("falls back to the help message", () => {
    expect(faqResponse("zzz")).toContain("Great question!");
  });
});
