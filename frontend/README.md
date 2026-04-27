# Homebase Frontend

React SPA for the Homebase household management application.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: Set VITE_API_URL to your backend URL (default: http://localhost:3000)

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Documentation

This README provides a quick overview. For complete documentation, see:

### [📚 Full Frontend Documentation](../docs/frontend/README.md)

Comprehensive documentation including:
- **Project Structure** - Directory organization and conventions
- **Routing** - Route configuration and guards
- **State Management** - TanStack Query and Zustand patterns
- **Features** - All feature modules (auth, chores, expenses, etc.)
- **API Integration** - Axios client and React Query hooks
- **Real-time Updates** - WebSocket integration
- **Component Library** - UI components and design system

### Key Docs

| Document | Description |
|----------|-------------|
| [Project Structure](../docs/frontend/README.md#project-structure) | Directory organization |
| [Routing](../docs/frontend/README.md#routing) | Routes and navigation guards |
| [State Management](../docs/frontend/README.md#state-management) | TanStack Query & Zustand |
| [Features](../docs/frontend/README.md#features) | Feature modules overview |
| [Architecture Overview](../docs/architecture.md) | System design and data flow |

## Environment Variables

Required in `.env`:

```env
VITE_API_URL=http://localhost:3000
```

See `.env.example` for all options.

## Available Scripts

```bash
npm run dev            # Start dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview production build
npm run test           # Run Vitest tests
npm run test:watch     # Tests in watch mode
npm run lint           # ESLint check
```

## Project Structure

```
src/
├── api/               # Axios client & API hooks
├── components/        # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── layout/        # Layout components
├── features/          # Feature modules
│   ├── auth/
│   ├── chores/
│   ├── expenses/
│   ├── household/
│   ├── needs/
│   ├── notifications/
│   ├── payments/
│   └── realtime/
├── hooks/             # Custom React hooks
├── layouts/           # Page layouts
├── lib/               # Utilities
├── pages/             # Route pages
└── stores/            # Zustand stores
```

## Routing

- **Public**: `/login`, `/register`
- **Protected** (requires auth): `/household`, `/dashboard`, `/chores`, `/expenses`, `/needs`, `/payments`, `/notifications`

Guards:
- `ProtectedRoute` — Redirects unauthenticated to `/login`
- `HouseholdRequiredRoute` — Redirects without household to `/household`

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Routing**: React Router 7
- **Server State**: TanStack Query 5
- **Client State**: Zustand
- **Styling**: TailwindCSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **API**: Axios + Socket.IO
- **Testing**: Vitest

## Deployment

Build for production:
```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

---

**[📖 View Full Documentation](../docs/frontend/README.md)**
