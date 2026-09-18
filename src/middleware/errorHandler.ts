import { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found." });
}
