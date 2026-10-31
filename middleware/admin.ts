import type { NextFunction, Request, Response } from "express";

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}
