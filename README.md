# Homebase

A full‑stack app to manage shared household life: authentication, households, chores, needs (shopping list), expenses, payments/settlements, notifications, and realtime updates.

- **Backend**: NestJS 11 + Prisma 6 + PostgreSQL + JWT (httpOnly cookies) + Socket.IO
- **Frontend**: React 19 + Vite 7 + TanStack Query 5 + Zustand + React Router 7 + TailwindCSS + shadcn/ui + Socket.IO Client

## Monorepo Structure

```
Homebase/
├── backend/          # NestJS API
│   ├── src/          # Application code
│   ├── prisma/       # Schema & migrations
│   ├── scripts/      # Utility scripts (JWT generation)
│   ├── .env.example  # Environment template
│   └── package.json
├── frontend/         # React SPA
│   ├── src/          # Application code
│   ├── .env.example  # Environment template
│   └── package.json
└── render.yaml       # Render.com deployment blueprint
```

## Prerequisites

- **Node.js** 20+ (check with `node --version`)
- **npm** 10+ (check with `npm --version`)
- **PostgreSQL** 14+ (local installation or Docker)
- **Git**

## Quick Start (Local Development)

### 1. Clone & Navigate

```bash
git clone <your-repo-url>
cd Homebase
```

### 2. Database Setup

Option A - Using local PostgreSQL:
```bash
# Create database
createdb homebasedb
```

Option B - Using Docker:
```bash
docker run -d \
  --name homebase-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=homebasedb \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET

# Generate JWT secret (optional - for random secret)
node scripts/jwt-secret.js

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# (Optional) Seed the database with sample data
npx prisma db seed

# Start development server
npm run start:dev
```

Backend runs at `http://localhost:3000` (or your configured PORT)

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if your backend runs on a different port

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`

### 5. Verify Setup

- Open `http://localhost:5173` in your browser
- Register a new account or login with seeded users:
  - Email: `alice@example.com` | Password: `password123`
  - Email: `bob@example.com` | Password: `password123`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Min 32 chars. Generate with `node scripts/jwt-secret.js` |
| `JWT_EXPIRATION` | No | 604800 | JWT expiry in seconds (7 days) |
| `PORT` | No | 3000 | API server port |
| `NODE_ENV` | No | development | `production` enables secure cookies |
| `FRONTEND_URL` | No | http://localhost:5173 | CORS allowed origin |
| `THROTTLE_TTL_SHORT` | No | 60000 | Rate limit window (ms) for auth endpoints |
| `THROTTLE_LIMIT_SHORT` | No | 10 | Requests per window for auth |
| `THROTTLE_TTL_MEDIUM` | No | 900000 | Rate limit window (ms) for general API |
| `THROTTLE_LIMIT_MEDIUM` | No | 100 | Requests per window for API |
| `THROTTLE_TTL_LONG` | No | 3600000 | Global rate limit window (ms) |
| `THROTTLE_LIMIT_LONG` | No | 300 | Global requests per hour |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | http://localhost:3000 | Backend API base URL |

## Available Scripts

### Backend

```bash
npm run start:dev      # Development with hot reload
npm run build          # Production build
npm run start:prod     # Run production build
npm run test           # Run tests
npm run test:watch     # Tests in watch mode
npm run lint           # ESLint

# Prisma
npx prisma migrate dev     # Create/run migrations
npx prisma migrate deploy  # Deploy migrations (production)
npx prisma db seed         # Run seed script
npx prisma studio          # Open Prisma Studio GUI
```

### Frontend

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run preview        # Preview production build
npm run test           # Run Vitest tests
npm run test:watch     # Tests in watch mode
npm run lint           # ESLint
```

## Architecture Highlights

- **Authentication**: JWT tokens in httpOnly cookies, extracted from cookies via custom Passport strategy
- **Authorization**: `@UseGuards(JwtGuard)` on protected endpoints
- **Database**: Prisma ORM with PostgreSQL, connection via `DATABASE_URL`
- **Rate Limiting**: Tiered throttling (strict for auth, medium for profile updates, standard for API)
- **Security**: Helmet headers, CORS configured via `FRONTEND_URL`, secure cookies in production
- **Realtime**: Socket.IO with cookie-based auth, targeted query invalidation via React Query
- **State Management**: TanStack Query for server state, Zustand for UI state (sidebar, theme)

## Deployment

### Backend (Render.com)

See `render.yaml` for blueprint deployment:

1. Push to GitHub
2. In Render dashboard: **New +** → **Blueprint**
3. Connect your repository
4. Render auto-creates PostgreSQL database and web service

### Frontend (Vercel)

```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to Vercel with environment variable:
- `VITE_API_URL=https://your-api-domain.com`

## Documentation Roadmap

Our comprehensive documentation covers everything from quick start to deep architectural details:

### Quick Start
- **[SETUP.md](SETUP.md)** - Local development environment setup
- **[Root README](README.md)** - You are here! Project overview

### Architecture & Design
- **[docs/architecture.md](docs/architecture.md)** - System architecture, data flow, ADRs, deployment
- **[docs/contributing.md](docs/contributing.md)** - Contribution guidelines, code standards, workflow

### Backend Documentation
- **[docs/backend/README.md](docs/backend/README.md)** - Complete API reference, endpoints, examples
- **[docs/backend/database.md](docs/backend/database.md)** - Database schema, Prisma models, migrations
- **[docs/backend/websocket.md](docs/backend/websocket.md)** - WebSocket events, Socket.IO implementation
- **[docs/backend/errors.md](docs/backend/errors.md)** - Error codes, handling patterns, troubleshooting
- **[docs/backend/testing.md](docs/backend/testing.md)** - Backend testing guide with Jest

### Frontend Documentation
- **[docs/frontend/README.md](docs/frontend/README.md)** - Frontend architecture, routing, state management
- **[docs/frontend/api-patterns.md](docs/frontend/api-patterns.md)** - API integration patterns with React Query
- **[docs/frontend/testing.md](docs/frontend/testing.md)** - Component testing with Vitest and RTL
- **[docs/frontend/components.md](docs/frontend/components.md)** - Component design system, shadcn/ui usage
- **[docs/frontend/performance.md](docs/frontend/performance.md)** - Performance optimization guide

### Documentation Hub
📚 **Start here**: [docs/README.md](docs/README.md) - Documentation index with quick navigation

## Troubleshooting

**Database connection errors**: Verify `DATABASE_URL` format: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`

**JWT errors**: Ensure `JWT_SECRET` is set and at least 32 characters

**CORS errors**: Check `FRONTEND_URL` matches your actual frontend URL exactly

**Prisma client errors**: Run `npx prisma generate` after schema changes

**Port conflicts**: Change `PORT` in backend `.env` and update frontend `VITE_API_URL` accordingly

## Known Limitations

- **File Uploads**: Not currently supported (planned for future releases)
- **Mobile App**: Web-only, no native iOS/Android apps yet
- **Multi-Household**: Users can only belong to one household at a time
- **Currency**: Currently supports RWF (Rwandan Francs) only
- **Offline Mode**: Requires internet connection for all operations
- **Notifications**: No email/push notifications, only in-app

See [docs/architecture.md](docs/architecture.md#scalability-considerations) for planned improvements.

## Contributing

We welcome contributions! Please read our [Contributing Guide](docs/contributing.md) to get started.

Quick links:
- [Development Setup](SETUP.md)
- [Code Standards](docs/contributing.md#code-standards)
- [Testing Requirements](docs/contributing.md#testing-requirements)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
