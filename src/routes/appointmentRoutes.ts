import { Router } from "express";
import { deleteAppointment, getMyAppointments, postAppointment } from "../controllers/appointmentController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", postAppointment);
router.get("/", getMyAppointments);
router.delete("/:id", deleteAppointment);

export default router;
