# Smart City Platform

## Team Members

- `Dias Konysbay 230103235`
- `Adina Kenzhebekova 230103312`
- `Yerdaulet Kaiyrbergen: 230103131`
- `Temirlan Bakhytzhan: 230103123`


## Project Overview
Smart City Platform is a full-stack web application for reporting, tracking, assigning, and resolving city incidents. The system helps citizens submit urban issues, while operators, department admins, field workers, and supervisors coordinate the full incident workflow through role-based dashboards, maps, and analytics. 

The platform is designed as an incident management system for a smart city environment. It supports issue creation, workflow control, department assignment, audit tracking, and analytics for operational monitoring.

## Problem Statement
Cities receive many public complaints and infrastructure reports every day, but these reports are often handled through fragmented channels such as phone calls, chats, spreadsheets, or manual forwarding. This creates several problems:

- slow response and unclear ownership of incidents
- poor visibility into issue status for citizens
- weak coordination between operators, departments, and field workers
- limited ability for supervisors to analyze trends and hotspots
- no unified audit trail for operational decisions

This project solves that problem by providing a centralized digital platform where city issues can be reported, assigned, processed, monitored, and analyzed in one system.

## Proposed Solution
The solution is a role-based Smart City incident platform with the following flow:

1. Citizens submit reports with category, description, map location, and optional photo evidence.
2. Operators and admins review incoming tickets and assign them to departments and field workers.
3. Field workers process assigned incidents and update their status.
4. Supervisors and admins monitor activity through analytics dashboards and geospatial summaries.
5. The system stores audit logs and ticket history for traceability.

## Main Features
- User authentication and registration
- Role-based access control
- Ticket creation with map coordinates
- Ticket assignment by department and worker
- Workflow status management
- Photo upload support
- Audit logging and status history
- Department-aware worker assignment
- Analytics dashboards with charts and map-based insights
- User administration for privileged roles

## User Roles
- `CITIZEN`: creates reports and views own reports
- `OPERATOR`: reviews queues, updates tickets, assigns departments and workers
- `DEPARTMENT_ADMIN`: manages workflow and user access at department level
- `FIELD_WORKER`: works only on assigned tasks
- `CITY_SUPERVISOR`: monitors dashboards and analytics
- `SUPERADMIN`: full system access

## Tech Specs

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- Recharts
- Leaflet / React Leaflet

### Backend
- Node.js
- Express
- Prisma ORM
- JWT authentication
- bcryptjs
- multer
- h3-js

### Database and Storage
- PostgreSQL via Supabase
- Supabase Storage for uploaded ticket photos

## System Architecture
- `frontend/`: client-side application with role-based pages and dashboards
- `backend/`: REST API, authentication, business logic, database access
- `data/`: normalized CSV datasets used for import and analytics preparation

The frontend communicates with the backend through HTTP APIs. The backend uses Prisma to access PostgreSQL and stores uploaded images in Supabase Storage.

## Project Structure
```text
smart-city/
├─ backend/
│  ├─ prisma/
│  └─ src/
├─ frontend/
│  └─ src/
├─ data/
│  └─ normalized-smart-city/
├─ README.md
└─ .env
```

## Key Pages

### Public
- `/` - landing page
- `/login` - login page
- `/register` - citizen registration

### Authenticated
- `/dashboard` - citizen dashboard
- `/reportIssue` - report creation page
- `/myReport` - citizen report history
- `/issue/:id` - issue details

### Restricted
- `/operator` - operator ticket queue
- `/admin/issues` - workflow management
- `/admin/dashboard` - admin analytics
- `/admin/users` - user management
- `/tasks` - field worker tasks
- `/analyticsDashboard` - supervisor overview
- `/analytics` - analytics dashboard

## API Summary

### Auth
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

### Tickets
- `GET /tickets/departments`
- `GET /tickets/getAll`
- `GET /tickets/get/:id`
- `POST /tickets/create`
- `PUT /tickets/update/:id`
- `DELETE /tickets/delete/:id`
- `GET /tickets/audit/:id`

### Analytics
- `GET /analytics/summary`
- `GET /analytics/h3`
- `GET /analytics/top-cells`

### Admin
- `GET /admin/users`
- `PATCH /admin/users/:id`

## Database Model
Main entities:
- `Department`
- `User`
- `TicketCategory`
- `Ticket`
- `TicketComment`
- `TicketAttachment`
- `TicketStatusHistory`
- `AuditLog`
- `H3Aggregate`

Core enums:
- `Role`
- `TicketStatus`

## Setup Instructions

### 1. Install dependencies
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure environment variables
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

### 3. Initialize the database
```bash
npm run init:db
```

### 4. Optional demo data
```bash
npm run seed
```

### 5. Run the project
Backend:
```bash
npm run dev
```

Frontend:
```bash
npm --prefix frontend run dev
```

## Default Local URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Workflow Notes
- New tickets enter the system with status `NEW`
- Tickets can move through `NEW`, `IN_PROGRESS`, `DONE`, and `REJECTED`
- Department assignment is controlled on the backend
- Worker assignment must match the ticket department
- Analytics use H3 geospatial indexing for area-based summaries

## Current Limitations / Notes
- Google OAuth is not fully connected yet
- Some analytics derive insights from current ticket data rather than a separate BI pipeline
- The repository contains normalized CSV datasets for import and analytics support

## Troubleshooting
- `ENOTFOUND`: verify the Supabase host in `SUPABASE_DB_URL`
- `28P01 password authentication failed`: verify database username, password, and project reference
- `401 Unauthorized`: verify JWT secret and request token
- CORS errors: ensure `CORS_ORIGIN` matches the frontend URL
