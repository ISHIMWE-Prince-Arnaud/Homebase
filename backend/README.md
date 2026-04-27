# Homebase Backend

NestJS API server for the Homebase household management application.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: Set DATABASE_URL and JWT_SECRET (generate with: node scripts/jwt-secret.js)

# 3. Setup database
npx prisma generate
npx prisma migrate dev

# 4. (Optional) Seed with sample data
npx prisma db seed

# 5. Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000` (or your configured PORT).

## Documentation

This README provides a quick overview. For complete documentation, see:

### [📚 Full Backend Documentation](../docs/backend/README.md)

Comprehensive documentation including:
- **API Reference** - Complete endpoint documentation with examples
- **Authentication** - JWT cookie-based auth flow
- **Database Schema** - Entity relationships and Prisma schema
- **WebSocket Events** - Real-time event reference
- **Module Documentation** - Detailed module guides

### Key Docs

| Document | Description |
|----------|-------------|
| [API Reference](../docs/backend/README.md#api-reference) | All endpoints, requests, responses |
| [Architecture Overview](../docs/architecture.md) | System design and data flow |
| [Database Schema](../docs/backend/README.md#database-schema) | Entity relationships |
| [WebSocket Events](../docs/backend/README.md#websocket-events) | Real-time communication |

## Environment Variables

Required variables in `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/homebasedb
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=http://localhost:5173
```

See `.env.example` for all available options.

## Available Scripts

```bash
# Development
npm run start:dev      # Development with hot reload

# Production
npm run build          # Build for production
npm run start:prod     # Start production server

# Database
npx prisma migrate dev     # Create and apply migrations
npx prisma db seed         # Seed database
npx prisma studio          # Open Prisma Studio GUI

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

## Project Structure

```
src/
├── auth/              # Authentication & user management
├── household/         # Household CRUD & membership
├── chore/             # Chore management
├── expense/           # Expense tracking & settlements
├── payment/           # Payment recording
├── need/              # Shopping list (household needs)
├── notification/      # Activity feed & notifications
├── realtime/          # Socket.IO gateway
├── prisma/            # Database service
├── health/            # Health check endpoints
└── common/            # Guards, decorators, utilities
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions on Render.com.

Quick deploy to Render:
1. Push code to GitHub
2. In Render dashboard: **New** → **Blueprint**
3. Connect your repository
4. Render auto-creates PostgreSQL database and web service

---

**[📖 View Full Documentation](../docs/backend/README.md)**
