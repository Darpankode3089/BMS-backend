import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/errors";
import { getParam } from "../lib/params";
import { createDoctor, deleteDoctor, getDoctor, listDoctors, updateDoctor } from "../services/doctorService";

const doctorSchema = z.object({
  name: z.string().trim().min(1, "Doctor name is required."),
  specialization: z.string().trim().min(1, "Specialization is required."),
});

export const getDoctors = asyncHandler(async (_req: Request, res: Response) => {
  const doctors = await listDoctors();
  res.status(200).json({ success: true, data: doctors });
});

export const getDoctorById = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await getDoctor(getParam(req.params, "id"));
  res.status(200).json({ success: true, data: doctor });
});

export const postDoctor = asyncHandler(async (req: Request, res: Response) => {
  const parsed = doctorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const doctor = await createDoctor(parsed.data.name, parsed.data.specialization);
  res.status(201).json({ success: true, data: doctor });
});

export const putDoctor = asyncHandler(async (req: Request, res: Response) => {
  const parsed = doctorSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const doctor = await updateDoctor(getParam(req.params, "id"), parsed.data.name, parsed.data.specialization);
  res.status(200).json({ success: true, data: doctor });
});

export const removeDoctor = asyncHandler(async (req: Request, res: Response) => {
  await deleteDoctor(getParam(req.params, "id"));
  res.status(200).json({ success: true, data: null });
});
