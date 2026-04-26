# HomeBase Backend

A NestJS (v11) API for managing shared household life: authentication, households, chores, expenses, needs, notifications, payments, and realtime updates.

## Tech Stack

- NestJS 11 (TypeScript)
- Prisma ORM 6 (PostgreSQL)
- JWT auth (passport-jwt) via HttpOnly cookie (`access_token`)
- Socket.IO for realtime events

## Project Structure

- src/app.module.ts – Root module
- src/auth – Auth module (JWT)
- src/household – Household module
- src/chore – Chores module
- src/expense – Expenses and shares
- src/need – Household needs (shopping list)
- src/payment – Payments/settlements
- src/notification – Notifications
- src/realtime – WebSocket gateway and events
- src/prisma – Prisma service/module

## Environment

- DATABASE_URL – PostgreSQL connection string
- JWT_SECRET – Secret for signing JWTs
- JWT_EXPIRES_IN – Token lifetime (e.g., 1d)
- PORT – HTTP port (default 3000)

Notes:

- CORS is enabled for `http://localhost:5173` with `credentials: true` (see `src/main.ts`). If your frontend runs elsewhere, update the origin.
- Auth is cookie-based: the server sets an HttpOnly `access_token` on login/register; clients must send credentials (`withCredentials: true`).

## Scripts

- npm run start:dev – Run with hot reload
- npm run build – Compile TypeScript
- npm run start:prod – Run compiled app
- npm run test / test:watch / test:cov – Tests
- npm run lint / format – Linting and formatting

## Local Development

1. Install deps: `npm install`
2. Start DB via Docker: `docker compose up -d db`
3. Prisma setup:
   - Generate client: `npx prisma generate`
   - Apply migrations: `npx prisma migrate dev`
4. Start API: `npm run start:dev`

API runs on http://localhost:3000 by default.

### Authentication

- Login/Register set an HttpOnly cookie `access_token`.
- Protected endpoints use `JwtGuard` which extracts the token from cookies (no `Authorization` header required).
- For browser clients, configure your HTTP client with `withCredentials: true` and enable CORS with credentials (already configured in `src/main.ts`).

## Deployment

### Render.com (Recommended)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

Quick deploy:
1. Push to GitHub
2. In Render: New → Blueprint → Connect repo
3. Render auto-creates database and web service
4. Update `FRONTEND_URL` env var with your frontend URL

### Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing (generate with `node scripts/jwt-secret.js`) |
| `FRONTEND_URL` | Production frontend URL (for CORS) |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Set to `production` |

## Documentation

- Start here: ./docs/README.md
- Modules:
  - ./docs/auth/README.md
  - ./docs/household/README.md
  - ./docs/chore/README.md
  - ./docs/expense/README.md
  - ./docs/need/README.md
  - ./docs/payment/README.md
  - ./docs/notification/README.md
  - ./docs/realtime/README.md
  - ./docs/prisma/README.md
