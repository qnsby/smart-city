# Smart City Platform (Express + Supabase Postgres + React + H3)

Smart City is a full-stack incident management app:
- citizens can report issues on the map
- admins can track, update, and manage workflows
- user access is controlled by RBAC

## Current Stack

- Backend: Node.js, Express, JWT, `pg`, `h3-js`
- Database: Supabase Postgres
- Frontend: React, Vite, TypeScript, React Query, Tailwind

## Roles (RBAC)

- `CITIZEN`: map/reporting, own tickets only
- `DEPT_ADMIN`: admin dashboard, issues, users management
- `SUPERVISOR`: admin dashboard, issues, users management
- `SUPERADMIN`: full admin access

Frontend role mapping:
- `citizen` -> `CITIZEN`
- `dept_admin` -> `DEPT_ADMIN`
- `university_admin` -> `SUPERADMIN`

## Main Features

- JWT auth (`/auth/login`, `/auth/register`, `/auth/me`)
- Tickets CRUD with H3 indexing
- Event handler on ticket creation:
  - auto-assign team by category
  - increment H3 aggregates
- Analytics endpoints (`/analytics/h3`, `/analytics/top-cells`)
- Admin users API:
  - `GET /admin/users`
  - `PATCH /admin/users/:id`
- Frontend admin users page: `/admin/users`

## Project Structure

- `backend/` - Express API + DB scripts
- `frontend/` - React app

## Environment

Create `backend/.env`:

```env
PORT=3000
JWT_SECRET=change_me
H3_RESOLUTION=9
SUPABASE_DB_URL=postgresql://postgres.<project_ref>:<password>@<pooler-host>:6543/postgres
SUPABASE_SSL=true
CORS_ORIGIN=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_USE_MSW=false
```

Note:
- For Supabase pooler use port `6543`.
- If password has special chars (`@`, `:`, `/`, `#`), URL-encode it.

## Install

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

## Database Init

Run schema creation:

```bash
npm run init:db
```

Optional demo data:

```bash
npm run seed
```

## Run

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm --prefix frontend run dev
```

## API Overview

- Auth:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/me`
- Tickets:
  - `GET /tickets/getAll`
  - `GET /tickets/get/:id`
  - `POST /tickets/create`
  - `PUT /tickets/update/:id`
  - `DELETE /tickets/delete/:id`
  - `GET /tickets/audit/:id`
- Analytics:
  - `GET /analytics/h3`
  - `GET /analytics/top-cells`
- Admin:
  - `GET /admin/users`
  - `PATCH /admin/users/:id`

## Troubleshooting

- `ENOTFOUND`:
  - check host in `SUPABASE_DB_URL`
  - prefer pooler host from Supabase dashboard
- `28P01 password authentication failed`:
  - wrong username/password pair
  - for pooler username must include project ref (`postgres.<project_ref>`)
  - reset DB password in Supabase and update `.env`
