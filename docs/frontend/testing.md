# Frontend Testing Guide

Comprehensive guide for testing the Homebase React frontend application.

## Test Stack Overview

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Test runner | `vite.config.ts` |
| **React Testing Library** | Component testing | `@testing-library/react` |
| **Jest DOM** | Custom matchers | `@testing-library/jest-dom` |
| **MSW** | API mocking | `Mock Service Worker` |
| **jsdom** | DOM environment | Vitest environment |

## Test Configuration

### Vitest Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
```

## Test Organization

```
frontend/src/
├── features/
│   ├── chores/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── components/
│   │   │   ├── ChoreCard.tsx
│   │   │   └── ChoreCard.test.tsx      # Co-located tests
│   │   └── ChoresPage.test.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
├── test/
│   ├── setup.ts                        # Global test setup
│   ├── utils.tsx                       # Test utilities
│   └── mocks/
│       ├── server.ts                   # MSW server
│       ├── handlers.ts                 # API mocks
│       └── data.ts                     # Mock data factories
```

## Component Testing

### Basic Component Test

```typescript
// features/chores/components/ChoreCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ChoreCard } from './ChoreCard';

const mockChore = {
  id: 1,
  title: 'Clean kitchen',
  description: 'Wash dishes',
  isComplete: false,
  dueDate: new Date().toISOString(),
  assignedTo: { id: 1, name: 'Alice' },
};

describe('ChoreCard', () => {
  it('renders chore title', () => {
    render(<ChoreCard chore={mockChore} />);
    expect(screen.getByText('Clean kitchen')).toBeInTheDocument();
  });

  it('renders assignee name', () => {
    render(<ChoreCard chore={mockChore} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows completed status', () => {
    const completedChore = { ...mockChore, isComplete: true };
    render(<ChoreCard chore={completedChore} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('shows overdue styling for past due date', () => {
    const overdueChore = {
      ...mockChore,
      dueDate: '2020-01-01T00:00:00Z', // Past date
    };
    render(<ChoreCard chore={overdueChore} />);
    expect(screen.getByText(/overdue/i)).toHaveClass('text-red-600');
  });
});
```

### Testing User Interactions

```typescript
// features/chores/components/ChoreCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoreCard } from './ChoreCard';

describe('ChoreCard Interactions', () => {
  it('calls onComplete when checkbox clicked', async () => {
    const onComplete = vi.fn();
    render(<ChoreCard chore={mockChore} onComplete={onComplete} />);

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(onComplete).toHaveBeenCalledWith(1);
  });

  it('shows edit form when edit button clicked', async () => {
    render(<ChoreCard chore={mockChore} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('Clean kitchen');
  });

  it('calls onDelete when delete confirmed', async () => {
    const onDelete = vi.fn();
    render(<ChoreCard chore={mockChore} onDelete={onDelete} />);

    // Open delete dialog
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Confirm deletion
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(1);
    });
  });
});
```

### Testing with Providers

```typescript
// test/utils.tsx
import { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

export function render(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = createTestQueryClient();

  window.history.pushState({}, '', route);

  return {
    ...rtlRender(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

// features/household/HouseholdPage.test.tsx
import { render, screen, waitFor } from '@/test/utils';
import { HouseholdPage } from './HouseholdPage';

describe('HouseholdPage', () => {
  it('displays household members', async () => {
    render(<HouseholdPage />);

    await waitFor(() => {
      expect(screen.getByText('Household Members')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
```

## Hook Testing

### Testing Custom Hooks

```typescript
// features/chores/hooks.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChores, useCreateChore } from './hooks';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useChores', () => {
  it('fetches chores list', async () => {
    const { result } = renderHook(() => useChores(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toHaveLength(2);
  });

  it('handles error state', async () => {
    // Override handler for this test
    server.use(
      rest.get('/chores', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useChores(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateChore', () => {
  it('invalidates chores list on success', async () => {
    const { result } = renderHook(() => useCreateChore(), { wrapper });

    result.current.mutate({
      title: 'New Chore',
      description: 'Test description',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

## API Mocking with MSW

### MSW Setup

```typescript
// test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Mock Handlers

```typescript
// test/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Auth
  rest.post('/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
      }),
      ctx.cookie('access_token', 'mock-jwt-token')
    );
  }),

  rest.get('/auth/users/me', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: 1, email: 'test@test.com', name: 'Test User' })
    );
  }),

  // Chores
  rest.get('/chores', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          title: 'Clean kitchen',
          isComplete: false,
          assignedTo: { id: 1, name: 'Alice' },
        },
        {
          id: 2,
          title: 'Take out trash',
          isComplete: true,
          assignedTo: { id: 2, name: 'Bob' },
        },
      ])
    );
  }),

  rest.post('/chores', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        ...body,
        isComplete: false,
        createdAt: new Date().toISOString(),
      })
    );
  }),

  // Household
  rest.get('/households/me', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        name: 'Test Household',
        inviteCode: 'ABC12345',
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      })
    );
  }),

  // Expenses
  rest.get('/expenses', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          description: 'Groceries',
          totalAmount: 150.00,
          paidBy: { id: 1, name: 'Alice' },
          participants: [
            { userId: 1, shareAmount: 75, user: { name: 'Alice' } },
            { userId: 2, shareAmount: 75, user: { name: 'Bob' } },
          ],
        },
      ])
    );
  }),

  // Default handler for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`);
    return res(ctx.status(500), ctx.json({ message: 'Handler not implemented' }));
  }),
];
```

### Mock Data Factories

```typescript
// test/mocks/data.ts
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@test.com',
  name: 'Test User',
  householdId: 1,
  ...overrides,
});

export const createMockHousehold = (overrides = {}) => ({
  id: 1,
  name: 'Test Household',
  inviteCode: 'ABC12345',
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  ...overrides,
});

export const createMockChore = (overrides = {}) => ({
  id: 1,
  title: 'Clean kitchen',
  description: 'Wash dishes',
  isComplete: false,
  dueDate: new Date().toISOString(),
  householdId: 1,
  assignedToId: 1,
  assignedTo: { id: 1, name: 'Alice' },
  ...overrides,
});

export const createMockExpense = (overrides = {}) => ({
  id: 1,
  description: 'Groceries',
  totalAmount: 150,
  date: new Date().toISOString(),
  paidById: 1,
  paidBy: { id: 1, name: 'Alice' },
  householdId: 1,
  participants: [
    { userId: 1, shareAmount: 75, user: { name: 'Alice' } },
    { userId: 2, shareAmount: 75, user: { name: 'Bob' } },
  ],
  ...overrides,
});
```

## Integration Testing

### Page-Level Testing

```typescript
// features/chores/ChoresPage.test.tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import { ChoresPage } from './ChoresPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ChoresPage', () => {
  it('displays loading state initially', () => {
    renderWithProviders(<ChoresPage />);
    expect(screen.getByTestId('chores-loading')).toBeInTheDocument();
  });

  it('displays chores list after loading', async () => {
    renderWithProviders(<ChoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Clean kitchen')).toBeInTheDocument();
    });

    expect(screen.getByText('Take out trash')).toBeInTheDocument();
  });

  it('filters chores by status', async () => {
    renderWithProviders(<ChoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Clean kitchen')).toBeInTheDocument();
    });

    // Click completed filter
    await userEvent.click(screen.getByRole('button', { name: /completed/i }));

    // Should only show completed chore
    expect(screen.queryByText('Clean kitchen')).not.toBeInTheDocument();
    expect(screen.getByText('Take out trash')).toBeInTheDocument();
  });

  it('opens create dialog when add button clicked', async () => {
    renderWithProviders(<ChoresPage />);

    await waitFor(() => {
      expect(screen.getByText('Chores')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /add chore/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });
});
```

### Form Testing

```typescript
// features/auth/components/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('LoginForm', () => {
  it('submits form with correct data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('displays validation errors', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    // Submit empty form
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('displays server error on failed login', async () => {
    server.use(
      rest.post('/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({ message: 'Invalid credentials' })
        );
      })
    );

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

## Accessibility Testing

### A11y Tests

```typescript
// features/chores/components/ChoreCard.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChoreCard } from './ChoreCard';

expect.extend(toHaveNoViolations);

describe('ChoreCard Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ChoreCard chore={mockChore} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has accessible checkbox', () => {
    render(<ChoreCard chore={mockChore} />);
    const checkbox = screen.getByRole('checkbox', { name: /mark clean kitchen complete/i });
    expect(checkbox).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    render(<ChoreCard chore={mockChore} />);
    const card = screen.getByTestId('chore-card');

    // Should be focusable
    card.focus();
    expect(document.activeElement).toBe(card);

    // Enter should trigger action
    await userEvent.keyboard('{enter}');
    // Verify expected behavior
  });
});
```

## Running Tests

```bash
cd frontend

# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- ChoreCard.test.tsx

# Run tests matching pattern
npm run test -- -t "should render"
```

## Coverage Requirements

### Recommended Thresholds

```typescript
// vite.config.ts coverage config
coverage: {
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/main.tsx',
  ],
}
```

### Critical Paths to Cover

| Component | Priority | Test Focus |
|-----------|----------|------------|
| Auth flows | Critical | Login, register, logout, session expiry |
| Expense forms | Critical | Split calculations, validation |
| Payment recording | Critical | Amount validation, settlement updates |
| Household join/leave | High | Invite code, balance checks |
| Real-time updates | Medium | WebSocket event handling |
| UI components | Medium | Rendering, interactions |

## Best Practices

1. **Test behavior, not implementation** - Don't test internal state
2. **Use user-centric queries** - `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock at boundaries** - MSW for API, not implementation details
4. **Keep tests independent** - No shared state between tests
5. **Test error states** - Not just happy paths
6. **Use setup files** - Global mocks and configuration
7. **Write accessible tests** - `screen.getByRole` ensures a11y
8. **Avoid testing React Query** - Test your hooks, not the library
9. **Snapshot sparingly** - Use for complex component trees only
10. **Clean up after tests** - MSW handlers, QueryClient cache

## Common Testing Patterns

### Async Testing

```typescript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText('Loading'));
```

### Testing Modals

```typescript
// Portal-based modals need container query
const modal = within(screen.getByRole('dialog'));
expect(modal.getByText('Confirm Delete')).toBeInTheDocument();
```

### Testing Lists

```typescript
const items = screen.getAllByRole('listitem');
expect(items).toHaveLength(3);
```

## Further Reading

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Accessibility](https://testing-library.com/docs/guide-which-query/)
