import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";

export async function listDoctors() {
  return prisma.doctor.findMany({ orderBy: { name: "asc" } });
}

export async function getDoctor(id: string) {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) {
    throw new ApiError(404, "Doctor not found.");
  }
  return doctor;
}

export async function createDoctor(name: string, specialization: string) {
  return prisma.doctor.create({ data: { name, specialization } });
}

export async function updateDoctor(id: string, name: string, specialization: string) {
  await getDoctor(id);
  return prisma.doctor.update({ where: { id }, data: { name, specialization } });
}

export async function deleteDoctor(id: string) {
  await getDoctor(id);
  await prisma.doctor.delete({ where: { id } });
}
