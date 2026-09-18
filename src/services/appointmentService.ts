import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { assertValidTime, formatDateOnly, minutesToTime, parseDateOnly, rangesOverlap, timeToMinutes } from "../lib/dateUtils";
import { getDoctor } from "./doctorService";

const SLOT_DURATION_MINUTES = 30;

async function computeFreeSlotMinutes(doctorId: string, date: Date, excludeAppointmentId?: string): Promise<number[]> {
  const [periods, breaks, bookedAppointments] = await Promise.all([
    prisma.doctorAvailability.findMany({ where: { doctorId, date } }),
    prisma.doctorBreak.findMany({ where: { doctorId, date } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: "BOOKED",
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { startTime: true },
    }),
  ]);

  const bookedMinutes = new Set(bookedAppointments.map((a) => timeToMinutes(a.startTime)));

  const slots: number[] = [];
  for (const period of periods) {
    const start = timeToMinutes(period.startTime);
    const end = timeToMinutes(period.endTime);
    for (let m = start; m + SLOT_DURATION_MINUTES <= end; m += SLOT_DURATION_MINUTES) {
      const slotEnd = m + SLOT_DURATION_MINUTES;
      const inBreak = breaks.some((b) => rangesOverlap(m, slotEnd, timeToMinutes(b.startTime), timeToMinutes(b.endTime)));
      if (!inBreak && !bookedMinutes.has(m)) {
        slots.push(m);
      }
    }
  }

  return slots.sort((a, b) => a - b);
}

export async function getAvailableSlots(doctorId: string, dateStr: string) {
  await getDoctor(doctorId);
  const date = parseDateOnly(dateStr);
  const freeMinutes = await computeFreeSlotMinutes(doctorId, date);
  return freeMinutes.map(minutesToTime);
}

function serializeAppointment(appointment: {
  id: string;
  doctorId: string;
  patientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  doctor?: { name: string; specialization: string };
}) {
  return { ...appointment, date: formatDateOnly(appointment.date) };
}

export async function bookAppointment(patientId: string, doctorId: string, dateStr: string, startTime: string) {
  const doctor = await getDoctor(doctorId);
  assertValidTime(startTime, "Start time");
  const date = parseDateOnly(dateStr);

  const freeMinutes = await computeFreeSlotMinutes(doctorId, date);
  const slotStart = timeToMinutes(startTime);

  if (!freeMinutes.includes(slotStart)) {
    throw new ApiError(400, "Requested time is not a valid slot for this doctor's availability.");
  }

  const endTime = minutesToTime(slotStart + SLOT_DURATION_MINUTES);

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: { doctorId, date, startTime, status: "BOOKED" },
      });
      if (conflict) {
        throw new ApiError(409, "This appointment slot is no longer available.");
      }

      return tx.appointment.create({
        data: { doctorId, patientId, date, startTime, endTime, status: "BOOKED" },
      });
    });

    return { ...serializeAppointment(appointment), doctor };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, "This appointment slot is no longer available.");
    }
    throw err;
  }
}

export async function listPatientAppointments(patientId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: { doctor: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return appointments.map((a) => ({
    ...serializeAppointment(a),
    doctor: { id: a.doctor.id, name: a.doctor.name, specialization: a.doctor.specialization },
  }));
}

export async function cancelAppointment(patientId: string, appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found.");
  }
  if (appointment.patientId !== patientId) {
    throw new ApiError(403, "You can only cancel your own appointments.");
  }
  if (appointment.status === "CANCELLED") {
    throw new ApiError(400, "Appointment is already cancelled.");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  return serializeAppointment(updated);
}

/**
 * Moves BOOKED appointments overlapping a newly added break to the nearest
 * still-open slot for that doctor/date; cancels an appointment if no slot remains.
 */
export async function reassignAppointmentsForBreak(doctorId: string, date: Date, breakStart: string, breakEnd: string) {
  const breakStartMin = timeToMinutes(breakStart);
  const breakEndMin = timeToMinutes(breakEnd);

  const candidates = await prisma.appointment.findMany({
    where: { doctorId, date, status: "BOOKED" },
  });

  const overlapping = candidates.filter((a) =>
    rangesOverlap(timeToMinutes(a.startTime), timeToMinutes(a.endTime), breakStartMin, breakEndMin)
  );

  const moved: unknown[] = [];
  const cancelled: unknown[] = [];

  for (const appointment of overlapping) {
    const originalStart = timeToMinutes(appointment.startTime);
    const freeMinutes = await computeFreeSlotMinutes(doctorId, date, appointment.id);

    if (freeMinutes.length === 0) {
      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELLED" },
      });
      cancelled.push(serializeAppointment(updated));
      continue;
    }

    freeMinutes.sort((a, b) => {
      const diff = Math.abs(a - originalStart) - Math.abs(b - originalStart);
      return diff !== 0 ? diff : a - b;
    });

    const newStart = freeMinutes[0];
    const newStartTime = minutesToTime(newStart);
    const newEndTime = minutesToTime(newStart + SLOT_DURATION_MINUTES);

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { startTime: newStartTime, endTime: newEndTime },
    });
    moved.push({ ...serializeAppointment(updated), previousStartTime: appointment.startTime });
  }

  return { moved, cancelled };
}
