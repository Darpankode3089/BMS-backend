-- Prevent double-booking: only one BOOKED appointment per doctor/date/startTime slot.
-- Partial index so cancelled appointments do not block re-booking the same slot.
CREATE UNIQUE INDEX "Appointment_doctor_date_slot_booked_unique"
ON "Appointment" ("doctorId", "date", "startTime")
WHERE "status" = 'BOOKED';
