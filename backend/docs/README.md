# Backend Documentation

This folder contains module-focused documentation for the Homebase backend. Each module README provides an overview, key models, common endpoints, and notes.

## Conventions

- NestJS modules, controllers, services, and DTOs
- Validation via class-validator and global ValidationPipe (whitelist, forbidNonWhitelisted, transform)
- Auth via JWT Bearer tokens
- Database via Prisma (PostgreSQL)

### Authentication

- All business endpoints require Bearer JWT (see Auth module). Example header:

```
Authorization: Bearer <JWT>
```

### Error shape

Standard NestJS HTTP errors with JSON bodies, e.g.:

```
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

### Realtime

- Socket.IO gateway exposes events under `src/realtime`.
- See ./realtime/README.md for rooms, events and client example.

## Modules

- Auth: ./auth/README.md
- Household: ./household/README.md
- Chore: ./chore/README.md
- Expense: ./expense/README.md
- Need: ./need/README.md
- Payment: ./payment/README.md
- Notification: ./notification/README.md
- Realtime: ./realtime/README.md
- Prisma: ./prisma/README.md

For high-level overview, see ../README.md.
