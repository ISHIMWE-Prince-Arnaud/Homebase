# Homebase Frontend

React SPA for managing shared household life. It talks to the NestJS backend and uses realtime updates.

## Tech Stack

- React 19 + Vite 7
- React Router 7
- TanStack Query 5
- TailwindCSS
- Zustand (UI state)
- Axios + Socket.IO Client

## Local Development

1. Environment

- Create or edit `./.env`

```
VITE_API_URL=http://localhost:3000
```

2. Install deps

```
npm install
```

3. Run dev server

```
npm run dev
```

App default: http://localhost:5173

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Type-check and build
- `npm run preview` — Preview production build
- `npm run lint` — Lint source

## Project Structure

- `src/App.tsx` — Routes
- `src/main.tsx` — Providers: QueryClient, ThemeProvider, Router, Realtime, Toaster
- `src/api/` — Axios client
- `src/features/` — Feature folders (auth, household, chores, needs, expenses, payments, notifications, realtime)
- `src/hooks/` — App hooks (auth, household, etc.)
- `src/layouts/` — Layouts (public, app)
- `src/components/` — UI & layout components
- `src/stores/` — Zustand store(s)
- `src/lib/` — Utilities (display, toast, utils)

## Routing

- Public
  - `/login`
  - `/register`
- Protected (requires auth)
  - `/household` — Manage/create/join household (accessible to any authenticated user)
  - `/profile`
  - Requires existing household
    - `/dashboard`
    - `/chores`
    - `/needs`
    - `/expenses`
    - `/payments`
    - `/notifications`
- Fallback: any `*` redirects to `/dashboard`

Guards:

- `ProtectedRoute` — Redirects unauthenticated users to `/login`
- `HouseholdRequiredRoute` — Redirects users without a household to `/household`

## Data & State

- TanStack Query for server state (caching, mutations). See `src/main.tsx` default options.
- Zustand for UI state: `src/stores/uiStore.ts` (sidebar, theme, notification panel). Theme persisted (`ui-storage`).

## API Client

- `src/api/client.ts` creates an Axios instance using `VITE_API_URL`.
- `withCredentials: true` so the browser sends the HttpOnly `access_token` cookie.
- Global response interceptor warns on 401.

## Realtime

- `src/features/realtime/RealtimeProvider.tsx` opens a Socket.IO connection to `VITE_API_URL`.
- Events are mapped in `src/features/realtime/events.ts` to invalidate specific React Query keys.

## Frontend Docs

Docs Index:

- ./docs/README.md — Overview
- ./docs/routing.md — Routing
- ./docs/api-client.md — API Client
- ./docs/state.md — State & Data
- ./docs/realtime.md — Realtime
- ./docs/auth.md — Auth
- ./docs/household.md — Household
- ./docs/chores.md — Chores
- ./docs/needs.md — Needs
- ./docs/expenses.md — Expenses
- ./docs/payments.md — Payments
- ./docs/notifications.md — Notifications
