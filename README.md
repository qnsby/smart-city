# Smart City – Urban Incident Management (Express + SQLite + H3)

This project is a simplified but realistic backend for a Smart City institutional information system.
It supports role-based access control (RBAC), attribute-based access control (ABAC),
audit logging, event-driven processing, and H3 spatial indexing.

## Key Features
- Ticket creation with geolocation (lat/lng)
- H3 indexing (stored in DB) + queries by H3 cell
- Aggregation by H3 cell (heatmap-ready analytics)
- RBAC / ABAC access control using JWT
- Event-driven simulation (ticket_created → assignment + aggregation)
- Audit log for accountability (minimum 2 actions)

## Tech Stack
- Node.js + Express
- SQLite (better-sqlite3)
- JWT (jsonwebtoken)
- Password hashing (bcryptjs)
- H3 indexing (h3-js)

## Roles
- CITIZEN: can create tickets, view only own tickets
- OPERATOR: can view tickets and update status
- DEPT_ADMIN: can view tickets, update status, view analytics
- FIELD_WORKER: can view/update only tickets assigned to their department/team (ABAC)
- SUPERVISOR: can view analytics and system-wide overview

## How H3 is used
- On ticket creation, (latitude, longitude) is converted to an H3 cell id using `h3-js`.
- The H3 cell id is stored in `tickets.h3_index`.
- The API supports filtering tickets by `h3_index`.
- Analytics aggregates ticket counts by `h3_index` per day in `h3_aggregates`.

## Setup

### 1) Install dependencies
```bash
npm install