# Homebase

A full‑stack app to manage shared household life: authentication, households, chores, needs (shopping list), expenses, payments/settlements, notifications, and realtime updates.

- Backend: NestJS 11 + Prisma (PostgreSQL) + Socket.IO
- Frontend: React 19 + Vite 7 + React Router 7 + TanStack Query 5 + TailwindCSS + Zustand + Socket.IO Client

## Monorepo Structure

- backend/ — NestJS API, Prisma schema and migrations, module docs
- frontend/ — React SPA, feature folders, UI components, frontend docs

## Quick Start (Local Development)

Prerequisites:

- Node.js 20+
- npm 10+
- Docker (for local Postgres)

1. Start the database

- From `backend/` run:

```bash
docker compose up -d db
```

2. Configure environment

- Backend: copy `backend/.env` and adjust as needed (see `backend/README.md`).
- Frontend: `frontend/.env` contains `VITE_API_URL` (defaults to `http://localhost:3000`).

3. Install dependencies

- In `backend/` and `frontend/` run:

```bash
npm install
```

4. Prepare the backend

```bash
# In backend/
# Generate Prisma Client (runs on postinstall as well)
npx prisma generate
# Apply migrations (creates schema in the Postgres container)
npx prisma migrate dev
# Start API with hot reload
npm run start:dev
```

API default: http://localhost:3000

5. Run the frontend

```bash
# In frontend/
npm run dev
```

App default: http://localhost:5173

## Documentation

- Backend overview and module docs: [backend/README.md](backend/README.md) · [backend/docs/](backend/docs/)
- Frontend overview: [frontend/README.md](frontend/README.md)
- Frontend feature docs (APIs, usage, routes): [frontend/docs/](frontend/docs/)

## Scripts

- Backend: see `backend/package.json` (start, build, test, lint, prisma)
- Frontend: see `frontend/package.json` (dev, build, preview, lint)

## Tech Highlights

- Auth: JWT; API uses HTTP JSON; WebSocket handshake uses credentials
- Data: Prisma ORM over PostgreSQL
- State & Data Fetching: TanStack Query (caching, mutations) + Zustand (UI state)
- Realtime: Socket.IO with targeted query invalidations
- Styling: TailwindCSS and utility-driven components

## License

MIT License
