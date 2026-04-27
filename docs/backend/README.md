# Backend Documentation

Complete documentation for the Homebase NestJS backend API.

## Table of Contents

- [Overview](#overview)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)
- [Module Documentation](#module-documentation)

---

## Overview

The Homebase backend is a NestJS application providing RESTful APIs and WebSocket real-time communication for household management.

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-api-domain.com`

### Common Headers

All authenticated requests require the JWT cookie (handled automatically by browser):

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

---

## API Reference

### Auth Endpoints (`/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Create new account, sets JWT cookie |
| POST | `/auth/login` | No | Login, sets JWT cookie |
| POST | `/auth/logout` | No | Clears JWT cookie |
| GET | `/auth/users/me` | Yes | Get current user profile |
| PATCH | `/auth/users/me` | Yes | Update profile (name) |

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "householdId": null
  }
}
```

Sets `access_token` httpOnly cookie automatically.

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "householdId": 1
  }
}
```

#### Get Profile

```http
GET /auth/users/me
Cookie: access_token=<token>
```

Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### Update Profile

```http
PATCH /auth/users/me
Cookie: access_token=<token>
Content-Type: application/json

{
  "name": "John Updated"
}
```

---

### Household Endpoints (`/households`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/households` | Yes | Create new household |
| POST | `/households/join` | Yes | Join existing household |
| POST | `/households/leave` | Yes | Leave current household |
| GET | `/households/me` | Yes | Get my household details |

#### Create Household

```http
POST /households
Cookie: access_token=<token>
Content-Type: application/json

{
  "name": "The Cool Roommates"
}
```

Response:
```json
{
  "id": 1,
  "name": "The Cool Roommates",
  "inviteCode": "ABC123XYZ",
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  ]
}
```

WebSocket Events:
- `household:memberJoined` - Broadcast to new household room

#### Join Household

```http
POST /households/join
Cookie: access_token=<token>
Content-Type: application/json

{
  "inviteCode": "ABC123XYZ"
}
```

WebSocket Events:
- `household:memberJoined` - Broadcast to household room

#### Leave Household

```http
POST /households/leave
Cookie: access_token=<token>
```

WebSocket Events:
- `household:memberLeft` - Broadcast to household room
- `household:deleted` - If last member leaving

---

### Chore Endpoints (`/chores`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/chores` | Yes | List all household chores |
| POST | `/chores` | Yes | Create new chore |
| GET | `/chores/:id` | Yes | Get single chore |
| PATCH | `/chores/:id` | Yes | Update chore |
| PATCH | `/chores/:id/complete` | Yes | Mark chore complete |
| DELETE | `/chores/:id` | Yes | Delete chore |

#### List Chores

```http
GET /chores
Cookie: access_token=<token>
```

Response:
```json
[
  {
    "id": 1,
    "title": "Clean kitchen",
    "description": "Wash dishes",
    "dueDate": "2024-01-20T00:00:00Z",
    "isComplete": false,
    "householdId": 1,
    "assignedToId": 2,
    "assignedTo": {
      "id": 2,
      "name": "Jane Doe"
    }
  }
]
```

#### Create Chore

```http
POST /chores
Cookie: access_token=<token>
Content-Type: application/json

{
  "title": "Take out trash",
  "description": "Empty all bins",
  "dueDate": "2024-01-21T10:00:00Z",
  "assignedToId": 2
}
```

WebSocket Events:
- `chores:created` - Broadcast to household room

#### Update Chore

```http
PATCH /chores/1
Cookie: access_token=<token>
Content-Type: application/json

{
  "title": "Take out trash - updated",
  "assignedToId": 3
}
```

WebSocket Events:
- `chores:updated` - Broadcast to household room
- `chores:assigned` - If assignment changed

#### Complete Chore

```http
PATCH /chores/1/complete
Cookie: access_token=<token>
```

WebSocket Events:
- `chores:completed` - Broadcast to household room

---

### Expense Endpoints (`/expenses`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/expenses` | Yes | List all household expenses |
| POST | `/expenses` | Yes | Create new expense |
| GET | `/expenses/balance` | Yes | Get current balance sheet |
| GET | `/expenses/settlements` | Yes | Get optimal settlements |
| GET | `/expenses/settlements/me` | Yes | Get my settlements only |

#### List Expenses

```http
GET /expenses
Cookie: access_token=<token>
```

Response:
```json
[
  {
    "id": 1,
    "description": "Groceries",
    "totalAmount": 150.00,
    "date": "2024-01-15T00:00:00Z",
    "paidById": 1,
    "paidBy": {
      "id": 1,
      "name": "John Doe"
    },
    "participants": [
      { "userId": 1, "shareAmount": 50, "user": { "name": "John" } },
      { "userId": 2, "shareAmount": 50, "user": { "name": "Jane" } },
      { "userId": 3, "shareAmount": 50, "user": { "name": "Bob" } }
    ]
  }
]
```

#### Create Expense

```http
POST /expenses
Cookie: access_token=<token>
Content-Type: application/json

{
  "description": "Electric bill",
  "totalAmount": 120.00,
  "date": "2024-01-15T00:00:00Z",
  "participants": [
    { "userId": 1, "shareAmount": 40 },
    { "userId": 2, "shareAmount": 40 },
    { "userId": 3, "shareAmount": 40 }
  ]
}
```

WebSocket Events:
- `expenses:created` - Broadcast to household room
- `expenses:balanceUpdated` - With reason: 'expenseCreated'

#### Get Balance

```http
GET /expenses/balance
Cookie: access_token=<token>
```

Response:
```json
{
  "balances": {
    "1": 100.00,
    "2": -50.00,
    "3": -50.00
  },
  "netOwed": {
    "1": { "2": 50, "3": 50 },
    "2": { "1": -50 },
    "3": { "1": -50 }
  }
}
```

#### Get Settlements

```http
GET /expenses/settlements
Cookie: access_token=<token>
```

Response:
```json
{
  "settlements": [
    { "from": 2, "to": 1, "amount": 50 },
    { "from": 3, "to": 1, "amount": 50 }
  ]
}
```

---

### Payment Endpoints (`/payments`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/payments` | Yes | List all household payments |
| POST | `/payments` | Yes | Record a payment |

#### Record Payment

```http
POST /payments
Cookie: access_token=<token>
Content-Type: application/json

{
  "toUserId": 1,
  "amount": 50
}
```

WebSocket Events:
- `payments:recorded` - Broadcast to household room
- `expenses:balanceUpdated` - With reason: 'paymentRecorded'

---

### Need Endpoints (`/needs`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/needs` | Yes | List all household needs |
| POST | `/needs` | Yes | Add new need |
| PATCH | `/needs/:id` | Yes | Update need |
| PATCH | `/needs/:id/purchase` | Yes | Mark need as purchased |
| DELETE | `/needs/:id` | Yes | Delete need |

#### List Needs

```http
GET /needs
Cookie: access_token=<token>
```

Response:
```json
[
  {
    "id": 1,
    "name": "Milk",
    "quantity": "2 liters",
    "category": "Dairy",
    "isPurchased": false,
    "addedById": 1,
    "addedBy": { "name": "John" }
  }
]
```

#### Add Need

```http
POST /needs
Cookie: access_token=<token>
Content-Type: application/json

{
  "name": "Bread",
  "quantity": "1 loaf",
  "category": "Bakery"
}
```

WebSocket Events:
- `needs:itemAdded` - Broadcast to household room

#### Mark Purchased

```http
PATCH /needs/1/purchase
Cookie: access_token=<token>
Content-Type: application/json

{
  "createExpense": true,
  "expenseDescription": "Weekly groceries"
}
```

WebSocket Events:
- `needs:itemPurchased` - Broadcast to household room
- `needs:expenseCreated` - If createExpense was true

---

### Notification Endpoints (`/notifications`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/notifications` | Yes | List notifications |
| PATCH | `/notifications/:id/read` | Yes | Mark single notification as read |
| PATCH | `/notifications/read-all` | Yes | Mark all as read |
| DELETE | `/notifications/:id` | Yes | Delete notification |

#### List Notifications

```http
GET /notifications
Cookie: access_token=<token>
```

Response:
```json
[
  {
    "id": 1,
    "message": "Alice added an expense: Groceries",
    "type": "expense_added",
    "isRead": false,
    "actorId": 2,
    "actor": { "name": "Alice" },
    "entityType": "expense",
    "entityId": 1,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

### Health Endpoints (`/health`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | No | Full health check |
| GET | `/health/live` | No | Liveness probe (DB only) |
| GET | `/health/ready` | No | Readiness probe (DB + WebSocket) |

---

## Authentication

Homebase uses JWT tokens stored in httpOnly cookies for authentication.

### JWT Flow

```
1. Client POST /auth/login { email, password }
2. Server validates credentials
3. Server signs JWT with payload: { sub: userId, email }
4. Server sets cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Lax
5. Client includes cookie automatically on subsequent requests
6. Server extracts JWT from cookie via custom strategy
7. Server validates JWT and attaches user to request
```

### Cookie Configuration

| Environment | Secure | SameSite | Domain |
|-------------|--------|----------|--------|
| Development | false | Lax | localhost |
| Production | true | None | undefined |

### Token Payload

```json
{
  "sub": 1,
  "email": "user@example.com",
  "iat": 1705312000,
  "exp": 1705916800
}
```

---

## Database Schema

See [Prisma Schema Reference](./database.md) for complete schema documentation.

### Entity Summary

| Entity | Purpose | Key Relations |
|--------|---------|---------------|
| User | Account holder | belongs to Household |
| Household | Shared living group | has many Users, Chores, Expenses |
| Chore | Task assignment | assigned to User |
| Expense | Shared cost | paid by User, split among participants |
| ExpenseParticipant | Expense split details | links Expense and User |
| Payment | Debt settlement | from User to User |
| HouseholdNeed | Shopping list item | added by User, purchased by User |
| Notification | Activity feed | linked to Household, User, Actor |

---

## WebSocket Events

All real-time events are broadcast to the `household:{id}` room.

### Event Reference

#### Household Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `household:memberJoined` | `{ userId, userName }` | User joins household |
| `household:memberLeft` | `{ userId }` | User leaves household |
| `household:deleted` | `{ householdId }` | Last member leaves |
| `household:inviteRegenerated` | `{ inviteCode }` | New invite code generated |

#### Chore Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `chores:created` | `{ id, ...chore }` | Chore created |
| `chores:updated` | `{ id, ...chore }` | Chore updated |
| `chores:completed` | `{ id, completedAt }` | Chore marked complete |
| `chores:deleted` | `{ id }` | Chore deleted |
| `chores:assigned` | `{ id, assignedToId }` | Chore reassigned |

#### Expense Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `expenses:created` | `{ id, ...expense }` | Expense created |
| `expenses:updated` | `{ id, ...expense }` | Expense updated |
| `expenses:deleted` | `{ id }` | Expense deleted |
| `expenses:balanceUpdated` | `{ reason, balances }` | Balance changed |

#### Payment Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `payments:recorded` | `{ id, ...payment }` | Payment recorded |

#### Need Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `needs:itemAdded` | `{ id, ...need }` | Need created |
| `needs:itemUpdated` | `{ id, ...need }` | Need updated |
| `needs:itemPurchased` | `{ id, purchasedById }` | Need marked purchased |
| `needs:expenseCreated` | `{ expenseId, needIds }` | Auto-expense from purchase |

#### Notification Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `notifications:new` | `{ id, ...notification }` | New notification |
| `notifications:read` | `{ id } or { all: true }` | Marked read |
| `notifications:deleted` | `{ id }` | Notification deleted |

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "field": "email", "message": "Email already exists" }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Wrong household |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected error |

### Rate Limiting

| Tier | Endpoints | Limit |
|------|-----------|-------|
| Auth | `/auth/login`, `/auth/register` | 10/min |
| Profile | `/auth/users/me` (PATCH) | 100/15min |
| General | All other endpoints | 300/hour |

---

## Module Documentation

### Module Structure

```
src/
├── auth/           # Authentication & user management
├── household/      # Household CRUD & membership
├── chore/          # Task management
├── expense/        # Expense tracking & settlements
├── payment/        # Payment recording
├── need/           # Shopping list
├── notification/   # Activity feed
├── realtime/       # WebSocket gateway
├── prisma/         # Database service
├── health/         # Health checks
└── common/         # Guards, decorators, utilities
```

### Common Components

#### Guards

- `JwtGuard`: Validates JWT from cookie
- `AuthThrottlerGuard`: Rate limits auth endpoints
- `ProfileUpdateThrottlerGuard`: Rate limits profile updates

#### Decorators

- `@UserId()`: Extracts user ID from request
- `@HouseholdId()`: Extracts household ID from user's JWT payload

#### Utilities

- `PrismaService`: Database client wrapper
- `HouseholdIdMiddleware`: Attaches household ID to request

---

## Further Reading

- [Database Schema Details](./database.md)
- [WebSocket Implementation](./websocket.md)
- [Error Codes Reference](./errors.md)
- [Testing Guide](./testing.md)
