# Homebase Documentation

Welcome to the comprehensive Homebase documentation. This is your central hub for understanding the project architecture, development workflows, and implementation details.

## 📚 Documentation Structure

```
docs/
├── README.md                 # This file - Documentation index
├── architecture.md           # System architecture & design
├── contributing.md           # Contribution guidelines (future)
├── backend/
│   └── README.md             # Backend API documentation
└── frontend/
    └── README.md             # Frontend application documentation
```

## 🚀 Quick Navigation

### Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [Root README](../README.md) | Project overview, quick start | Everyone |
| [SETUP.md](../SETUP.md) | Local development setup | Developers |
| [Architecture Overview](./architecture.md) | System design, tech stack | Developers, Architects |

### Backend

| Document | Description | Topics |
|----------|-------------|--------|
| [Backend Docs](./backend/README.md) | Complete API documentation | Authentication, Endpoints, WebSocket |
| [API Reference](./backend/README.md#api-reference) | All endpoints with examples | REST API, Requests, Responses |
| [Authentication](./backend/README.md#authentication) | JWT cookie auth flow | Security, Cookies |
| [Database Schema](./backend/README.md#database-schema) | Entity relationships | Prisma, PostgreSQL |
| [WebSocket Events](./backend/README.md#websocket-events) | Real-time events | Socket.IO |

### Frontend

| Document | Description | Topics |
|----------|-------------|--------|
| [Frontend Docs](./frontend/README.md) | Complete frontend documentation | Architecture, Features |
| [Project Structure](./frontend/README.md#project-structure) | Directory organization | Conventions, Patterns |
| [Routing](./frontend/README.md#routing) | Route configuration | React Router, Guards |
| [State Management](./frontend/README.md#state-management) | Data flow | TanStack Query, Zustand |
| [Features](./frontend/README.md#features) | Feature modules | All features documented |

## 🏗️ Architecture Overview

Homebase is a full-stack household management application built with:

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: React + Vite + TailwindCSS + TanStack Query
- **Real-time**: Socket.IO for live updates
- **Auth**: JWT in httpOnly cookies

### Key Features

1. **Multi-tenancy via Households** - Each household is isolated
2. **Real-time Collaboration** - WebSocket updates keep members in sync
3. **Expense Tracking** - Complex splits with automatic settlements
4. **Notification System** - Activity feed with read/unread tracking
5. **Chore Management** - Assignment and completion tracking
6. **Shopping List** - Needs with category organization

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│  ├── Vite build tool                                        │
│  ├── TailwindCSS + shadcn/ui components                     │
│  ├── TanStack Query (server state)                          │
│  ├── Zustand (UI state)                                     │
│  └── Socket.IO client                                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (NestJS)                                           │
│  ├── REST API controllers                                   │
│  ├── JWT authentication (httpOnly cookies)                  │
│  ├── Prisma ORM                                             │
│  ├── Rate limiting & security                               │
│  └── Socket.IO gateway                                      │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma Client
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                      │
│  ├── User, Household                                        │
│  ├── Chore, Expense, Payment                                │
│  ├── HouseholdNeed, Notification                            │
│  └── ExpenseParticipant                                     │
└─────────────────────────────────────────────────────────────┘
```

## 📖 Reading Guide

### For New Developers

1. Start with [SETUP.md](../SETUP.md) - Get the app running locally
2. Read [Architecture Overview](./architecture.md) - Understand the system
3. Dive into [Backend](./backend/README.md) or [Frontend](./frontend/README.md) docs

### For API Integration

1. Read [Authentication](./backend/README.md#authentication) - Understand auth flow
2. Browse [API Reference](./backend/README.md#api-reference) - Find endpoints
3. Check [WebSocket Events](./backend/README.md#websocket-events) - Real-time features

### For Feature Development

1. Review [Frontend Project Structure](./frontend/README.md#project-structure)
2. Study [State Management](./frontend/README.md#state-management) patterns
3. Read specific [Feature docs](./frontend/README.md#features)

## 🛠️ Tech Stack Details

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Node.js framework |
| Prisma | 6.x | Database ORM |
| PostgreSQL | 14+ | Database |
| Socket.IO | 4.x | Real-time communication |
| Passport | latest | Authentication |
| class-validator | latest | Input validation |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 4.x | Styling |
| shadcn/ui | latest | UI components |
| TanStack Query | 5.x | Server state |
| Zustand | 4.x | Client state |
| React Router | 7.x | Routing |

## 🔐 Security Considerations

- **Authentication**: JWT tokens in httpOnly cookies (XSS protection)
- **Authorization**: JWT Guard on all protected endpoints
- **Input Validation**: Class-validator with whitelist
- **Rate Limiting**: Tiered throttling (auth, profile, general)
- **Security Headers**: Helmet middleware
- **CORS**: Configured to allow only FRONTEND_URL

## 📡 Real-time Communication

All household updates are broadcast via WebSocket to the `household:{id}` room:

| Feature | Events |
|---------|--------|
| Chores | `chores:created`, `chores:updated`, `chores:completed`, `chores:deleted` |
| Expenses | `expenses:created`, `expenses:updated`, `expenses:balanceUpdated` |
| Payments | `payments:recorded` |
| Needs | `needs:itemAdded`, `needs:itemUpdated`, `needs:itemPurchased` |
| Household | `household:memberJoined`, `household:memberLeft` |
| Notifications | `notifications:new`, `notifications:read` |

## 🧪 Testing

### Backend

```bash
cd backend
npm run test      # Unit tests
npm run test:e2e  # End-to-end tests
```

### Frontend

```bash
cd frontend
npm run test      # Vitest tests
npm run test:ui   # Vitest UI
```

## 🚢 Deployment

### Backend (Render.com)

1. Push to GitHub
2. In Render: **New** → **Blueprint**
3. Connect repository
4. Auto-deploys with PostgreSQL

See [backend/DEPLOYMENT.md](../backend/DEPLOYMENT.md) for details.

### Frontend (Vercel)

1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set `VITE_API_URL` environment variable

## 🤝 Contributing

We welcome contributions! Please:

1. Read the [Architecture](./architecture.md) to understand design decisions
2. Follow the project structure and conventions
3. Write tests for new features
4. Update documentation as needed

## 📞 Support

If you encounter issues:

1. Check the relevant documentation section
2. Review [SETUP.md](../SETUP.md) for common setup issues
3. Check logs (backend terminal, browser console)

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

---

**Need more detail?** Explore the [Backend](./backend/README.md) or [Frontend](./frontend/README.md) documentation.
