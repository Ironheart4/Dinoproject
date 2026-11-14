import { describe, expect, it, vi } from "vitest";
import type { Dinosaur } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../../core/errors";
import type { DinosaursRepository } from "../../modules/dinosaurs/Dinosaurs.repository";
import { DinosaursService, toDinosaurData } from "../../modules/dinosaurs/Dinosaurs.service";

function mockRepository(overrides: Partial<DinosaursRepository> = {}): DinosaursRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findFeatured: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(false),
    ...overrides,
  } as unknown as DinosaursRepository;
}

const dino = { id: 1, name: "Rex", species: "T. rex" } as Dinosaur;

describe("toDinosaurData", () => {
  it("uses the DEV_PENDING placeholder when modelUrl is blank or missing", () => {
    expect(toDinosaurData({ name: "Rex", species: "T. rex" }).modelUrl).toBe("DEV_PENDING");
    expect(toDinosaurData({ name: "Rex", species: "T. rex", modelUrl: "  " }).modelUrl).toBe("DEV_PENDING");
    expect(toDinosaurData({ name: "Rex", species: "T. rex", modelUrl: "https://m/x.glb" }).modelUrl).toBe(
      "https://m/x.glb",
    );
  });

  it("defaults every optional field to null", () => {
    const data = toDinosaurData({ name: "Rex", species: "T. rex" });
    expect(data.period).toBeNull();
    expect(data.lengthMeters).toBeNull();
    expect(data.weightKg).toBeNull();
    expect(data.imageUrl5).toBeNull();
  });

  it("parses numeric strings and numbers", () => {
    const data = toDinosaurData({
      name: "Rex",
      species: "T. rex",
      lengthMeters: "12.3",
      weightKg: "8000",
    });
    expect(data.lengthMeters).toBe(12.3);
    expect(data.weightKg).toBe(8000);

    const fromNumbers = toDinosaurData({
      name: "Rex",
      species: "T. rex",
      lengthMeters: 4.5,
      weightKg: 100.9,
    });
    expect(fromNumbers.lengthMeters).toBe(4.5);
    expect(fromNumbers.weightKg).toBe(100);
  });

  it("treats empty numeric values as null (legacy behavior)", () => {
    const data = toDinosaurData({ name: "Rex", species: "T. rex", lengthMeters: "", weightKg: null });
    expect(data.lengthMeters).toBeNull();
    expect(data.weightKg).toBeNull();
  });

  it("rejects non-numeric values with a BadRequestError", () => {
    expect(() => toDinosaurData({ name: "Rex", species: "T. rex", lengthMeters: "abc" })).toThrow(
      BadRequestError,
    );
    expect(() => toDinosaurData({ name: "Rex", species: "T. rex", weightKg: "heavy" })).toThrow(
      BadRequestError,
    );
  });
});

describe("DinosaursService", () => {
  it("list delegates to findAll", async () => {
    const findAll = vi.fn().mockResolvedValue([dino]);
    const service = new DinosaursService(mockRepository({ findAll }));
    await expect(service.list()).resolves.toEqual([dino]);
  });

  it("featured asks for 6 dinosaurs", async () => {
    const findFeatured = vi.fn().mockResolvedValue([dino]);
    const service = new DinosaursService(mockRepository({ findFeatured }));
    await service.featured();
    expect(findFeatured).toHaveBeenCalledWith(6);
  });

  it("get returns the dinosaur or throws NotFoundError", async () => {
    const found = new DinosaursService(mockRepository({ findById: vi.fn().mockResolvedValue(dino) }));
    await expect(found.get(1)).resolves.toEqual(dino);

    const missing = new DinosaursService(mockRepository());
    await expect(missing.get(99)).rejects.toThrow(NotFoundError);
  });

  it("create maps the body before saving", async () => {
    const create = vi.fn().mockResolvedValue(dino);
    const service = new DinosaursService(mockRepository({ create }));
    await service.create({ name: "Rex", species: "T. rex", weightKg: "8000" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: "Rex", weightKg: 8000, period: null }));
  });

  it("update throws NotFoundError when the repository returns null", async () => {
    const service = new DinosaursService(mockRepository());
    await expect(service.update(5, { name: "Rex", species: "T. rex" })).rejects.toThrow(NotFoundError);
  });

  it("update returns the updated dinosaur", async () => {
    const update = vi.fn().mockResolvedValue(dino);
    const service = new DinosaursService(mockRepository({ update }));
    await expect(service.update(1, { name: "Rex", species: "T. rex" })).resolves.toEqual(dino);
    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Rex" }));
  });

  it("remove returns success or throws NotFoundError", async () => {
    const ok = new DinosaursService(mockRepository({ delete: vi.fn().mockResolvedValue(true) }));
    await expect(ok.remove(1)).resolves.toEqual({ success: true });

    const missing = new DinosaursService(mockRepository());
    await expect(missing.remove(1)).rejects.toThrow(NotFoundError);
  });
});
