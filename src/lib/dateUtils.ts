import { ApiError } from "./errors";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseDateOnly(value: string): Date {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    throw new ApiError(400, "Date must be in YYYY-MM-DD format.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid date.");
  }
  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function assertValidTime(value: string, label: string): void {
  if (typeof value !== "string" || !TIME_RE.test(value)) {
    throw new ApiError(400, `${label} must be in HH:mm 24-hour format.`);
  }
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function assertValidTimeRange(startTime: string, endTime: string): void {
  assertValidTime(startTime, "Start time");
  assertValidTime(endTime, "End time");
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new ApiError(400, "Start time must be before end time.");
  }
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
