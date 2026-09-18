import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";

const SALT_ROUNDS = 10;

function signToken(patientId: string, email: string) {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ patientId, email }, secret, { expiresIn: "7d" });
}

export async function registerPatient(name: string, email: string, password: string) {
  const existing = await prisma.patient.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const patient = await prisma.patient.create({
    data: { name, email, password: hashed },
  });

  const token = signToken(patient.id, patient.email);
  return { token, patient: { id: patient.id, name: patient.name, email: patient.email } };
}

export async function loginPatient(email: string, password: string) {
  const patient = await prisma.patient.findUnique({ where: { email } });
  if (!patient) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, patient.password);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken(patient.id, patient.email);
  return { token, patient: { id: patient.id, name: patient.name, email: patient.email } };
}

export async function getPatientById(id: string) {
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) {
    throw new ApiError(404, "Patient not found.");
  }
  return { id: patient.id, name: patient.name, email: patient.email };
}

export async function loginAdmin(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || email !== adminEmail || password !== adminPassword) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign({ role: "admin", email }, secret, { expiresIn: "7d" });
  return { token, admin: { email } };
}
