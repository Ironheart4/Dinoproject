import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { BadRequestError } from "../core/errors";

type RequestPart = "body" | "params" | "query";

/**
 * Validate a request part with Zod. On failure, forwards BadRequestError.
 * Express 5 exposes `req.query` as a getter-only property, so validated query
 * data is reattached via defineProperty rather than assignment.
 */
export function validateRequest(
  schema: ZodTypeAny,
  part: RequestPart = "body",
  fallbackMessage?: string,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const first = result.error.issues[0]?.message;
      next(new BadRequestError(fallbackMessage ?? first ?? "Invalid request"));
      return;
    }

    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      (req as Request & Record<string, unknown>)[part] = result.data;
    }
    next();
  };
}
