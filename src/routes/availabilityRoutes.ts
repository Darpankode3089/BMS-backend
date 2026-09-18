import { Router } from "express";
import { getAllAvailability, putAvailability } from "../controllers/availabilityController";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

router.get("/", getAllAvailability);
router.put("/:id", requireAdminAuth, putAvailability);

export default router;
