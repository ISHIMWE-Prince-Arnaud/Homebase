# API Integration Patterns

Complete guide to API integration patterns used in the Homebase frontend.

## Axios Client Configuration

### Base Setup

The API client is configured in `frontend/src/api/client.ts`:

```typescript
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Essential for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});
```

### Critical: Cookie Configuration

The `withCredentials: true` setting is **essential** for the httpOnly cookie authentication to work. Without it, the JWT cookie won't be sent with requests.

```typescript
// Server CORS must also allow credentials
// backend/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Required for cookies
});
```

## Error Handling Strategy

### Global Error Interceptor

```typescript
// api/client.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // JWT expired or invalid - redirect to login
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
        break;

      case 403:
        toast.error(data.message || 'Access denied');
        break;

      case 404:
        toast.error('Resource not found');
        break;

      case 422:
        // Business logic error
        toast.error(data.message || 'Request could not be processed');
        break;

      case 429:
        toast.error('Too many requests. Please try again later.');
        break;

      case 500:
        toast.error('Something went wrong. Please try again.');
        break;

      default:
        toast.error(data.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);
```

### Form-Level Error Handling

```typescript
// features/auth/components/RegisterForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegister } from '../hooks';

export function RegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
  });
  const register = useRegister();

  const onSubmit = async (values) => {
    try {
      await register.mutateAsync(values);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.details) {
        // Set field-specific errors from server validation
        error.response.data.details.forEach(({ field, message }) => {
          form.setError(field, { type: 'server', message });
        });
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## React Query Integration

### Query Key Factories

Query keys are organized by feature to enable targeted cache invalidation:

```typescript
// features/chores/api.ts
export const choreKeys = {
  all: ['chores'] as const,
  list: () => [...choreKeys.all, 'list'] as const,
  detail: (id: number) => [...choreKeys.all, 'detail', id] as const,
};

// features/expenses/api.ts
export const expenseKeys = {
  all: ['expenses'] as const,
  list: () => [...expenseKeys.all, 'list'] as const,
  balance: () => [...expenseKeys.all, 'balance'] as const,
  settlements: () => [...expenseKeys.all, 'settlements'] as const,
};

// features/needs/api.ts
export const needKeys = {
  all: ['needs'] as const,
  list: () => [...needKeys.all, 'list'] as const,
};

// features/notifications/api.ts
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
};
```

### Query Hook Pattern

```typescript
// features/chores/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { choreKeys } from './api';
import { api } from '@/api/client';

// List query
export function useChores() {
  return useQuery({
    queryKey: choreKeys.list(),
    queryFn: async () => {
      const { data } = await api.get('/chores');
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

// Detail query
export function useChore(id: number) {
  return useQuery({
    queryKey: choreKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/chores/${id}`);
      return data;
    },
    enabled: !!id, // Only run if id is provided
  });
}

// Create mutation
export function useCreateChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newChore) => {
      const { data } = await api.post('/chores', newChore);
      return data;
    },
    onSuccess: () => {
      // Invalidate chores list to refetch
      queryClient.invalidateQueries({ queryKey: choreKeys.list() });
      toast.success('Chore created');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create chore');
    },
  });
}

// Update mutation
export function useUpdateChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data } = await api.patch(`/chores/${id}`, updates);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: choreKeys.list() });
      queryClient.invalidateQueries({ queryKey: choreKeys.detail(data.id) });
      toast.success('Chore updated');
    },
  });
}

// Delete mutation
export function useDeleteChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/chores/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache immediately
      queryClient.removeQueries({ queryKey: choreKeys.detail(deletedId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: choreKeys.list() });
      toast.success('Chore deleted');
    },
  });
}
```

### Stale Time Configuration

```typescript
// Different stale times for different data types
export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.list(),
    queryFn: fetchExpenses,
    staleTime: 1000 * 60 * 2, // 2 minutes - expenses change less frequently
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: fetchNotifications,
    staleTime: 1000 * 30, // 30 seconds - notifications update frequently
    refetchInterval: 1000 * 30, // Poll every 30 seconds as backup
  });
}
```

## Optimistic Updates

### When to Use

Optimistic updates provide immediate UI feedback before server confirmation:

- Marking chores complete
- Toggling notification read status
- Adding needs to shopping list

### Implementation Pattern

```typescript
// features/chores/hooks.ts
export function useCompleteChore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/chores/${id}/complete`);
      return data;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: choreKeys.list() });

      // Snapshot previous value
      const previousChores = queryClient.getQueryData(choreKeys.list());

      // Optimistically update
      queryClient.setQueryData(choreKeys.list(), (old) =>
        old?.map((chore) =>
          chore.id === id
            ? { ...chore, isComplete: true, completedAt: new Date().toISOString() }
            : chore
        )
      );

      // Return context for rollback
      return { previousChores };
    },
    onError: (err, id, context) => {
      // Rollback on error
      queryClient.setQueryData(choreKeys.list(), context.previousChores);
      toast.error('Failed to update chore');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: choreKeys.list() });
    },
  });
}
```

## Authentication Flow

### Auth State Management

```typescript
// features/auth/hooks.ts
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/auth/users/me');
        return data;
      } catch (error) {
        if (error.response?.status === 401) {
          return null; // Not authenticated
        }
        throw error;
      }
    },
    retry: false, // Don't retry on auth errors
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      // Set user data immediately
      queryClient.setQueryData(['user'], data.user);
      // Invalidate any cached data from previous session
      queryClient.clear();
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      navigate('/login');
    },
  });
}
```

### Protected Data Fetching

All authenticated requests automatically include the JWT cookie. The backend extracts and validates the token.

```typescript
// Protected route component
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

## Prefetching Patterns

### Hover Prefetching

```typescript
// components/ChoreList.tsx
function ChoreItem({ chore }) {
  const queryClient = useQueryClient();

  return (
    <div
      onMouseEnter={() => {
        // Prefetch chore details on hover
        queryClient.prefetchQuery({
          queryKey: choreKeys.detail(chore.id),
          queryFn: () => api.get(`/chores/${chore.id}`).then(r => r.data),
          staleTime: 1000 * 60 * 5,
        });
      }}
    >
      {/* Chore display */}
    </div>
  );
}
```

### Route-Based Prefetching

```typescript
// In route loader or component mount
export function DashboardPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch likely-to-be-used data
    queryClient.prefetchQuery({
      queryKey: choreKeys.list(),
      queryFn: fetchChores,
    });
    queryClient.prefetchQuery({
      queryKey: expenseKeys.list(),
      queryFn: fetchExpenses,
    });
  }, []);

  return <Dashboard />;
}
```

## WebSocket + React Query Integration

WebSocket events automatically invalidate React Query caches. See the RealtimeProvider implementation in `features/realtime/RealtimeProvider.tsx`.

Key pattern:

```typescript
// features/realtime/events.ts
export const eventQueryMap: Record<string, string[]> = {
  'chores:created': ['chores'],
  'chores:updated': ['chores'],
  'chores:completed': ['chores'],
  'expenses:created': ['expenses', 'balance', 'settlements'],
  'payments:recorded': ['payments', 'balance', 'settlements'],
  'needs:itemAdded': ['needs'],
  'notifications:new': ['notifications'],
};

// In RealtimeProvider
Object.entries(eventQueryMap).forEach(([event, queryKeys]) => {
  socket.on(event, () => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  });
});
```

## API Function Organization

### Feature-Based Organization

```
features/
├── chores/
│   ├── api.ts          # API functions
│   ├── hooks.ts        # React Query hooks
│   └── types.ts        # TypeScript types
├── expenses/
│   ├── api.ts
│   ├── hooks.ts
│   └── types.ts
```

### API Functions Pattern

```typescript
// features/chores/api.ts
import { api } from '@/api/client';

export interface Chore {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  isComplete: boolean;
  householdId: number;
  assignedToId?: number;
  assignedTo?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateChoreDto {
  title: string;
  description?: string;
  dueDate?: string;
  assignedToId?: number;
}

// API functions
export async function fetchChores(): Promise<Chore[]> {
  const { data } = await api.get('/chores');
  return data;
}

export async function fetchChore(id: number): Promise<Chore> {
  const { data } = await api.get(`/chores/${id}`);
  return data;
}

export async function createChore(dto: CreateChoreDto): Promise<Chore> {
  const { data } = await api.post('/chores', dto);
  return data;
}

export async function updateChore(
  id: number,
  dto: Partial<CreateChoreDto>
): Promise<Chore> {
  const { data } = await api.patch(`/chores/${id}`, dto);
  return data;
}

export async function completeChore(id: number): Promise<Chore> {
  const { data } = await api.patch(`/chores/${id}/complete`);
  return data;
}

export async function deleteChore(id: number): Promise<void> {
  await api.delete(`/chores/${id}`);
}
```

## Loading States

### Suspense Pattern (Optional)

```typescript
// With React Suspense
const ChoreList = lazy(() => import('./ChoreList'));

function ChoresPage() {
  return (
    <Suspense fallback={<ChoreSkeleton />}>
      <ChoreList />
    </Suspense>
  );
}
```

### Manual Loading State Pattern

```typescript
function ChoresPage() {
  const { data: chores, isLoading, error } = useChores();

  if (isLoading) {
    return <ChoreSkeleton count={5} />;
  }

  if (error) {
    return <ErrorState message="Failed to load chores" />;
  }

  return <ChoreList chores={chores} />;
}
```

## Error Boundary Integration

```typescript
// components/ErrorBoundary.tsx
export class APIErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    if (error.isAxiosError) {
      return { hasError: true };
    }
    throw error; // Re-throw non-API errors
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Best Practices Summary

1. **Always use `withCredentials: true`** for cookie-based auth
2. **Use query key factories** for consistent cache management
3. **Handle 401 errors globally** with redirect to login
4. **Invalidate related queries** after mutations
5. **Use optimistic updates** for high-frequency UI changes
6. **Set appropriate stale times** based on data change frequency
7. **Handle network errors** gracefully
8. **Type API responses** with TypeScript interfaces
9. **Separate API functions from hooks** for reusability
10. **Clear cache on logout** to prevent data leakage between sessions

## Further Reading

- [Axios Documentation](https://axios-http.com/docs/intro)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/error-handling)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
