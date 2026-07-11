<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# EN2H Booking Platform API

A JWT-secured NestJS REST API for managing services and customer bookings, built with PostgreSQL and Prisma.

## Features Delivered

| Feature                                                       | Status |
| ------------------------------------------------------------- | ------ |
| Authentication (Register/Login with JWT)                      | ✅     |
| Service Management (CRUD, protected)                          | ✅     |
| Booking Management (create, list, get, update status, cancel) | ✅     |
| Validation (class-validator on all inputs)                    | ✅     |
| Global Exception Handling                                     | ✅     |
| Swagger / OpenAPI Documentation                               | ✅     |
| Prevent Duplicate Bookings (same service/date/time)           | ✅     |
| Booking Overlap Detection (duration-aware)                    | ✅     |
| Pagination (Services & Bookings)                              | ✅     |
| Filter Bookings by Status                                     | ✅     |
| Search Bookings (by customer name/email)                      | ✅     |
| Docker Support                                                | 🚧     |
| Unit Testing                                                  | 🚧     |
| Refresh Token                                                 | 📋     |

**Legend:** ✅ Done &nbsp;|&nbsp; 🚧 In Progress &nbsp;|&nbsp; 📋 Planned

## Table of Contents

- [EN2H Booking Platform API](#en2h-booking-platform-api)
  - [Features Delivered](#features-delivered)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Tech Stack](#tech-stack)
  - [Installation Steps](#installation-steps)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
  - [Running Migrations](#running-migrations)
  - [API Documentation](#api-documentation)
    - [Endpoint Summary](#endpoint-summary)
  - [Assumptions Made](#assumptions-made)
    - [User Model](#user-model)
    - [Authentication](#authentication)
    - [Services](#services)
    - [Bookings](#bookings)
    - [Error Handling](#error-handling)
  - [Future Improvements](#future-improvements)

---

## Project Overview

This API powers a booking platform where:

- **Authenticated users** can manage services (create, update, delete, list).
- **Customers** (no authentication required) can book a service, and authenticated
  users can view, update the status of, and cancel bookings.

The system enforces real-world business rules beyond basic CRUD — including
overlap-aware booking conflict detection based on service duration, booking
status lifecycle rules, and safe (non-destructive) service deletion.

## Tech Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | NestJS                                              |
| Language   | TypeScript                                          |
| Database   | PostgreSQL                                          |
| ORM        | Prisma 7 (with `@prisma/adapter-pg` driver adapter) |
| Auth       | JWT (Passport)                                      |
| Validation | class-validator / class-transformer                 |
| API Docs   | Swagger (OpenAPI)                                   |

---

## Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/DileepLakshan141/en2h-booking-api.git
   cd en2h-booking-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   and after that run the following command,

   ```bash
   npx prisma generate
   ```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your local values:

```bash
cp .env.example .env
```

| Variable       | Description                                                                                                     | Example                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `PORT`         | Port the API listens on                                                                                         | `3001`                                                                            |
| `DATABASE_URL` | Full Prisma connection string (must be written out fully, not templated — `.env` doesn't support interpolation) | `postgresql://<DB_USERNAME>:<DB_PASSWORD>@<DB_HOST>:5432/<DB_NAME>?schema=public` |
| `JWT_SECRET`   | Secret used to sign JWTs                                                                                        | `your-super-secret-key`                                                           |

---

## Database Setup

This project uses a **local PostgreSQL instance** (no cloud/managed database required).
(above mentioned **DATABASE_URL** can be constructed by replacing the placeholder values with your actual values)

1. Ensure PostgreSQL is installed and running locally.
2. Create the database (via `psql` or a GUI tool like pgAdmin):
   ```sql
   CREATE DATABASE en2h_booking_api;
   ```
3. Update `DATABASE_URL` in your `.env` to point to this database with your
   local credentials.
4. Verify the connection:
   ```bash
   npx prisma db pull
   ```
   No errors (an empty-schema notice is expected on a fresh database) confirms
   the connection string is correct.
5. Apply existing migrations to your local database
   ```bash
      npx prisma migrate dev
   ```

---

## Running the Application

```bash
# development (watch mode)
npm run start:dev

# production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:<PORT>` (default `http://localhost:3001`).

---

## Running Migrations

Migrations are managed by Prisma and tracked in `prisma/migrations/`.

```bash
# apply existing migrations to your local database
npx prisma migrate dev

# after changing schema.prisma, generate + apply a new migration
npx prisma migrate dev --name <migration_name>
```

---

## API Documentation

Interactive Swagger documentation is available once the app is running:

```
http://localhost:<PORT>/api/docs
```

All protected endpoints require a Bearer token. Use `POST /auth/login` to obtain
one, then click **Authorize** in the Swagger UI and paste the `accessToken`.

### Endpoint Summary

| Method | Endpoint               | Auth      | Description                                       |
| ------ | ---------------------- | --------- | ------------------------------------------------- |
| POST   | `/auth/register`       | Public    | Register a new user                               |
| POST   | `/auth/login`          | Public    | Login, returns JWT                                |
| POST   | `/services`            | Protected | Create a service                                  |
| GET    | `/services`            | Protected | List services (paginated)                         |
| GET    | `/services/:id`        | Protected | Get a service by id                               |
| PATCH  | `/services/:id`        | Protected | Update a service                                  |
| DELETE | `/services/:id`        | Protected | Soft-delete a service                             |
| POST   | `/bookings`            | Public    | Create a booking                                  |
| GET    | `/bookings`            | Protected | List bookings (paginated, filterable, searchable) |
| GET    | `/bookings/:id`        | Protected | Get a booking by id                               |
| PATCH  | `/bookings/:id/status` | Protected | Update booking status                             |
| DELETE | `/bookings/:id`        | Protected | Cancel a booking                                  |

---

## Assumptions Made

Since the assignment specification left several implementation details unstated,
the following deliberate decisions were made:

### User Model

- The `User` model contains only `email` and `password`. The assignment's
  Authentication requirements only specify Register and Login with no additional
  profile fields defined (unlike `Service`/`Booking`, which have explicit field
  lists) — so no `username`/`fullName` was added without a stated requirement.
- No role-based access control was implemented, as the spec does not distinguish
  between user types — only "authenticated" vs. "unauthenticated" access.

### Authentication

- `POST /auth/register` returns only the created user object (no token) —
  registration and authentication are treated as distinct actions. A separate
  `POST /auth/login` call is required to obtain a JWT.
- JWTs are validated via a global guard (`APP_GUARD`); routes are protected by
  default, with a `@Public()` decorator used to explicitly opt out
  (`register`, `login`, `POST /bookings`). This "secure by default" design
  ensures new endpoints are never accidentally left unprotected.

### Services

- `Service` records are not tied to a specific owning user — any authenticated
  user can manage any service, since the spec does not define per-user ownership.
- **Soft delete strategy**: `DELETE /services/:id` does not physically remove the
  record. Instead:
  - If the service has any `PENDING` or `CONFIRMED` bookings, deletion is
    blocked entirely (`409 Conflict`), since these represent active commitments.
  - Otherwise, the service is deactivated (`isActive: false`) rather than
    physically deleted, to preserve booking history for `CANCELLED`/`COMPLETED`
    bookings that reference it. A hard delete + cascade was considered but
    rejected, as destroying completed booking records to satisfy a service
    deletion would erase legitimate transaction history.
  - `GET /services` only returns active services by default.

### Bookings

- **Booking time storage**: `bookingTime` is stored as a `String` (`"HH:mm"`)
  rather than a native `Time` type, validated via regex in the DTO. This
  simplifies handling in JavaScript/TypeScript, which has no clean native
  time-only type.
- **Overlap detection**: Beyond the bonus requirement of preventing exact
  duplicate slots (same service/date/time), booking creation checks for any
  _time-range overlap_ with existing non-cancelled bookings for the same
  service, based on the service's duration. This prevents double-booking a
  service mid-appointment (e.g. a 95-minute service starting at 8:30 AM blocks
  new bookings from 8:30–10:05 AM for that service).
- **First-come-first-served allocation**: overlapping booking attempts are
  rejected outright (`409 Conflict`) rather than allowed as competing
  "pending" requests for manual resolution. This keeps the booking flow simple
  and predictable for customers, avoiding the need for a request/approval
  system, notifications, or expiry logic that isn't specified in the assignment.
- **Cancelled bookings free their slot**: a `CANCELLED` booking is excluded
  from overlap checks, so its time slot becomes bookable again.
- **Status transitions are restricted**: a booking in `CANCELLED` or
  `COMPLETED` status cannot transition to any other status.
- **Cancellation is a soft state change**: `DELETE /bookings/:id` sets status
  to `CANCELLED` rather than physically deleting the row, preserving booking
  history.
- **Past-date validation**: bookings cannot be created for a date earlier than
  today (time-of-day is not considered, only the calendar date).

### Error Handling

- A global exception filter (`AllExceptionsFilter`) normalizes all error
  responses into a consistent shape (`statusCode`, `message`, `error`, `path`,
  `timestamp`), including mapping known Prisma error codes (e.g. unique
  constraint violations, foreign key restrictions) to meaningful HTTP
  responses instead of leaking raw database errors.

---

## Future Improvements

Given the project's time constraints, the following were consciously scoped
out but would be natural next steps:

- **Refresh tokens** — currently, JWTs are short-lived with no refresh flow;
  a production system would add a refresh token endpoint and rotation strategy.
- **Role-based access control** — if the platform grows to distinguish service
  providers from platform admins, a `role` field and route-level authorization
  would be introduced.
- **Search/filter on Services** — the assignment's bonus criteria specifically
  call out search for bookings; service search was scoped out since typical
  service catalogs are small enough that pagination alone is sufficient.
- **Rate limiting** — particularly on the public `POST /bookings` endpoint,
  to prevent abuse given it requires no authentication.
- **Soft-delete on Bookings/Users** — currently only Services use soft
  deletion; a consistent soft-delete strategy across all entities could be
  introduced for full audit-trail support.
- **Automated notification system** — e.g. email confirmation on booking
  creation/status changes, which would also enable a more advanced
  "pending request" allocation model instead of first-come-first-served.
