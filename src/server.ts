import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import doctorRoutes from "./routes/doctorRoutes";
import availabilityRoutes from "./routes/availabilityRoutes";
import breakRoutes from "./routes/breakRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/breaks", breakRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
