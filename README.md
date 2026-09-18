# Backend — Appointment Booking API

Express + TypeScript + Prisma (PostgreSQL) API. Auth, doctors, doctor availability/breaks, appointments.

## Stack

- Node.js + Express 5 + TypeScript
- Prisma ORM → PostgreSQL
- JWT auth (jsonwebtoken), bcryptjs for password hashing
- Validation: zod

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or remote), with a database created

## Setup

1. Install deps

   ```bash
   cd backend
   npm install
   ```

2. Configure env — copy `.env.example` to `.env` and fill values:

   ```bash
   cp .env.example .env
   ```

   Vars:

   | Var | Purpose |
   |---|---|
   | `PORT` | API port (default 5001) |
   | `DATABASE_URL` | Postgres connection string, e.g. `postgresql://user:password@localhost:5432/appointment_booking` |
   | `JWT_SECRET` | Secret for signing JWTs — use a long random string |
   | `FRONTEND_URL` | Frontend origin for CORS, e.g. `http://localhost:3000` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed/admin credentials |

3. Run Prisma migrations (creates tables in `DATABASE_URL`)

   ```bash
   npx prisma migrate dev
   ```

4. (Optional) Open Prisma Studio to inspect data

   ```bash
   npx prisma studio
   ```

## Run

Dev (auto-reload):

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

API serves on `http://localhost:PORT` (default `5001`).

## Project structure

```
src/
  server.ts            # app entry, route mounting, middleware
  routes/              # express routers per resource
  controllers/         # request handlers
  services/            # business logic, Prisma queries
  middleware/          # auth guard, error handler
  lib/                 # prisma client, shared helpers (dateUtils, errors, params)
prisma/
  schema.prisma        # DB models: Patient, Doctor, DoctorAvailability, DoctorBreak, Appointment
```

## API routes

Mounted under `/api`:

- `/api/auth` — login/register (see `authRoutes.ts`)
- `/api/doctors` — doctor CRUD/list
- `/api/availability` — doctor availability slots
- `/api/breaks` — doctor breaks
- `/api/appointments` — booking/cancel appointments

## Data model (concept)

- `Doctor` has many `DoctorAvailability` (date + start/end time windows) and `DoctorBreak` (date + start/end time blocked).
- `Patient` books `Appointment`s against a `Doctor`, each with date/startTime/endTime and status `BOOKED`/`CANCELLED`.
- Available slots for booking = doctor's availability windows minus breaks minus already-booked appointments for that date.
