# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation suite with 15+ new documentation files
- Architecture Decision Records (ADRs) documenting key design choices
- Database schema reference with full entity documentation
- WebSocket implementation guide with event reference
- API error codes reference with troubleshooting
- Backend testing guide with patterns and examples
- Frontend API integration patterns documentation
- Frontend testing guide with Vitest and React Testing Library
- Component design system documentation
- Performance optimization guide
- Contributing guidelines for open source collaboration
- VS Code configuration files (extensions, launch configs)
- Root-level package.json with monorepo scripts
- MIT License file

### Changed
- Fixed TailwindCSS version consistency across documentation (4.x → 3.x)
- Enhanced architecture.md with notification system data flow diagram

### Documentation
- All broken documentation references now resolved
- Version inconsistencies eliminated across all docs

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of Homebase
- **Authentication System**
  - User registration and login
  - JWT-based authentication with httpOnly cookies
  - Profile management
- **Household Management**
  - Create and join households
  - Invite code generation
  - Member management
  - Leave household with balance validation
- **Chore Tracking**
  - Create, update, delete chores
  - Assign chores to members
  - Mark chores complete
  - Due date tracking with overdue highlighting
- **Expense Management**
  - Create expenses with participant splits
  - Automatic balance calculations
  - Settlement algorithm (greedy pairing)
  - Payment recording with debt validation
- **Shopping List (Needs)**
  - Add items with quantity and category
  - Mark items as purchased
  - Auto-create expenses from purchases
- **Notification System**
  - Activity feed for household events
  - Read/unread tracking
  - WebSocket-powered real-time updates
- **Real-time Features**
  - Socket.IO integration
  - Live updates across all household members
  - Automatic React Query cache invalidation
- **Technical Features**
  - NestJS backend with Prisma ORM
  - React 19 frontend with Vite
  - TailwindCSS with shadcn/ui components
  - TanStack Query for server state
  - Zustand for UI state
  - Rate limiting and security middleware

### Security
- JWT tokens stored in httpOnly cookies (XSS protection)
- Rate limiting on auth and API endpoints
- Input validation with class-validator
- Helmet security headers
- CORS configuration

### Infrastructure
- PostgreSQL database
- Render.com deployment blueprint
- Vercel-ready frontend build
- Health check endpoints

## Migration Guides

### Upgrading to 1.0.0

If you're coming from a pre-release version:

1. **Database Migration**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Environment Variables**
   - Add any new required variables from `.env.example`
   - Update `FRONTEND_URL` to match your deployment

3. **Dependencies**
   ```bash
   npm run install:all
   ```

## Release Notes Template

For future releases, use this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```
