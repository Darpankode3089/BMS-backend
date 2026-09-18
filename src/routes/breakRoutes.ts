import { Router } from "express";
import { getAllBreaks } from "../controllers/breakController";

const router = Router();

router.get("/", getAllBreaks);

export default router;
