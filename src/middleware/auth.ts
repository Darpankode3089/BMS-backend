import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../lib/errors";

export interface AuthPayload {
  patientId: string;
  email: string;
}

export interface AdminAuthPayload {
  role: "admin";
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      patient?: AuthPayload;
      admin?: AdminAuthPayload;
    }
  }
}

function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required.");
  }
  return header.slice("Bearer ".length);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.patient = { patientId: payload.patientId, email: payload.email };
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token.");
  }
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as AdminAuthPayload;
    if (payload.role !== "admin") {
      throw new Error("Not an admin token.");
    }
    req.admin = { role: "admin", email: payload.email };
    next();
  } catch {
    throw new ApiError(401, "Admin authentication required.");
  }
}
