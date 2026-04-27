# Frontend Documentation

This folder documents the Homebase frontend features and the API endpoints they consume.

- Start here if you want an overview of routing, data, and realtime.
- Each feature doc lists the endpoints used and key UI/UX flows.

## Index

- ./routing.md
- ./api-client.md
- ./state.md
- ./realtime.md
- ./auth.md
- ./household.md
- ./chores.md
- ./needs.md
- ./expenses.md
- ./payments.md
- ./notifications.md

## Conventions

- All requests go to `VITE_API_URL` and include credentials (HttpOnly cookie `access_token`).
- Data fetching: TanStack Query with carefully chosen query keys.
- Realtime: Socket.IO invalidates queries mapped in `features/realtime/events.ts`.
