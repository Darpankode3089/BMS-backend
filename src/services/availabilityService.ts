import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { assertValidTimeRange, formatDateOnly, parseDateOnly, rangesOverlap, timeToMinutes } from "../lib/dateUtils";
import { getDoctor } from "./doctorService";

function serialize(availability: { id: string; doctorId: string; date: Date; startTime: string; endTime: string }) {
  return { ...availability, date: formatDateOnly(availability.date) };
}

async function assertNoOverlap(doctorId: string, date: Date, startTime: string, endTime: string, excludeId?: string) {
  const existing = await prisma.doctorAvailability.findMany({
    where: { doctorId, date, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  const overlapping = existing.some((period) =>
    rangesOverlap(start, end, timeToMinutes(period.startTime), timeToMinutes(period.endTime))
  );
  if (overlapping) {
    throw new ApiError(400, "This availability period overlaps with an existing period for this doctor.");
  }
}

export async function listAllAvailability() {
  const availabilities = await prisma.doctorAvailability.findMany({
    include: { doctor: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }, { doctor: { name: "asc" } }],
  });
  return availabilities.map((a) => ({ ...serialize(a), doctor: a.doctor }));
}

export async function listAvailabilityForDoctor(doctorId: string) {
  await getDoctor(doctorId);
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return availabilities.map(serialize);
}

export async function createAvailabilityPeriod(doctorId: string, dateStr: string, startTime: string, endTime: string) {
  await getDoctor(doctorId);
  assertValidTimeRange(startTime, endTime);
  const date = parseDateOnly(dateStr);

  await assertNoOverlap(doctorId, date, startTime, endTime);

  const availability = await prisma.doctorAvailability.create({
    data: { doctorId, date, startTime, endTime },
  });

  return serialize(availability);
}

export async function updateAvailabilityById(id: string, startTime: string, endTime: string) {
  const existing = await prisma.doctorAvailability.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Availability not found.");
  }
  assertValidTimeRange(startTime, endTime);
  await assertNoOverlap(existing.doctorId, existing.date, startTime, endTime, id);

  const updated = await prisma.doctorAvailability.update({
    where: { id },
    data: { startTime, endTime },
  });

  return serialize(updated);
}
