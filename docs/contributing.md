# Contributing to Homebase

Thank you for your interest in contributing to Homebase! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Review Process](#review-process)

## Getting Started

### Prerequisites

- **Node.js** 20+ (check with `node --version`)
- **npm** 10+ (check with `npm --version`)
- **PostgreSQL** 14+ (local installation)
- **Git**

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
```bash
git clone https://github.com/YOUR_USERNAME/Homebase.git
cd Homebase
```

3. **Install dependencies:**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

4. **Set up environment variables:**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env if backend runs on different port
```

5. **Set up the database:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed  # Optional: adds sample data
```

6. **Start development servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Development Workflow

### Branch Naming

Use the following prefixes for branch names:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/expense-categories` |
| `bugfix/` | Bug fixes | `bugfix/login-redirect` |
| `docs/` | Documentation | `docs/api-examples` |
| `refactor/` | Code refactoring | `refactor/chore-hooks` |
| `hotfix/` | Critical fixes | `hotfix/security-patch` |

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(chores): add recurring chore support

fix(expenses): correct settlement calculation for uneven splits

docs(api): add WebSocket event examples

refactor(auth): extract JWT validation to middleware

test(payments): add integration tests for payment recording
```

### Pull Request Process

1. **Create a branch** from `main`:
```bash
git checkout -b feature/my-feature
```

2. **Make your changes** with clear, focused commits

3. **Run tests and linting:**
```bash
# Backend
cd backend
npm run test
npm run lint

# Frontend
cd ../frontend
npm run test
npm run lint
```

4. **Update documentation** if needed

5. **Push your branch:**
```bash
git push origin feature/my-feature
```

6. **Open a Pull Request** on GitHub with:
   - Clear title following commit convention
   - Description of changes
   - Screenshots (for UI changes)
   - Link to related issue (if applicable)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if UI changes)
Before/After screenshots

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console warnings/errors
```

## Code Standards

### TypeScript

- **Enable strict mode** - No implicit any
- **Define interfaces** for all props, API responses, and database models
- **Use type guards** for runtime type checking
- **Avoid `any`** - Use `unknown` with type guards instead

```typescript
// Good
interface Chore {
  id: number;
  title: string;
  description?: string;
}

function isChore(obj: unknown): obj is Chore {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj
  );
}

// Bad
function processChore(chore: any) {
  return chore.title;
}
```

### Code Organization

**Backend:**
```
src/
├── feature-name/
│   ├── feature.controller.ts    # Route handlers
│   ├── feature.service.ts       # Business logic
│   ├── feature.module.ts        # NestJS module
│   └── dto/
│       ├── create-feature.dto.ts
│       └── update-feature.dto.ts
```

**Frontend:**
```
src/features/feature-name/
├── api.ts              # API functions
├── hooks.ts            # React Query hooks
├── schema.ts           # Zod validation schemas
├── types.ts            # TypeScript interfaces
├── components/
│   ├── Component.tsx
│   └── Component.test.tsx
└── utils.ts            # Feature-specific utilities
```

### Import Organization

Order imports as follows:
1. External dependencies (React, NestJS, etc.)
2. Internal absolute imports (`@/components`, `@/features`)
3. Relative imports (sibling files)
4. Types/interfaces

```typescript
// 1. External
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute
import { Button } from '@/components/ui/button';
import { api } from '@/api/client';

// 3. Relative
import { ChoreCard } from './ChoreCard';
import { useChores } from '../hooks';

// 4. Types
import type { Chore } from '../types';
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `ChoreCard`, `ExpenseForm` |
| Hooks | camelCase, `use` prefix | `useChores`, `useCreateChore` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Functions | camelCase | `fetchChores`, `calculateBalance` |
| Interfaces | PascalCase | `Chore`, `CreateChoreDto` |
| Files (components) | PascalCase | `ChoreCard.tsx` |
| Files (utils) | camelCase | `api.ts`, `utils.ts` |

### Comments

- Use JSDoc for exported functions and components
- Explain "why" not "what" (code shows what)
- Keep comments current (update when code changes)

```typescript
/**
 * Calculates optimal payment settlements using greedy algorithm.
 * Minimizes number of transactions between household members.
 * 
 * @param balances - Net balance for each user
 * @returns Array of suggested payments
 * 
 * @example
 * ```ts
 * const settlements = calculateSettlements({
 *   '1': 100,  // User 1 is owed 100
 *   '2': -50, // User 2 owes 50
 *   '3': -50  // User 3 owes 50
 * });
 * // Returns: [{ from: 2, to: 1, amount: 50 }, { from: 3, to: 1, amount: 50 }]
 * ```
 */
export function calculateSettlements(balances: Record<string, number>): Settlement[] {
  // Implementation
}
```

## Testing Requirements

### Coverage Expectations

| Component Type | Minimum Coverage |
|----------------|-----------------|
| Services (Backend) | 80% |
| Controllers (Backend) | 70% |
| Components (Frontend) | 70% |
| Hooks (Frontend) | 60% |
| Utils | 70% |

### Required Tests

**For every new feature, you must include:**

1. **Unit tests** for:
   - Service methods (backend)
   - Component rendering (frontend)
   - Hook behavior (frontend)
   - Utility functions

2. **Integration tests** for:
   - API endpoints (backend)
   - Component interactions (frontend)
   - Data flow (frontend)

3. **E2E tests** for:
   - Critical user flows
   - Happy paths
   - Common error scenarios

### Testing Checklist

Before submitting PR:
- [ ] All new code has corresponding tests
- [ ] Tests cover edge cases (empty arrays, null values, errors)
- [ ] Tests use factories/mock data, not hardcoded values
- [ ] Async operations properly awaited
- [ ] No test warnings or console errors
- [ ] All existing tests still pass

### Manual Testing Checklist

For UI changes, verify:
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive at 320px, 768px, 1024px, 1920px
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (ARIA labels)
- [ ] Color contrast passes WCAG AA
- [ ] No console errors

## Documentation Requirements

### Code Documentation

Document when you add:
- **New API endpoints** → Update `docs/backend/README.md`
- **New WebSocket events** → Update `docs/backend/websocket.md`
- **New components** → Add JSDoc, update `docs/frontend/components.md` if significant
- **New environment variables** → Update `README.md`
- **New features** → Add to feature list in relevant docs

### README Updates

Update relevant README if you:
- Add new npm scripts
- Change environment variables
- Add new dependencies
- Modify project structure

### ADR (Architecture Decision Record)

For significant architectural decisions:
1. Create ADR in `docs/architecture.md`
2. Follow format of existing ADRs
3. Include context, decision, consequences

## Review Process

### PR Review Criteria

Reviewers check for:
- [ ] Code quality and readability
- [ ] Test coverage and quality
- [ ] Documentation completeness
- [ ] Performance implications
- [ ] Security considerations
- [ ] Accessibility compliance
- [ ] Adherence to style guide

### Review Timeline

- **Initial review**: Within 48 hours
- **Follow-up reviews**: Within 24 hours of updates
- **Approval**: Requires 2 approvals for core changes, 1 for minor changes

### After Approval

1. **Squash and merge** (maintainer will do this)
2. **Delete your branch**
3. **Update related issues** (close if resolved)

## Getting Help

### Resources

- **Documentation**: Read the [docs/](../docs/) folder
- **Architecture**: Check [docs/architecture.md](../docs/architecture.md)
- **Setup**: See [SETUP.md](../SETUP.md)

### Questions?

- Open an issue for:
  - Bug reports
  - Feature requests
  - Documentation gaps
  - Questions about contributing

### Code of Conduct

Be respectful and constructive:
- Welcome newcomers
- Assume good intent
- Provide helpful feedback
- Focus on the code, not the person

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Release Checklist

Maintainers follow this process:
1. Update `CHANGELOG.md`
2. Bump version in `package.json` files
3. Create GitHub release
4. Tag release
5. Deploy to production

## Thank You!

Your contributions help make Homebase better for everyone. We appreciate your time and effort!
