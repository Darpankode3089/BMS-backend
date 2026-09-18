import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/errors";
import { getPatientById, loginAdmin, loginPatient, registerPatient } from "../services/authService";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("A valid email is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required."),
  password: z.string().min(1, "Password is required."),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const { name, email, password } = parsed.data;
  const result = await registerPatient(name, email, password);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const { email, password } = parsed.data;
  const result = await loginPatient(email, password);
  res.status(200).json({ success: true, data: result });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const patient = await getPatientById(req.patient!.patientId);
  res.status(200).json({ success: true, data: patient });
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const { email, password } = parsed.data;
  const result = await loginAdmin(email, password);
  res.status(200).json({ success: true, data: result });
});
