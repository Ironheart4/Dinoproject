import type { ErrorRequestHandler } from "express";
import { AppError } from "../core/errors";
import { logger } from "../core/logger";

/**
 * Final Express error handler.
 * Known AppError subclasses keep their status and body; everything else stays
 * the existing opaque 500 so legacy route try/catch paths are unchanged.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, { name: error.name, body: error.body });
    } else {
      logger.warn(error.message, { name: error.name, statusCode: error.statusCode });
    }
    res.status(error.statusCode).json(error.body);
    return;
  }

  logger.error("Unhandled request error", error);
  res.status(500).json({ error: "Internal server error" });
};
