import { Router } from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import type { Multer } from "multer";
import type { PrismaClient } from "@prisma/client";
import { BadRequestError } from "../../core/errors";
import type { StorageProvider } from "../../infrastructure/storage/StorageProvider";
import { validateRequest } from "../../middleware/validateRequest";
import { ProfileController } from "./Profile.controller";
import { ProfileRepository } from "./Profile.repository";
import { profileEmptyQuerySchema, updateProfileBodySchema } from "./Profile.schemas";
import { ProfileService } from "./Profile.service";

export interface ProfileRouterDeps {
  getPrisma: () => PrismaClient | undefined;
  authMiddleware: RequestHandler;
  upload: Multer;
  storageProvider: StorageProvider;
}

/** Runs multer and turns its failures (file too large, wrong type) into 400 responses instead of 500. */
export function singleImageUpload(upload: Multer, field: string): RequestHandler {
  const handler = upload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (error: unknown) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE" ? "File too large (max 5 MB)" : error.message;
        return next(new BadRequestError(message));
      }
      next(error instanceof Error ? new BadRequestError(error.message) : error);
    });
  };
}

/** Authenticated profile routes (auth is required on every route). */
export function createProfileRouter(deps: ProfileRouterDeps): Router {
  const repository = new ProfileRepository(deps.getPrisma);
  const service = new ProfileService(repository, deps.storageProvider);
  const controller = new ProfileController(service);

  const router = Router();

  router.put(
    "/api/user/profile",
    deps.authMiddleware,
    validateRequest(updateProfileBodySchema, "body", "Invalid profile data"),
    controller.update,
  );
  router.post(
    "/api/user/profile-pic",
    deps.authMiddleware,
    singleImageUpload(deps.upload, "profilePic"),
    controller.uploadPicture,
  );
  router.delete("/api/user/profile-pic", deps.authMiddleware, controller.removePicture);
  router.get(
    "/api/user/me",
    deps.authMiddleware,
    validateRequest(profileEmptyQuerySchema, "query"),
    controller.me,
  );

  return router;
}
