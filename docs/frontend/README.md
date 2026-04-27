# Frontend Documentation

Complete documentation for the Homebase React frontend application.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Routing](#routing)
- [State Management](#state-management)
- [Features](#features)
- [API Integration](#api-integration)
- [Real-time Updates](#real-time-updates)
- [Component Library](#component-library)
- [Authentication Flow](#authentication-flow)
- [Development Guide](#development-guide)

---

## Overview

The Homebase frontend is a React SPA built with Vite, using modern patterns for state management, data fetching, and UI components.

### Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.x |
| Build Tool | Vite | 7.x |
| Language | TypeScript | 5.x |
| Styling | TailwindCSS | 4.x |
| UI Components | shadcn/ui | latest |
| Server State | TanStack Query | 5.x |
| Client State | Zustand | 4.x |
| Routing | React Router | 7.x |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Icons | Lucide React | latest |
| Real-time | Socket.IO Client | 4.x |

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Project Structure

```
frontend/src/
├── api/                  # API client and hooks
│   ├── client.ts         # Axios instance
│   ├── auth.ts           # Auth API hooks
│   ├── chores.ts         # Chore API hooks
│   ├── expenses.ts       # Expense API hooks
│   ├── needs.ts          # Need API hooks
│   ├── payments.ts       # Payment API hooks
│   └── notifications.ts  # Notification API hooks
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── MobileSheet.tsx
│   │   └── ProtectedRoute.tsx
│   └── forms/            # Form components
├── features/             # Feature modules
│   ├── auth/             # Authentication feature
│   ├── chores/           # Chores feature
│   ├── expenses/         # Expenses feature
│   ├── household/        # Household feature
│   ├── needs/            # Needs feature
│   ├── notifications/    # Notifications feature
│   ├── payments/         # Payments feature
│   └── realtime/         # WebSocket handling
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useHousehold.ts
│   └── ...
├── layouts/              # Page layouts
│   ├── AppLayout.tsx
│   └── PublicLayout.tsx
├── lib/                  # Utility functions
│   ├── utils.ts
│   └── constants.ts
├── pages/                # Route pages
│   ├── Dashboard.tsx
│   ├── Chores.tsx
│   ├── Expenses.tsx
│   ├── Needs.tsx
│   ├── Payments.tsx
│   ├── Household.tsx
│   ├── Notifications.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── stores/               # Zustand stores
│   └── uiStore.ts
├── App.tsx               # Main app component
└── main.tsx              # Entry point
```

### Feature-Based Organization

Each feature module contains:

```
features/chores/
├── api.ts           # API functions
├── components/      # Feature-specific components
├── hooks.ts         # Feature-specific hooks
├── types.ts         # Feature types
└── utils.ts         # Feature utilities
```

---

## Routing

### Route Structure

```tsx
// App.tsx
<Routes>
  {/* Public Routes */}
  <Route element={<PublicLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Protected Routes */}
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      {/* Requires Household */}
      <Route element={<HouseholdRequiredRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chores" element={<ChoresPage />} />
        <Route path="/needs" element={<NeedsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      
      {/* No Household Required */}
      <Route path="/household" element={<HouseholdPage />} />
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/dashboard" />} />
</Routes>
```

### Route Guards

#### ProtectedRoute

Redirects unauthenticated users to `/login`.

```tsx
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <Outlet />;
}
```

#### HouseholdRequiredRoute

Redirects users without a household to `/household` to create/join.

```tsx
function HouseholdRequiredRoute() {
  const { user } = useAuth();
  
  if (!user?.householdId) return <Navigate to="/household" />;
  
  return <Outlet />;
}
```

---

## State Management

### TanStack Query (Server State)

Used for all server data with automatic caching, refetching, and updates.

#### Query Keys Pattern

```ts
// Query key factories
export const choreKeys = {
  all: ['chores'] as const,
  list: () => [...choreKeys.all, 'list'] as const,
  detail: (id: number) => [...choreKeys.all, 'detail', id] as const,
};

export const expenseKeys = {
  all: ['expenses'] as const,
  list: () => [...expenseKeys.all, 'list'] as const,
  balance: () => [...expenseKeys.all, 'balance'] as const,
  settlements: () => [...expenseKeys.all, 'settlements'] as const,
};
```

#### Query Hook Example

```ts
// features/chores/hooks.ts
export function useChores() {
  return useQuery({
    queryKey: choreKeys.list(),
    queryFn: fetchChores,
  });
}

export function useCreateChore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createChore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: choreKeys.list() });
    },
  });
}
```

### Zustand (Client State)

Used for UI state that doesn't need server synchronization.

```ts
// stores/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

---

## Features

### Authentication Feature

**Location**: `features/auth/`

**Responsibilities**:
- User registration and login
- JWT cookie handling
- Auth state management
- Logout functionality

**Key Hooks**:
- `useAuth()` - Current user and auth status
- `useLogin()` - Login mutation
- `useRegister()` - Register mutation
- `useLogout()` - Logout mutation

### Chores Feature

**Location**: `features/chores/`

**Responsibilities**:
- Display chore list with filtering
- Create, update, delete chores
- Mark chores complete
- Assign chores to users

**Key Hooks**:
- `useChores()` - List all chores
- `useCreateChore()` - Create new chore
- `useUpdateChore()` - Update chore
- `useCompleteChore()` - Mark complete
- `useDeleteChore()` - Delete chore

**UI States**:
- Overdue chores (red highlight)
- Due soon (yellow highlight)
- Completed (strikethrough)
- Unassigned (show "Claim" button)

### Expenses Feature

**Location**: `features/expenses/`

**Responsibilities**:
- Display expense list
- Create expenses with splits
- View balance sheet
- Show settlements

**Key Hooks**:
- `useExpenses()` - List expenses
- `useCreateExpense()` - Create expense
- `useBalance()` - Get balance sheet
- `useSettlements()` - Get optimal settlements

**Special Features**:
- Multi-select participants
- Unequal split support
- Auto-calculated shares

### Household Feature

**Location**: `features/household/`

**Responsibilities**:
- Create new household
- Join via invite code
- Leave household
- View household members
- Copy invite code

**Key Hooks**:
- `useHousehold()` - Get current household
- `useCreateHousehold()` - Create household
- `useJoinHousehold()` - Join via code
- `useLeaveHousehold()` - Leave household

### Needs Feature

**Location**: `features/needs/`

**Responsibilities**:
- Shopping list display
- Add items with category
- Mark items purchased
- Category filtering

**Key Hooks**:
- `useNeeds()` - List needs
- `useCreateNeed()` - Add item
- `usePurchaseNeed()` - Mark purchased
- `useDeleteNeed()` - Delete item

### Payments Feature

**Location**: `features/payments/`

**Responsibilities**:
- Display payment history
- Record new payments
- Show settlement suggestions
- Update balances on payment

**Key Hooks**:
- `usePayments()` - List payments
- `useCreatePayment()` - Record payment

### Notifications Feature

**Location**: `features/notifications/`

**Responsibilities**:
- Display notification feed
- Mark as read (single/all)
- Delete notifications
- Show unread badge

**Key Hooks**:
- `useNotifications()` - List notifications
- `useMarkRead()` - Mark single as read
- `useMarkAllRead()` - Mark all as read
- `useDeleteNotification()` - Delete notification

---

## API Integration

### Axios Client Setup

```ts
// api/client.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Essential for httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Hook Pattern

```ts
// Example: chores api
export async function fetchChores(): Promise<Chore[]> {
  const { data } = await api.get('/chores');
  return data;
}

export async function createChore(dto: CreateChoreDto): Promise<Chore> {
  const { data } = await api.post('/chores', dto);
  return data;
}

export async function updateChore(
  id: number, 
  dto: UpdateChoreDto
): Promise<Chore> {
  const { data } = await api.patch(`/chores/${id}`, dto);
  return data;
}

export async function completeChore(id: number): Promise<void> {
  await api.patch(`/chores/${id}/complete`);
}

export async function deleteChore(id: number): Promise<void> {
  await api.delete(`/chores/${id}`);
}
```

### React Query Integration

```ts
export function useChores() {
  return useQuery({
    queryKey: ['chores'],
    queryFn: fetchChores,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateChore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createChore,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      // Also invalidate related data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast.error('Failed to create chore');
    },
  });
}
```

---

## Real-time Updates

### WebSocket Architecture

Socket.IO client connects on app load for authenticated users.

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React Client  │◄────────────────────►│  NestJS Server  │
│                 │   Socket.IO         │                 │
│  - Join room    │                     │  - Broadcast    │
│  - Listen       │                     │  - Emit events  │
│  - Invalidate   │                     │                 │
└─────────────────┘                     └─────────────────┘
```

### Event-to-Query Mapping

```ts
// features/realtime/events.ts
export const eventQueryMap: Record<string, string[]> = {
  'chores:created': ['chores'],
  'chores:updated': ['chores'],
  'chores:completed': ['chores'],
  'chores:deleted': ['chores'],
  'expenses:created': ['expenses', 'balance', 'settlements'],
  'expenses:updated': ['expenses', 'balance'],
  'expenses:deleted': ['expenses', 'balance'],
  'expenses:balanceUpdated': ['balance', 'settlements'],
  'payments:recorded': ['payments', 'balance', 'settlements'],
  'needs:itemAdded': ['needs'],
  'needs:itemUpdated': ['needs'],
  'needs:itemPurchased': ['needs'],
  'notifications:new': ['notifications'],
};
```

### RealtimeProvider

```tsx
// features/realtime/RealtimeProvider.tsx
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.householdId) return;
    
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });
    
    // Join household room
    socket.emit('join-household', user.householdId);
    
    // Listen for events and invalidate queries
    Object.entries(eventQueryMap).forEach(([event, queryKeys]) => {
      socket.on(event, () => {
        queryKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user?.householdId, queryClient]);
  
  return <>{children}</>;
}
```

---

## Component Library

### shadcn/ui Components

Installed components (from `components/ui/`):

| Component | Usage |
|-----------|-------|
| Button | Actions, form submission |
| Card | Content containers |
| Dialog | Modals, confirmations |
| Form | Form layouts |
| Input | Text inputs |
| Label | Form labels |
| Select | Dropdowns |
| Sheet | Mobile slide-out |
| Table | Data display |
| Tabs | Content switching |
| Toast | Notifications |
| Badge | Status indicators |
| Avatar | User profile images |
| Checkbox | Multi-select |
| Calendar | Date picking |
| Popover | Floating content |
| Skeleton | Loading states |
| Tooltip | Help text |

### Custom Components

#### Layout Components

**Sidebar** (`components/layout/Sidebar.tsx`):
- Responsive navigation
- Collapsible on mobile
- Active route highlighting
- Household name display

**Topbar** (`components/layout/Topbar.tsx`):
- Mobile menu toggle
- Notification badge
- User menu
- Page title

**ProtectedRoute** (`components/layout/ProtectedRoute.tsx`):
- Auth check wrapper
- Loading state handling
- Redirect on unauthenticated

#### Feature Components

**ChoreCard** (`features/chores/components/ChoreCard.tsx`):
- Displays chore details
- Complete checkbox
- Assignee avatar
- Due date with color coding

**ExpenseCard** (`features/expenses/components/ExpenseCard.tsx`):
- Shows expense amount
- Lists participants & shares
- Paid by indicator
- Date display

---

## Authentication Flow

### Login Flow

```
1. User enters credentials
   ↓
2. POST /auth/login sent via api client
   ↓
3. Server validates, sets httpOnly cookie
   ↓
4. React Query stores user data
   ↓
5. Redirect to /dashboard
   ↓
6. RealtimeProvider connects WebSocket
```

### Auth State Management

```ts
// features/auth/hooks.ts
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchProfile,
    retry: false,
  });
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
```

### Protected Data Fetching

All API hooks automatically include credentials via the axios client. The backend extracts the JWT from the httpOnly cookie.

---

## Development Guide

### Running Locally

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env to point to your backend

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3000` | Backend API URL |

### Available Scripts

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run Vitest tests
npm run test:watch   # Tests in watch mode
npm run lint         # ESLint check
```

### Code Conventions

1. **Imports**: Use `@/` path alias for src imports
2. **Components**: PascalCase, single responsibility
3. **Hooks**: camelCase, start with `use`
4. **Types**: Interfaces for props, types for unions
5. **Queries**: Use query key factories
6. **Mutations**: Always invalidate related queries

### Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Test example:
```ts
import { render, screen } from '@testing-library/react';
import { ChoresPage } from './ChoresPage';

describe('ChoresPage', () => {
  it('displays chores list', async () => {
    render(<ChoresPage />);
    expect(await screen.findByText('Chores')).toBeInTheDocument();
  });
});
```

### Build & Deploy

```bash
# Create production build
npm run build

# Output in dist/ folder
# Deploy dist/ to Vercel/Netlify
```

---

## Further Reading

- [API Integration Patterns](./api-patterns.md)
- [Component Design System](./components.md)
- [Testing Guide](./testing.md)
- [Performance Optimization](./performance.md)
