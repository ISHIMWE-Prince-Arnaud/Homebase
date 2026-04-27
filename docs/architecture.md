# Homebase Architecture

This document describes the high-level system architecture, data flow, and design decisions for Homebase.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Database Design](#database-design)
7. [Real-time Communication](#real-time-communication)
8. [Deployment Architecture](#deployment-architecture)

---

## System Overview

Homebase is a full-stack web application designed for shared household management. It supports multiple households, each with multiple members who can manage chores, expenses, shopping needs, and payments together.

### Core Features

- **Multi-tenancy via Households**: Each household is isolated with its own data
- **Real-time Collaboration**: WebSocket updates keep all members in sync
- **Expense Tracking & Settlement**: Complex split calculations with payment recording
- **Notification System**: Activity feed with read/unread tracking
- **Responsive Design**: Mobile-first UI with PWA capabilities

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │   Browser   │    │   Browser   │    │   Browser   │    │ Mobile App │ │
│  │  (Alice)    │    │   (Bob)     │    │  (Charlie)  │    │  (Future)  │ │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────┬──────┘ │
│         │                  │                  │                 │        │
│         └──────────────────┼──────────────────┘                 │        │
│                            │                                    │        │
│                    ┌───────┴───────┐                           │        │
│                    │  Vercel CDN   │◄──────────────────────────┘        │
│                    │ (Static Files)│                                     │
│                    └───────┬───────┘                                     │
└────────────────────────────┼──────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────┼──────────────────────────────────────────────┐
│                      API LAYER (NestJS)                                    │
├────────────────────────────┼──────────────────────────────────────────────┤
│                            │                                              │
│  ┌───────────────────────┴─────────────────────────────────────────┐     │
│  │                    Render.com / VPS                              │     │
│  │  ┌─────────────────────────────────────────────────────────┐   │     │
│  │  │                    NestJS Application                    │   │     │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │     │
│  │  │  │  Auth    │ │ Household│ │  Chore   │ │ Expense  │  │   │     │
│  │  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │   │     │
│  │  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │     │
│  │  │  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ │   │     │
│  │  │  │   Need   │ │ Payment  │ │ Notification│ │ Realtime │ │   │     │
│  │  │  │  Module  │ │  Module  │ │  Module  │ │ Gateway  │ │   │     │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │     │
│  │  └─────────────────────────────────────────────────────────┘   │     │
│  │                              │                                 │     │
│  │  ┌───────────────────────────┴─────────────────────────────┐   │     │
│  │  │              Middleware & Guards                        │   │     │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │     │
│  │  │  │  JWT     │ │ Rate     │ │ Helmet   │ │ CORS     │  │   │     │
│  │  │  │  Guard   │ │ Limiter  │ │ Headers  │ │ Config   │  │   │     │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │     │
│  │  └─────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                             │
                             │ Prisma Client
                             │
┌────────────────────────────┼──────────────────────────────────────────────┐
│                   DATABASE LAYER (PostgreSQL)                              │
├────────────────────────────┼──────────────────────────────────────────────┤
│                            │                                              │
│  ┌─────────────────────────┴─────────────────────────┐                     │
│  │         Render.com PostgreSQL / Self-hosted     │                     │
│  │                                                 │                     │
│  │  Tables:                                        │                     │
│  │  • User        • Household   • Chore          │                     │
│  │  • Expense     • Payment     • Need           │                     │
│  │  • Notification • ExpenseParticipant          │                     │
│  │                                                 │                     │
│  └─────────────────────────────────────────────────┘                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | NestJS 11 | Modular Node.js framework |
| Language | TypeScript 5 | Type-safe development |
| Database | PostgreSQL 14 | Relational data storage |
| ORM | Prisma 6 | Database access & migrations |
| Auth | Passport + JWT | Authentication with httpOnly cookies |
| Realtime | Socket.IO | WebSocket communication |
| Validation | class-validator | DTO validation |
| Security | Helmet | HTTP security headers |
| Rate Limiting | @nestjs/throttler | Request throttling |
| Testing | Jest | Unit & e2e tests |

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 19 | UI library |
| Build Tool | Vite 7 | Fast dev server & bundler |
| Language | TypeScript 5 | Type-safe development |
| Styling | TailwindCSS 4 | Utility-first CSS |
| Components | shadcn/ui | Accessible component primitives |
| State (Server) | TanStack Query 5 | Server state management |
| State (Client) | Zustand | UI state management |
| Routing | React Router 7 | Client-side routing |
| Icons | Lucide React | Icon library |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Schema validation |
| Testing | Vitest | Unit tests |

---

## Data Flow

### Authentication Flow

```
1. User submits credentials (login/register)
   ↓
2. Backend validates credentials
   ↓
3. JWT generated, set as httpOnly cookie
   ↓
4. Client stores no token (cookie auto-sent)
   ↓
5. Subsequent requests include cookie automatically
   ↓
6. JWT Guard extracts & validates token
   ↓
7. Request proceeds to controller
```

### Household Data Flow

```
1. User creates/joins household
   ↓
2. Backend creates household + invite code
   ↓
3. WebSocket: User joins household room
   ↓
4. All household data filtered by householdId
   ↓
5. Realtime updates broadcast to room members
```

### Expense & Payment Flow

```
1. User creates expense with participants/shares
   ↓
2. Backend calculates balances per user
   ↓
3. WebSocket: Broadcast 'expense:created'
   ↓
4. Frontend invalidates queries, refetches
   ↓
5. User records payment to settle debt
   ↓
6. Backend updates balances, creates notification
   ↓
7. WebSocket: Broadcast 'payment:recorded'
```

---

## Security Architecture

### Authentication

- **JWT Tokens**: Signed with HS256, stored in httpOnly cookies
- **Cookie Security**: Secure flag in production, SameSite=Lax (dev) / None (prod)
- **Token Expiry**: 7 days default (configurable via JWT_EXPIRATION)
- **No LocalStorage**: Tokens never exposed to JavaScript (XSS protection)

### Authorization

- **JWT Guard**: Validates token on protected routes
- **Household Scoping**: All queries filtered by user's householdId
- **Ownership Checks**: Services verify user permissions

### Input Validation

- **Class Validator**: DTOs validated with decorators
- **Whitelist**: Extra properties stripped automatically
- **SQL Injection**: Prisma ORM prevents injection attacks

### Rate Limiting

```
Tier 1 (Auth Endpoints):     10 requests / 1 minute
Tier 2 (Profile Updates):    100 requests / 15 minutes  
Tier 3 (General API):        300 requests / 1 hour
```

### HTTP Security

- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configured to allow only FRONTEND_URL
- **No Sniff**: MIME type sniffing disabled

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Household    │────<│      User       │>────│  Notification   │
├─────────────────┤  1:N ├─────────────────┤ N:1  ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ name            │     │ email (unique)  │     │ householdId(FK) │
│ inviteCode      │     │ password        │     │ userId (FK)     │
│ createdAt       │     │ name            │     │ actorId (FK)    │
│ updatedAt       │     │ householdId(FK) │     │ message         │
└────────┬────────┘     │ createdAt       │     │ type            │
         │              │ updatedAt       │     │ isRead          │
         │              └────────┬────────┘     │ entityType      │
         │                       │              │ entityId        │
         │                       │              │ createdAt         │
         │              ┌────────┴────────┐      └─────────────────┘
         │              │                 │
         │       ┌──────┴──────┐   ┌─────┴──────┐
         │       │             │   │            │
         │  ┌────┴────┐   ┌────┴───┐│ ┌────────┐│
         │  │  Chore  │   │ Expense││ │ Payment││
         │  ├─────────┤   ├────────┤│ ├────────┤│
         │  │household│   │household││ │household│
         │  │assignedTo│   │ paidBy  ││ │fromUser│
         └─>│         │   │         ││ │toUser  │
            └────┬────┘   └────┬───┘│ └────────┘
                 │             │
            ┌────┴─────────────┴────┐
            │   ExpenseParticipant  │
            ├───────────────────────┤
            │ expenseId (FK)        │
            │ userId (FK)           │
            │ shareAmount           │
            └───────────────────────┘

┌─────────────────┐
│ HouseholdNeed   │
├─────────────────┤
│ id (PK)         │
│ householdId(FK) │
│ addedById (FK)  │
│ purchasedById(FK│
│ name            │
│ quantity        │
│ category        │
│ isPurchased     │
└─────────────────┘
```

### Key Design Decisions

1. **Soft Relationships**: User.householdId is nullable (users can exist without households)
2. **Cascading Deletes**: On household deletion, all related data is removed
3. **Audit Trail**: createdAt/updatedAt on all entities
4. **Invite Codes**: Unique, auto-generated for household joining

---

## Real-time Communication

### WebSocket Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Socket.IO Gateway                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Connection Management:                                       │
│  • Auth via cookie (access_token)                            │
│  • Join room: `household:{id}`                               │
│  • Disconnect cleanup                                         │
│                                                              │
│  Event Categories:                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │  Household  │ │    Chores   │ │  Expenses   │            │
│  │  Events     │ │   Events    │ │   Events    │            │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤            │
│  │ memberJoined│ │ created     │ │ created     │            │
│  │ memberLeft  │ │ updated     │ │ updated     │            │
│  │ deleted     │ │ completed   │ │ deleted     │            │
│  │ inviteRegen │ │ assigned    │ │ balanceUpdated│           │
│  │             │ │ deleted     │ │             │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Needs     │ │  Payments   │ │ Notifications│            │
│  │   Events    │ │   Events    │ │   Events     │            │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤            │
│  │ itemAdded   │ │ recorded    │ │ read        │            │
│  │ itemUpdated │ │             │ │ allRead     │            │
│  │ itemPurchased│ │            │ │ deleted     │            │
│  │ expenseCreated│ │            │ │             │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Client Query Invalidation

Each WebSocket event maps to specific TanStack Query keys for automatic cache refresh:

| WebSocket Event | Invalidated Query Keys |
|-----------------|------------------------|
| `chores:created` | `['chores']` |
| `chores:completed` | `['chores']` |
| `expenses:created` | `['expenses', 'balance', 'settlements']` |
| `payments:recorded` | `['payments', 'balance', 'settlements']` |
| `needs:itemAdded` | `['needs']` |

---

## Deployment Architecture

### Production Setup

```
┌──────────────────────────────────────────────────────────────┐
│                         DNS / CDN                             │
│                    (Cloudflare / Route 53)                    │
└──────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────────┐                 ┌─────────────────────┐
│   Vercel (Frontend) │                 │  Render.com (API)   │
│                     │                 │                     │
│  • Static files     │                 │  • NestJS app       │
│  • Edge network     │                 │  • Environment vars │
│  • Auto-deploy      │                 │  • Health checks    │
└─────────────────────┘                 └──────────┬──────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────────┐
                                         │ PostgreSQL Database │
                                         │                     │
                                         │  • Managed by Render│
                                         │  • Auto-backups     │
                                         │  • SSL connection   │
                                         └─────────────────────┘
```

### Environment Configuration

| Service | Environment | Key Variables |
|---------|-------------|---------------|
| Frontend | Vercel | `VITE_API_URL` |
| Backend | Render | `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production` |
| Database | Render | Auto-configured |

### Health Checks

- **Liveness**: `GET /health/live` - Database connectivity
- **Readiness**: `GET /health/ready` - Database + WebSocket status
- **Full Check**: `GET /health` - Complete system status

---

## Scalability Considerations

### Current Limits

- WebSocket connections: Limited by server memory
- Database: PostgreSQL vertical scaling
- File uploads: Not implemented (future feature)

### Future Improvements

1. **Redis**: Session store & WebSocket adapter for multi-instance
2. **CDN**: Static asset caching
3. **Read Replicas**: Database read scaling
4. **Rate Limiting**: Redis-based distributed rate limiting

---

## Development Workflow

```
Local Development                    Production
┌─────────────┐                     ┌─────────────┐
│  Frontend   │◄───── API ─────────►│   Backend   │
│  localhost  │   (CORS enabled)    │   Render    │
│   :5173     │                     │    :443     │
└──────┬──────┘                     └──────┬──────┘
       │                                    │
       │         ┌─────────────┐           │
       └────────►│  Local DB   │◄──────────┘
                 │  localhost  │
                 │   :5432     │
                 └─────────────┘
```

---

## Further Reading

- [Backend Documentation](./backend/) - API details, database schema
- [Frontend Documentation](./frontend/) - Component architecture, state management
- [Setup Guide](../SETUP.md) - Local development setup
