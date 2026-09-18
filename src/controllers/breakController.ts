import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/errors";
import { getParam } from "../lib/params";
import { addDoctorBreak, listAllBreaks, listBreaksForDoctor } from "../services/breakService";

const breakSchema = z.object({
  date: z.string().trim().min(1, "Date is required."),
  startTime: z.string().trim().min(1, "Start time is required."),
  endTime: z.string().trim().min(1, "End time is required."),
});

export const getAllBreaks = asyncHandler(async (_req: Request, res: Response) => {
  const data = await listAllBreaks();
  res.status(200).json({ success: true, data });
});

export const getDoctorBreaks = asyncHandler(async (req: Request, res: Response) => {
  const data = await listBreaksForDoctor(getParam(req.params, "doctorId"));
  res.status(200).json({ success: true, data });
});

export const postDoctorBreak = asyncHandler(async (req: Request, res: Response) => {
  const parsed = breakSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const { date, startTime, endTime } = parsed.data;
  const data = await addDoctorBreak(getParam(req.params, "doctorId"), date, startTime, endTime);
  res.status(201).json({ success: true, data });
});
