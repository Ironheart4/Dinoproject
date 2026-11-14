import { describe, expect, it, vi } from "vitest";
import type { SearchRepository } from "../../modules/search/Search.repository";
import { SearchService } from "../../modules/search/Search.service";

function mockRepository(
  overrides: Partial<SearchRepository> = {},
): SearchRepository {
  return {
    findDinosaursByQuery: vi.fn().mockResolvedValue([]),
    findQuizzesByQuery: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as SearchRepository;
}

describe("SearchService", () => {
  it("returns empty results without hitting the repository when q is missing", async () => {
    const repository = mockRepository();
    const service = new SearchService(repository);

    await expect(service.search(undefined)).resolves.toEqual({
      results: { dinosaurs: [], quizzes: [] },
    });
    expect(repository.findDinosaursByQuery).not.toHaveBeenCalled();
    expect(repository.findQuizzesByQuery).not.toHaveBeenCalled();
  });

  it("returns empty results without hitting the repository when q is shorter than 2 chars", async () => {
    const repository = mockRepository();
    const service = new SearchService(repository);

    await expect(service.search(" A ")).resolves.toEqual({
      results: { dinosaurs: [], quizzes: [] },
    });
    expect(repository.findDinosaursByQuery).not.toHaveBeenCalled();
    expect(repository.findQuizzesByQuery).not.toHaveBeenCalled();
  });

  it("trims and lowercases the query before searching", async () => {
    const findDinosaursByQuery = vi.fn().mockResolvedValue([]);
    const findQuizzesByQuery = vi.fn().mockResolvedValue([]);
    const service = new SearchService(
      mockRepository({ findDinosaursByQuery, findQuizzesByQuery }),
    );

    await service.search("  T-Rex  ");
    expect(findDinosaursByQuery).toHaveBeenCalledWith("t-rex");
    expect(findQuizzesByQuery).toHaveBeenCalledWith("t-rex");
  });

  it("maps dinosaur and quiz rows with type discriminators", async () => {
    const service = new SearchService(
      mockRepository({
        findDinosaursByQuery: vi.fn().mockResolvedValue([
          {
            id: 1,
            name: "T-Rex",
            species: "Tyrannosaurus rex",
            period: "Late Cretaceous",
            imageUrl: "/t.jpg",
            diet: "Carnivore",
          },
        ]),
        findQuizzesByQuery: vi.fn().mockResolvedValue([
          { id: 9, title: "Diet Quiz" },
        ]),
      }),
    );

    await expect(service.search("rex")).resolves.toEqual({
      results: {
        dinosaurs: [
          {
            id: 1,
            name: "T-Rex",
            species: "Tyrannosaurus rex",
            period: "Late Cretaceous",
            imageUrl: "/t.jpg",
            diet: "Carnivore",
            type: "dinosaur",
          },
        ],
        quizzes: [{ id: 9, title: "Diet Quiz", type: "quiz" }],
      },
    });
  });
});
