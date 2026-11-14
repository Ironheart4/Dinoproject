import type { Dinosaur } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../../core/errors";
import type { DinosaurBody } from "./Dinosaurs.schemas";
import type { DinosaurWriteData, DinosaursRepository } from "./Dinosaurs.repository";

const FEATURED_LIMIT = 6;
/** The app-wide placeholder for "no asset yet"; the frontend already handles it. */
export const MODEL_PENDING = "DEV_PENDING";
const NOT_FOUND_MESSAGE = "Dinosaur not found";

/**
 * Single mapping from request body to persistence data (used by create and update).
 * Legacy rules kept: empty or missing numeric values become null; text defaults to null.
 */
export function toDinosaurData(input: DinosaurBody): DinosaurWriteData {
  return {
    name: input.name,
    species: input.species,
    period: input.period ?? null,
    diet: input.diet ?? null,
    habitat: input.habitat ?? null,
    lengthMeters: parseOptionalFloat(input.lengthMeters, "lengthMeters"),
    weightKg: parseOptionalInt(input.weightKg, "weightKg"),
    description: input.description ?? null,
    modelUrl: input.modelUrl?.trim() ? input.modelUrl : MODEL_PENDING,
    roarSound: input.roarSound ?? null,
    imageUrl: input.imageUrl ?? null,
    imageUrl1: input.imageUrl1 ?? null,
    imageUrl2: input.imageUrl2 ?? null,
    imageUrl3: input.imageUrl3 ?? null,
    imageUrl4: input.imageUrl4 ?? null,
    imageUrl5: input.imageUrl5 ?? null,
    videoUrl: input.videoUrl ?? null,
    wikipedia: input.wikipedia ?? null,
    taxonomy: input.taxonomy ?? null,
    type: input.type ?? null,
    livedIn: input.livedIn ?? null,
    namedBy: input.namedBy ?? null,
  };
}

function parseOptionalFloat(value: string | number | null | undefined, field: string): number | null {
  if (!value) return null;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(parsed)) throw new BadRequestError(`Invalid ${field}`);
  return parsed;
}

function parseOptionalInt(value: string | number | null | undefined, field: string): number | null {
  if (!value) return null;
  const parsed = typeof value === "number" ? Math.trunc(value) : parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw new BadRequestError(`Invalid ${field}`);
  return parsed;
}

/**
 * Dinosaur domain logic. No Express types here.
 */
export class DinosaursService {
  constructor(private readonly repository: DinosaursRepository) {}

  list(): Promise<Dinosaur[]> {
    return this.repository.findAll();
  }

  featured(): Promise<Dinosaur[]> {
    return this.repository.findFeatured(FEATURED_LIMIT);
  }

  async get(id: number): Promise<Dinosaur> {
    const dinosaur = await this.repository.findById(id);
    if (!dinosaur) throw new NotFoundError(NOT_FOUND_MESSAGE);
    return dinosaur;
  }

  create(input: DinosaurBody): Promise<Dinosaur> {
    return this.repository.create(toDinosaurData(input));
  }

  async update(id: number, input: DinosaurBody): Promise<Dinosaur> {
    const updated = await this.repository.update(id, toDinosaurData(input));
    if (!updated) throw new NotFoundError(NOT_FOUND_MESSAGE);
    return updated;
  }

  async remove(id: number): Promise<{ success: true }> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError(NOT_FOUND_MESSAGE);
    return { success: true };
  }
}
