# Component Design System

Complete guide to the component architecture and design system used in Homebase.

## shadcn/ui Integration

Homebase uses [shadcn/ui](https://ui.shadcn.com/) for its accessible, customizable component primitives.

### Installation Philosophy

Components are installed directly into the codebase (not as npm dependencies), allowing full customization:

```bash
# Adding a new shadcn component
npx shadcn add button
npx shadcn add dialog
npx shadcn add form
```

### Installed Components

| Component | Location | Usage |
|-----------|----------|-------|
| Button | `components/ui/button.tsx` | Actions, form submission |
| Card | `components/ui/card.tsx` | Content containers |
| Dialog | `components/ui/dialog.tsx` | Modals, confirmations |
| Form | `components/ui/form.tsx` | Form layouts with validation |
| Input | `components/ui/input.tsx` | Text inputs |
| Label | `components/ui/label.tsx` | Form labels |
| Select | `components/ui/select.tsx` | Dropdowns |
| Sheet | `components/ui/sheet.tsx` | Mobile slide-out panels |
| Table | `components/ui/table.tsx` | Data display |
| Tabs | `components/ui/tabs.tsx` | Content switching |
| Toast | `components/ui/sonner.tsx` | Notifications |
| Badge | `components/ui/badge.tsx` | Status indicators |
| Avatar | `components/ui/avatar.tsx` | User profile images |
| Checkbox | `components/ui/checkbox.tsx` | Multi-select, toggles |
| Calendar | `components/ui/calendar.tsx` | Date picking |
| Popover | `components/ui/popover.tsx` | Floating content |
| Skeleton | `components/ui/skeleton.tsx` | Loading states |
| Tooltip | `components/ui/tooltip.tsx` | Help text |
| Separator | `components/ui/separator.tsx` | Visual dividers |
| Dropdown Menu | `components/ui/dropdown-menu.tsx` | User menus |

## Component Organization

```
frontend/src/
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── AppLayout.tsx
│   │   ├── PublicLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── HouseholdRequiredRoute.tsx
│   └── forms/                 # Reusable form components
│       ├── FormField.tsx
│       └── SubmitButton.tsx
└── features/
    ├── chores/
    │   └── components/
    │       ├── ChoreCard.tsx
    │       ├── ChoreList.tsx
    │       └── CreateChoreDialog.tsx
    └── ...
```

## Layout Components

### Sidebar

**Location:** `components/layout/Sidebar.tsx`

**Responsibilities:**
- Responsive navigation
- Collapsible on mobile (Sheet component)
- Active route highlighting
- Household name display
- User profile section

**Props Interface:**
```typescript
interface SidebarProps {
  className?: string;
}

// Uses Zustand for state
const { sidebarOpen, toggleSidebar } = useUIStore();
```

**Key Features:**
- Desktop: Fixed sidebar with navigation links
- Mobile: Sheet slide-out from left
- Highlights active route based on `useLocation()`
- Displays household name and member count

### Topbar

**Location:** `components/layout/Topbar.tsx`

**Responsibilities:**
- Mobile menu toggle
- Notification badge with unread count
- User avatar dropdown
- Page title (contextual)

**Composition:**
```tsx
<Topbar>
  <MobileMenuToggle />
  <PageTitle />
  <NotificationBell />
  <UserMenu />
</Topbar>
```

### Route Guards

**ProtectedRoute** (`components/layout/ProtectedRoute.tsx`):
```typescript
// Redirects unauthenticated users to /login
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return <Outlet />;
}
```

**HouseholdRequiredRoute** (`components/layout/HouseholdRequiredRoute.tsx`):
```typescript
// Redirects users without household to /household
function HouseholdRequiredRoute() {
  const { user } = useAuth();
  
  if (!user?.householdId) return <Navigate to="/household" />;
  
  return <Outlet />;
}
```

## Feature Components

### ChoreCard

**Location:** `features/chores/components/ChoreCard.tsx`

**States:**
- **Overdue**: Red border/background, warning icon
- **Due Soon** (within 24h): Yellow highlight
- **Completed**: Strikethrough text, checked checkbox
- **Unassigned**: "Claim" button visible

**Props:**
```typescript
interface ChoreCardProps {
  chore: Chore;
  onComplete?: (id: number) => void;
  onEdit?: (chore: Chore) => void;
  onDelete?: (id: number) => void;
}
```

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ [Checkbox] Title              [Menu]│
│ Description (truncated)             │
│ 📅 Due: Tomorrow  👤 Assigned: Alice │
└─────────────────────────────────────┘
```

### ExpenseCard

**Location:** `features/expenses/components/ExpenseCard.tsx`

**Displays:**
- Amount with currency (RWF)
- Description
- Paid by indicator (avatar + name)
- Participants with their shares
- Date

**Props:**
```typescript
interface ExpenseCardProps {
  expense: Expense;
  currentUserId: number;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: number) => void;
}
```

### NeedItem

**Location:** `features/needs/components/NeedItem.tsx`

**States:**
- **Active**: Checkbox unchecked, category badge
- **Purchased**: Strikethrough, grey background, purchaser name

**Props:**
```typescript
interface NeedItemProps {
  need: HouseholdNeed;
  onTogglePurchased?: (id: number, isPurchased: boolean) => void;
  onDelete?: (id: number) => void;
}
```

## Custom Component Patterns

### Compound Components

Used for complex UI with shared state:

```typescript
// features/expenses/components/ExpenseForm/
├── ExpenseForm.tsx
├── ExpenseFormParticipant.tsx
├── ExpenseFormSplit.tsx
└── index.ts

// Usage
<ExpenseForm>
  <ExpenseForm.Description />
  <ExpenseForm.Amount />
  <ExpenseForm.Participants>
    <ExpenseForm.Participant userId={1} />
  </ExpenseForm.Participants>
</ExpenseForm>
```

### Render Props Pattern

For flexible data display:

```typescript
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

function DataList<T>({ data, renderItem, emptyMessage }: DataListProps<T>) {
  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }
  return <div className="space-y-2">{data.map(renderItem)}</div>;
}

// Usage
<DataList
  data={chores}
  renderItem={(chore) => <ChoreCard key={chore.id} chore={chore} />}
  emptyMessage="No chores yet"
/>
```

### Controlled Components

All form components are controlled:

```typescript
// components/forms/FormField.tsx
interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
}

// Usage with react-hook-form
<FormField
  name="email"
  label="Email Address"
  type="email"
  required
/>
```

## Styling Conventions

### Tailwind Class Ordering

Follow consistent ordering for readability:

```tsx
// 1. Layout (display, position, etc.)
// 2. Spacing (margin, padding)
// 3. Size (width, height)
// 4. Typography (font, text)
// 5. Visual (colors, borders)
// 6. Interactive (hover, focus)
// 7. Transitions

<button
  className="
    flex items-center justify-center
    px-4 py-2
    h-10
    text-sm font-medium
    bg-primary text-primary-foreground
    rounded-md
    hover:bg-primary/90
    focus:outline-none focus:ring-2 focus:ring-primary
    transition-colors
  "
>
```

### cn() Utility

Use the `cn()` utility for conditional classes:

```typescript
import { cn } from '@/lib/utils';

function Button({ variant, size, className }) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md',
        
        // Variant styles
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        
        // Size styles
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        
        // Additional classes
        className
      )}
    />
  );
}
```

### Dark Mode Support

All components support dark mode via Tailwind dark variant:

```tsx
<div className="
  bg-white dark:bg-slate-950
  text-slate-900 dark:text-slate-50
  border-slate-200 dark:border-slate-800
">
```

Theme switching is handled by `ThemeProvider` in `components/layout/ThemeProvider.tsx`.

## Accessibility Requirements

### ARIA Labels

All interactive elements must have accessible names:

```tsx
// Good
<button aria-label="Delete chore">
  <TrashIcon />
</button>

// Good
<button aria-label={`Mark ${chore.title} as complete`}>
  <Checkbox checked={chore.isComplete} />
</button>

// Good - uses visible text
<button>
  <TrashIcon />
  <span>Delete</span>
</button>
```

### Keyboard Navigation

All interactive components must be keyboard accessible:

```tsx
// Ensure focus visibility
<button className="focus:outline-none focus:ring-2 focus:ring-primary">

// Handle keyboard events
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

### Focus Management

For modals and dialogs:

```tsx
// Focus trap within dialog
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Dialog({ isOpen, onClose, children }) {
  const ref = useFocusTrap(isOpen);
  
  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element
      const firstFocusable = ref.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);
  
  return (
    <div ref={ref} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

### Screen Reader Support

```tsx
// Status announcements
import { announce } from '@/lib/a11y';

function ChoreList() {
  const { data: chores } = useChores();
  
  useEffect(() => {
    if (chores) {
      announce(`${chores.length} chores loaded`);
    }
  }, [chores]);
}

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notificationCount > 0 && `${notificationCount} new notifications`}
</div>
```

## Component Documentation Template

Document complex components with JSDoc:

```typescript
/**
 * Displays a household chore with completion status and assignment.
 *
 * @example
 * ```tsx
 * <ChoreCard
 *   chore={{
 *     id: 1,
 *     title: 'Clean kitchen',
 *     isComplete: false,
 *     assignedTo: { id: 1, name: 'Alice' }
 *   }}
 *   onComplete={(id) => completeChore(id)}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.chore - Chore data to display
 * @param props.onComplete - Callback when chore is marked complete
 * @param props.onEdit - Callback when edit action triggered
 * @param props.onDelete - Callback when delete action triggered
 *
 * @returns React component
 */
export function ChoreCard({ chore, onComplete, onEdit, onDelete }: ChoreCardProps) {
  // Implementation
}
```

## Testing Components

See [Testing Guide](./testing.md) for detailed testing patterns.

Quick checklist:
- [ ] Render with all prop variations
- [ ] Test user interactions (click, type, submit)
- [ ] Test loading states
- [ ] Test error states
- [ ] Verify accessibility (axe, keyboard nav)
- [ ] Test responsive behavior

## Further Reading

- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/) (underlying shadcn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
