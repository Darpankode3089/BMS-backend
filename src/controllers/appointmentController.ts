import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiError } from "../lib/errors";
import { getParam } from "../lib/params";
import {
  bookAppointment,
  cancelAppointment,
  getAvailableSlots,
  listPatientAppointments,
} from "../services/appointmentService";

const slotsQuerySchema = z.object({
  date: z.string().trim().min(1, "Date is required."),
});

export const getSlots = asyncHandler(async (req: Request, res: Response) => {
  const parsed = slotsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const slots = await getAvailableSlots(getParam(req.params, "doctorId"), parsed.data.date);
  res.status(200).json({ success: true, data: slots });
});

const bookSchema = z.object({
  doctorId: z.string().trim().min(1, "Doctor is required."),
  date: z.string().trim().min(1, "Date is required."),
  startTime: z.string().trim().min(1, "Start time is required."),
});

export const postAppointment = asyncHandler(async (req: Request, res: Response) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const { doctorId, date, startTime } = parsed.data;
  const appointment = await bookAppointment(req.patient!.patientId, doctorId, date, startTime);
  res.status(201).json({ success: true, data: appointment });
});

export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const appointments = await listPatientAppointments(req.patient!.patientId);
  res.status(200).json({ success: true, data: appointments });
});

export const deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await cancelAppointment(req.patient!.patientId, getParam(req.params, "id"));
  res.status(200).json({ success: true, data: appointment });
});
