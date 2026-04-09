# Smart City Platform

Smart City Platform is a full-stack incident management system for city issue reporting and workflow coordination. Citizens can submit reports on the map, operators and admins can process them, field workers can track assigned tasks, and supervisors can monitor city-wide activity through dashboards and analytics.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS
- Maps and charts: Leaflet, React Leaflet, Recharts
- Backend: Node.js, Express, Prisma, JWT, bcryptjs, multer, h3-js
- Database: PostgreSQL via Supabase
- File storage: Supabase Storage for ticket photos

## Core Capabilities

- JWT-based authentication with login, registration, and session restore
- Role-based access control across frontend routes and backend endpoints
- City issue reporting with category, location, description, and optional photo upload
- Ticket lifecycle management: `NEW`, `IN_PROGRESS`, `DONE`, `REJECTED`
- Department assignment and department-based visibility for workers
- Audit logging for key ticket actions
- Ticket status history tracking
- H3 geospatial aggregation for hotspot analytics
- Admin user management with editable role, email, and department
- Dashboards for citizens, operators, admins, supervisors, and field workers

## Roles And Access

Backend roles:

- `CITIZEN`: creates reports and sees only own tickets
- `OPERATOR`: creates tickets, reviews queues, updates ticket status
- `DEPARTMENT_ADMIN`: manages workflow, users, analytics, and ticket assignment
- `FIELD_WORKER`: sees department-assigned work and updates status for own department
- `CITY_SUPERVISOR`: views analytics, dashboards, users, and audit-level reporting
- `SUPERADMIN`: full platform access

Frontend role mapping:

- `citizen` -> `CITIZEN`
- `operator` -> `OPERATOR`
- `department_admin` -> `DEPARTMENT_ADMIN`
- `field_worker` -> `FIELD_WORKER`
- `city_supervisor` -> `CITY_SUPERVISOR`
- `superadmin` -> `SUPERADMIN`

## Frontend Pages

Public pages:

- `/` - landing page
- `/login` - sign in
- `/register` - citizen registration

Authenticated pages:

- `/dashboard` - citizen dashboard with map and recent reports
- `/reportIssue` - create a new issue
- `/myReport` - citizen report history
- `/issue/:id` - issue details

Role-restricted pages:

- `/operator` - operator queue view for latest tickets
- `/admin/issues` - workflow management table with filters and status updates
- `/admin/dashboard` - analytics dashboard for admins
- `/admin/users` - user and role management
- `/tasks` - field worker task list
- `/analyticsDashboard` - supervisor city overview
- `/analytics` - supervisor analytics screen

## API Overview

Health:

- `GET /health`

Auth:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

Tickets:

- `GET /tickets/departments`
- `GET /tickets/getAll`
- `GET /tickets/get/:id`
- `POST /tickets/create`
- `PUT /tickets/update/:id`
- `DELETE /tickets/delete/:id`
- `GET /tickets/audit/:id`

Analytics:

- `GET /analytics/summary`
- `GET /analytics/h3`
- `GET /analytics/top-cells`

Admin:

- `GET /admin/users`
- `PATCH /admin/users/:id`

## Ticket Workflow

1. A citizen, operator, department admin, or superadmin creates a ticket.
2. The backend computes an H3 cell from latitude and longitude.
3. The ticket starts with status `NEW`.
4. Operators, department admins, field workers, or superadmins can move tickets through the workflow depending on role.
5. Audit logs and status history are stored for important changes.
6. Analytics endpoints aggregate ticket density by H3 cell and summarize operational metrics.

## Data Model

Main Prisma entities:

- `Department`
- `User`
- `TicketCategory`
- `Ticket`
- `TicketComment`
- `TicketAttachment`
- `TicketStatusHistory`
- `AuditLog`
- `H3Aggregate`

Enums:

- `Role`: `CITIZEN`, `OPERATOR`, `DEPARTMENT_ADMIN`, `FIELD_WORKER`, `CITY_SUPERVISOR`, `SUPERADMIN`
- `TicketStatus`: `NEW`, `IN_PROGRESS`, `DONE`, `REJECTED`

## Project Structure

- `backend/` - Express API, Prisma schema, seed/init scripts
- `frontend/` - React client application
- `.env` - shared root environment file used by the app setup

Key backend files:

- `backend/src/app.js` - API bootstrap and router registration
- `backend/src/controllers/` - auth, tickets, analytics, admin logic
- `backend/src/routes/` - Express route definitions
- `backend/prisma/schema.prisma` - data model

Key frontend files:

- `frontend/src/main.tsx` - router and providers
- `frontend/src/auth/` - auth context and protected routing
- `frontend/src/components/layout/AppShell.tsx` - role-aware navigation shell
- `frontend/src/pages/` - main application screens

## Environment Variables

Create a root `.env` file:

```env
PORT=3000
JWT_SECRET=change_me
H3_RESOLUTION=9
SUPABASE_DB_URL=postgresql://postgres.<project_ref>:<password>@<pooler-host>:6543/postgres
SUPABASE_SSL=true
SUPABASE_URL=https://<project_ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_STORAGE_BUCKET=issue-photos
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3000
VITE_USE_MSW=false
```

Notes:

- Supabase pooler usually uses port `6543`
- URL-encode special characters in the database password
- `VITE_API_URL` is consumed by the frontend
- `CORS_ORIGIN` should match the frontend dev server origin

## Installation

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

## Database Setup

Initialize schema and reference data:

```bash
npm run init:db
```

Optional demo data:

```bash
npm run seed
```

## Running Locally

Start backend:

```bash
npm run dev
```

Start frontend:

```bash
npm --prefix frontend run dev
```

Frontend default dev URL:

- `http://localhost:5173`

Backend default API URL:

- `http://localhost:3000`

## Current Notes

- The backend exposes analytics summary and H3 aggregation endpoints used by admin dashboards
- Ticket photos are uploaded through `multer` and stored in Supabase Storage
- Department management in the admin dashboard currently includes a UI stub on the frontend
- The repository contains both a root `README.md` and a frontend-specific `frontend/README.md`; this file documents the full monorepo

## Troubleshooting

- `ENOTFOUND`:
  check the Supabase host in `SUPABASE_DB_URL`
- `28P01 password authentication failed`:
  verify username, password, and project ref in the pooler connection string
- `401 Unauthorized`:
  check `JWT_SECRET`, token freshness, and whether the request includes `Authorization: Bearer <token>`
- CORS errors:
  verify `CORS_ORIGIN` matches your frontend URL
