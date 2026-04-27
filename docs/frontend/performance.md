# Performance Optimization Guide

Comprehensive guide to optimizing the Homebase frontend application.

## Bundle Optimization

### Code Splitting

Route-based code splitting is configured in the router:

```typescript
// App.tsx with lazy loading
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const ChoresPage = lazy(() => import('./pages/Chores'));
const ExpensesPage = lazy(() => import('./pages/Expenses'));
const NeedsPage = lazy(() => import('./pages/Needs'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chores" element={<ChoresPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/needs" element={<NeedsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Lazy Loading Features

For feature-heavy components:

```typescript
// features/expenses/components/ExpenseChart.tsx (heavy charting library)
import { lazy } from 'react';

const ExpenseChart = lazy(() => import('./ExpenseChart'));

function ExpensePage() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>
      
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <ExpenseChart data={expenses} />
        </Suspense>
      )}
    </div>
  );
}
```

### Tree Shaking

Ensure proper tree shaking by:

1. **Named exports over default exports:**
```typescript
// Good - tree-shakeable
export { Button, Card, Dialog } from '@/components/ui';

// Less optimal
export default { Button, Card, Dialog };
```

2. **Side-effect free imports:**
```typescript
// package.json
{
  "sideEffects": [
    "*.css",
    "*.scss"
  ]
}
```

### Bundle Analysis

```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-analyzer dist

# Or use rollup-plugin-visualizer
# Already configured in vite.config.ts
```

## Data Fetching Optimization

### React Query Caching Strategy

Configure appropriate stale times per data type:

```typescript
// features/chores/hooks.ts
export function useChores() {
  return useQuery({
    queryKey: ['chores'],
    queryFn: fetchChores,
    staleTime: 1000 * 60 * 2, // 2 minutes - chores change moderately
  });
}

// features/household/hooks.ts
export function useHousehold() {
  return useQuery({
    queryKey: ['household'],
    queryFn: fetchHousehold,
    staleTime: 1000 * 60 * 5, // 5 minutes - rarely changes
  });
}

// features/notifications/hooks.ts
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 1000 * 30, // 30 seconds - update frequently
    refetchInterval: 1000 * 60, // Poll every minute as backup
  });
}
```

### Prefetching

Prefetch data likely to be needed:

```typescript
// components/layout/Sidebar.tsx
import { useQueryClient } from '@tanstack/react-query';

function NavLink({ to, label, prefetch }) {
  const queryClient = useQueryClient();
  
  const handleMouseEnter = () => {
    if (prefetch) {
      queryClient.prefetchQuery({
        queryKey: [prefetch],
        queryFn: getPrefetchFn(prefetch),
        staleTime: 1000 * 60 * 5,
      });
    }
  };
  
  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {label}
    </Link>
  );
}

// Usage
<NavLink to="/expenses" label="Expenses" prefetch="expenses" />
```

### Pagination vs Infinite Scroll

For large lists, use cursor-based pagination:

```typescript
// features/chores/hooks.ts
export function useChoresPaginated({ cursor, limit = 20 }) {
  return useQuery({
    queryKey: ['chores', 'paginated', cursor],
    queryFn: async () => {
      const { data } = await api.get('/chores', {
        params: { cursor, limit },
      });
      return data;
    },
  });
}

// features/chores/components/ChoreList.tsx
function ChoreList() {
  const [chores, setChores] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['chores'],
    queryFn: fetchChores,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

## Rendering Optimization

### Memo Usage

Use memo for expensive computations and stable references:

```typescript
import { useMemo, memo } from 'react';

// Memoize expensive calculations
function ExpenseBreakdown({ expenses }) {
  const breakdown = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
  }, [expenses]);
  
  return <Chart data={breakdown} />;
}

// Memoize component to prevent unnecessary re-renders
const ChoreCard = memo(function ChoreCard({ chore, onComplete }) {
  return (
    <div>
      <h3>{chore.title}</h3>
      <button onClick={() => onComplete(chore.id)}>Complete</button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.chore.id === nextProps.chore.id &&
         prevProps.chore.isComplete === nextProps.chore.isComplete;
});
```

### Callback Optimization

Use `useCallback` for stable function references:

```typescript
import { useCallback } from 'react';

function ChoreList({ chores }) {
  const queryClient = useQueryClient();
  
  // Stable callback reference
  const handleComplete = useCallback(async (id: number) => {
    await api.patch(`/chores/${id}/complete`);
    queryClient.invalidateQueries({ queryKey: ['chores'] });
  }, [queryClient]);
  
  return (
    <div>
      {chores.map(chore => (
        <ChoreCard
          key={chore.id}
          chore={chore}
          onComplete={handleComplete} // Same reference across renders
        />
      ))}
    </div>
  );
}
```

### Virtualization (for very long lists)

For lists with 100+ items:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualChoreList({ chores }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: chores.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ChoreCard chore={chores[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Animation Performance

### Framer Motion Best Practices

```typescript
import { motion } from 'framer-motion';

// Use transform and opacity for smooth animations
const slideIn = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

// Animate only transform properties
function SlidePanel({ isOpen }) {
  return (
    <motion.div
      initial="hidden"
      animate={isOpen ? 'visible' : 'hidden'}
      variants={slideIn}
      transition={{ duration: 0.2 }}
      style={{ willChange: 'transform, opacity' }} // Hint for browser
    >
      Content
    </motion.div>
  );
}

// Use layout animations sparingly
function ExpandingCard({ isExpanded }) {
  return (
    <motion.div
      layout // Expensive - use only when necessary
      transition={{ duration: 0.3 }}
    >
      {isExpanded ? <FullContent /> : <Summary />}
    </motion.div>
  );
}
```

### Reduced Motion Support

```typescript
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

## Socket.IO Optimization

### Connection Management

```typescript
// features/realtime/RealtimeProvider.tsx
import { useEffect } from 'react';
import { io } from 'socket.io-client';

function RealtimeProvider({ children }) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.householdId) return;
    
    const socket = io(API_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    socket.emit('join-household', user.householdId);
    
    // Batch query invalidations
    const debouncedInvalidate = debounce((keys) => {
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }, 100);
    
    return () => {
      socket.disconnect();
    };
  }, [user?.householdId]);
}
```

### Event Batching

Group rapid events to prevent excessive re-renders:

```typescript
// Batch multiple chore updates
const pendingInvalidations = new Set<string>();

function queueInvalidation(key: string) {
  pendingInvalidations.add(key);
  
  // Flush after 100ms
  setTimeout(() => {
    if (pendingInvalidations.has(key)) {
      queryClient.invalidateQueries({ queryKey: [key] });
      pendingInvalidations.delete(key);
    }
  }, 100);
}
```

## Image Optimization

### Lazy Loading Images

```typescript
function UserAvatar({ user }) {
  return (
    <img
      src={user.avatarUrl}
      alt={user.name}
      loading="lazy" // Native lazy loading
      width={40}
      height={40}
    />
  );
}
```

### Responsive Images

```typescript
function HouseholdImage({ household }) {
  return (
    <picture>
      <source
        srcSet={`${household.imageLarge} 1024w, ${household.imageMedium} 512w`}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <img
        src={household.imageSmall}
        alt={household.name}
        loading="lazy"
      />
    </picture>
  );
}
```

## Build Output Analysis

### Vite Bundle Analysis

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true, // Open browser after build
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'date-vendor': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // KB
  },
});
```

## Performance Monitoring

### Web Vitals

```typescript
// main.tsx
import { reportWebVitals } from '@/lib/vitals';

reportWebVitals((metric) => {
  // Send to analytics
  console.log(metric);
  // analytics.track(metric.name, metric.value);
});

// lib/vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}
```

### Custom Performance Marks

```typescript
// features/chores/components/ChoreList.tsx
import { useEffect } from 'react';

function ChoreList() {
  useEffect(() => {
    performance.mark('chore-list-start');
  }, []);
  
  const { data: chores, isLoading } = useChores();
  
  useEffect(() => {
    if (!isLoading && chores) {
      performance.mark('chore-list-end');
      performance.measure(
        'chore-list-render',
        'chore-list-start',
        'chore-list-end'
      );
      
      const measure = performance.getEntriesByName('chore-list-render')[0];
      console.log(`Chore list rendered in ${measure.duration}ms`);
    }
  }, [isLoading, chores]);
}
```

## Performance Checklist

Before releasing features:

- [ ] **Bundle Size**: No chunks > 500KB
- [ ] **Code Splitting**: Routes use lazy loading
- [ ] **Images**: Optimized, lazy loaded, proper sizing
- [ ] **Memo Usage**: Expensive computations memoized
- [ ] **Callback Stability**: Event handlers use useCallback
- [ ] **Query Caching**: Appropriate staleTime configured
- [ ] **Animations**: Use transform/opacity, respect reducedMotion
- [ ] **Web Vitals**: CLS < 0.1, LCP < 2.5s, FID < 100ms
- [ ] **Socket Events**: Batched/debounced appropriately
- [ ] **Accessibility**: Works without JavaScript (where possible)

## Performance Budgets

Suggested budgets for Homebase:

| Metric | Budget | Rationale |
|--------|--------|-----------|
| First Load JS | < 200KB | Quick initial render |
| Route JS | < 100KB each | Fast navigation |
| Image Size | < 100KB each | Fast visual completion |
| LCP | < 2.5s | Good user experience |
| TTI | < 3.8s | Interactive quickly |

## Further Reading

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/reference/react#performance)
- [TanStack Query Performance](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
- [Framer Motion Performance](https://www.framer.com/motion/guide-performance/)
