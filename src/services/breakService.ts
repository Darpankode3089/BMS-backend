import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { assertValidTimeRange, formatDateOnly, parseDateOnly, rangesOverlap, timeToMinutes } from "../lib/dateUtils";
import { getDoctor } from "./doctorService";
import { reassignAppointmentsForBreak } from "./appointmentService";

function serialize(doctorBreak: { id: string; doctorId: string; date: Date; startTime: string; endTime: string }) {
  return { ...doctorBreak, date: formatDateOnly(doctorBreak.date) };
}

async function assertNoBreakOverlap(doctorId: string, date: Date, startTime: string, endTime: string) {
  const existing = await prisma.doctorBreak.findMany({ where: { doctorId, date } });

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  const overlapping = existing.some((period) =>
    rangesOverlap(start, end, timeToMinutes(period.startTime), timeToMinutes(period.endTime))
  );
  if (overlapping) {
    throw new ApiError(400, "This break overlaps with an existing break for this doctor.");
  }
}

export async function listAllBreaks() {
  const breaks = await prisma.doctorBreak.findMany({
    include: { doctor: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return breaks.map((b) => ({ ...serialize(b), doctor: b.doctor }));
}

export async function listBreaksForDoctor(doctorId: string) {
  await getDoctor(doctorId);
  const breaks = await prisma.doctorBreak.findMany({
    where: { doctorId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return breaks.map(serialize);
}

export async function addDoctorBreak(doctorId: string, dateStr: string, startTime: string, endTime: string) {
  await getDoctor(doctorId);
  assertValidTimeRange(startTime, endTime);
  const date = parseDateOnly(dateStr);

  await assertNoBreakOverlap(doctorId, date, startTime, endTime);

  const doctorBreak = await prisma.doctorBreak.create({
    data: { doctorId, date, startTime, endTime },
  });

  const { moved, cancelled } = await reassignAppointmentsForBreak(doctorId, date, startTime, endTime);

  return { break: serialize(doctorBreak), movedAppointments: moved, cancelledAppointments: cancelled };
}
