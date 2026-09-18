import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/errors";
import { getParam } from "../lib/params";
import {
  createAvailabilityPeriod,
  listAllAvailability,
  listAvailabilityForDoctor,
  updateAvailabilityById,
} from "../services/availabilityService";

const availabilitySchema = z.object({
  date: z.string().trim().min(1, "Date is required."),
  startTime: z.string().trim().min(1, "Start time is required."),
  endTime: z.string().trim().min(1, "End time is required."),
});

export const getAllAvailability = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listAllAvailability();
  res.status(200).json({ success: true, data });
});

export const getDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
  const data = await listAvailabilityForDoctor(getParam(req.params, "doctorId"));
  res.status(200).json({ success: true, data });
});

export const postDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const { date, startTime, endTime } = parsed.data;
  const data = await createAvailabilityPeriod(getParam(req.params, "doctorId"), date, startTime, endTime);
  res.status(201).json({ success: true, data });
});

const updateSchema = z.object({
  startTime: z.string().trim().min(1, "Start time is required."),
  endTime: z.string().trim().min(1, "End time is required."),
});

export const putAvailability = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const data = await updateAvailabilityById(getParam(req.params, "id"), parsed.data.startTime, parsed.data.endTime);
  res.status(200).json({ success: true, data });
});
