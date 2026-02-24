# Smart City Frontend (React + TypeScript + Vite)

Production-oriented MVP frontend for the **Smart City Issue Reporting & Analytics Platform**.

## Stack
- React + TypeScript + Vite
- TailwindCSS
- React Router
- TanStack Query (React Query)
- Axios
- Leaflet (OpenStreetMap) + marker clustering
- Recharts
- React Hook Form + Zod
- MSW (optional API mocks)

## Features (MVP)
- `/login`, `/register`
- `/map` citizen reporting + map/list/filter UI
- `/issue/:id` details page with map + comments + audit timeline
- `/admin/dashboard` charts and analytics widgets
- `/admin/issues` workflow management table with optimistic status updates
- JWT localStorage auth + Axios Bearer interceptor
- Protected routes + role-based route guard
- Auto logout on `401`

## Project Structure
- `src/api` Axios client and endpoint modules
- `src/auth` auth provider and route guards
- `src/pages` route pages
- `src/components` UI/layout/map components
- `src/types` shared types
- `src/utils` helpers/constants/query client
- `src/mocks` MSW mock API handlers

## Run
1. Install dependencies
```bash
cd frontend
npm install
```

2. Configure environment
```bash
cp .env.example .env
```

Default API URL:
- `VITE_API_URL=http://localhost:3000`

3. Start dev server
```bash
npm run dev
```

## Using MSW Mocks (recommended with current backend)
Your current backend does not yet expose the requested frontend contract (`/issues`, `/me`, `/analytics/summary`, etc.), so use MSW during frontend development.

1. Enable mocks in `.env`
```env
VITE_USE_MSW=true
```

2. Generate the MSW service worker file (one-time)
```bash
npx msw init public --save
```

Then run `npm run dev`.

## Role Testing Accounts (MSW)
- `citizen@example.com` / `password123` → `citizen`
- `deptadmin@example.com` / `password123` → `dept_admin`
- `admin@example.com` / `password123` → `university_admin`

## API Notes
The frontend API layer follows the requested contract:
- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `POST /issues`
- `GET /issues`
- `GET /issues/:id`
- `PATCH /issues/:id/status`
- `GET /analytics/summary`
- `GET /analytics/h3`

When the backend is updated to this contract, disable MSW (`VITE_USE_MSW=false`) and keep the same frontend code.
