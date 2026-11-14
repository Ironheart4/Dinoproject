import type { SearchRepository } from "./Search.repository";

export interface SearchDinosaurResult {
  id: number;
  name: string | null;
  species: string;
  period: string | null;
  imageUrl: string | null;
  diet: string | null;
  type: "dinosaur";
}

export interface SearchQuizResult {
  id: number;
  title: string;
  type: "quiz";
}

export interface SearchResultPayload {
  results: {
    dinosaurs: SearchDinosaurResult[];
    quizzes: SearchQuizResult[];
  };
}

const EMPTY_RESULTS: SearchResultPayload = {
  results: { dinosaurs: [], quizzes: [] },
};

/**
 * Search domain logic. No Express types here.
 */
export class SearchService {
  constructor(private readonly repository: SearchRepository) {}

  async search(q: string | undefined): Promise<SearchResultPayload> {
    const query = (q ?? "").trim().toLowerCase();
    if (!query || query.length < 2) {
      return EMPTY_RESULTS;
    }

    const [dinosaurs, quizzes] = await Promise.all([
      this.repository.findDinosaursByQuery(query),
      this.repository.findQuizzesByQuery(query),
    ]);

    return {
      results: {
        dinosaurs: dinosaurs.map((d) => ({
          id: d.id,
          name: d.name,
          species: d.species,
          period: d.period,
          imageUrl: d.imageUrl,
          diet: d.diet,
          type: "dinosaur" as const,
        })),
        quizzes: quizzes.map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          type: "quiz" as const,
        })),
      },
    };
  }
}
