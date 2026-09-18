import { Router } from "express";
import { getDoctorById, getDoctors, postDoctor, putDoctor, removeDoctor } from "../controllers/doctorController";
import { getDoctorAvailability, postDoctorAvailability } from "../controllers/availabilityController";
import { getDoctorBreaks, postDoctorBreak } from "../controllers/breakController";
import { getSlots } from "../controllers/appointmentController";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

router.get("/", getDoctors);
router.post("/", requireAdminAuth, postDoctor);
router.get("/:id", getDoctorById);
router.put("/:id", requireAdminAuth, putDoctor);
router.delete("/:id", requireAdminAuth, removeDoctor);

router.get("/:doctorId/availability", getDoctorAvailability);
router.post("/:doctorId/availability", requireAdminAuth, postDoctorAvailability);
router.get("/:doctorId/breaks", getDoctorBreaks);
router.post("/:doctorId/breaks", requireAdminAuth, postDoctorBreak);
router.get("/:doctorId/slots", getSlots);

export default router;
