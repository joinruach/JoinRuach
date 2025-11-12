# 📚 Ruach Ministries Developer Guide

**Version:** 1.0
**Last Updated:** 2025-11-12
**Maintained By:** Development Team

---

## 🎯 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflow](#development-workflow)
4. [Component Library](#component-library)
5. [API Reference](#api-reference)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

---

## 🚀 Getting Started

### Prerequisites

**Required:**
- Node.js ≥ 18.18.0
- pnpm ≥ 8.0.0
- Docker & Docker Compose
- Git

**Recommended:**
- VS Code with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/joinruach/JoinRuach.git
cd JoinRuach

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/ruach-next/.env.example apps/ruach-next/.env.local
cp ruach-ministries-backend/.env.example ruach-ministries-backend/.env

# Start development environment
docker-compose up -d

# Run database migrations (Strapi)
cd ruach-ministries-backend
pnpm strapi migrations:run

# Start development servers
pnpm dev
```

### Environment Variables

**Frontend (apps/ruach-next/.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:1337
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
OPENAI_API_KEY=sk-...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

**Backend (ruach-ministries-backend/.env):**
```env
DATABASE_URL=postgres://user:pass@localhost:5432/ruach
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
ADMIN_JWT_SECRET=your-admin-jwt-secret
API_TOKEN_SALT=your-salt
TRANSFER_TOKEN_SALT=your-transfer-salt
```

### Verify Installation

```bash
# Type check all code
pnpm typecheck

# Run linter
pnpm lint

# Run tests
pnpm test

# Build all packages
pnpm build
```

If all commands succeed, you're ready to develop! 🎉

---

## 🏗️ Architecture Overview

### Monorepo Structure

```
JoinRuach/
├── apps/
│   └── ruach-next/              # Next.js 15 frontend
├── packages/
│   ├── ruach-components/        # Shared React components
│   ├── ruach-addons/            # Platform utilities
│   └── ruach-ai/                # AI integration layer
├── ruach-ministries-backend/    # Strapi CMS backend
└── docker-compose.yml           # Service orchestration
```

### Technology Stack

**Frontend:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.5+
- **Styling:** Tailwind CSS 3.4
- **State:** React Server Components + Client Components
- **Auth:** NextAuth.js 4.x
- **AI:** Anthropic Claude SDK, OpenAI SDK

**Backend:**
- **CMS:** Strapi 5.x
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Queue:** BullMQ
- **Storage:** MinIO (S3-compatible)

**Infrastructure:**
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **Monitoring:** BullBoard (queue monitoring)

### Data Flow

```
User Request
    ↓
Next.js (SSR/SSG)
    ↓
Strapi API (REST/GraphQL)
    ↓
PostgreSQL Database
    ↓
Response with Data
```

**With AI:**
```
User Query
    ↓
Next.js API Route
    ↓
Claude/OpenAI SDK
    ↓
Vector Search (pgvector)
    ↓
Augmented Response
```

### Shared Packages

**@ruach/components**
- Reusable React components
- Theme-aware UI elements
- Accessible by default

**@ruach/addons**
- Platform detection
- Analytics integration
- SEO utilities

**@ruach/ai**
- AI prompt templates
- Embedding generation
- Conversation management

---

## 💻 Development Workflow

### Branch Strategy

**Main Branches:**
- `main` - Production-ready code
- `develop` - Development branch
- `staging` - Staging environment

**Feature Branches:**
```bash
# Create feature branch
git checkout -b feature/add-scripture-search

# Make changes
git add .
git commit -m "feat: add scripture search component"

# Push to remote
git push origin feature/add-scripture-search

# Create pull request on GitHub
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication
fix: resolve media player autoplay issue
docs: update API documentation
style: format code with prettier
refactor: extract reusable hook
test: add unit tests for scripture parser
chore: update dependencies
```

**Scopes (optional):**
```
feat(auth): add OAuth login
fix(player): resolve buffering issue
docs(api): document search endpoint
```

### Development Commands

**Start development:**
```bash
# All services
pnpm dev

# Frontend only
pnpm --filter ruach-next dev

# Backend only
cd ruach-ministries-backend && pnpm develop
```

**Build:**
```bash
# All packages and apps
pnpm build

# Specific package
pnpm --filter @ruach/components build
```

**Testing:**
```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm --filter ruach-next test:e2e
```

**Linting:**
```bash
# Lint all code
pnpm lint

# Auto-fix
pnpm lint --fix

# Type check
pnpm typecheck
```

### Code Quality

**Pre-commit Checks:**
1. ESLint (no errors)
2. TypeScript type check
3. Prettier formatting
4. Unit tests pass

**CI/CD Checks:**
1. All linting passes
2. All tests pass
3. Build succeeds
4. No security vulnerabilities

---

## 🧩 Component Library

### Using Components

**Import from shared package:**
```tsx
import { Button, Card, MediaPlayer } from '@ruach/components';

export default function MyPage() {
  return (
    <Card>
      <MediaPlayer videoUrl="https://..." />
      <Button variant="primary">Watch Now</Button>
    </Card>
  );
}
```

### Theme System

**Dark Mode:**
```tsx
// Components automatically adapt to theme
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );
}

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-neutral-900">
      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>
    </div>
  );
}
```

### Component Categories

**Layout:**
- `Header` - Site header with navigation
- `Footer` - Site footer
- `Sidebar` - Collapsible sidebar
- `Container` - Content container with max-width

**Media:**
- `MediaPlayer` - Video/audio player
- `MediaCard` - Media item card
- `MediaGrid` - Responsive media grid

**Social:**
- `LikeButton` - Interactive like button
- `ShareButton` - Multi-platform share
- `CommentSection` - Comments with replies

**Scripture:**
- `ScriptureLookup` - Clickable verse reference
- `ScriptureModal` - Verse viewing modal
- `ScriptureHighlight` - Featured verse card

**Livestream:**
- `LiveIndicator` - Pulsing LIVE badge
- `LivestreamPlayer` - Player with chat
- `CountdownTimer` - Stream countdown
- `UpcomingStream` - Stream preview card

### Styling Guidelines

**Tailwind Classes:**
```tsx
// ✅ Good - Semantic, reusable
<div className="rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-900">

// ❌ Bad - Too specific, hard to maintain
<div className="h-[247px] w-[384px] bg-[#f4f4f4]">
```

**Color Palette:**
- Primary: `amber-500` (brand color)
- Neutral: `neutral-50` to `neutral-950`
- Success: `green-500`
- Error: `red-500`
- Warning: `yellow-500`

**Spacing Scale:**
- xs: `p-1` (4px)
- sm: `p-2` (8px)
- md: `p-4` (16px)
- lg: `p-6` (24px)
- xl: `p-8` (32px)

---

## 📡 API Reference

### Strapi REST API

**Base URL:** `http://localhost:1337/api`

**Authentication:**
```bash
# Get JWT token
curl -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier": "user@example.com", "password": "password"}'

# Use token in requests
curl http://localhost:1337/api/media-items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Common Endpoints:**

**Media:**
```bash
GET    /api/media-items              # List all media
GET    /api/media-items/:id          # Get media by ID
GET    /api/media-items?filters[slug][$eq]=sermon-title  # By slug
POST   /api/media-items              # Create (admin only)
PUT    /api/media-items/:id          # Update (admin only)
DELETE /api/media-items/:id          # Delete (admin only)
```

**Courses:**
```bash
GET    /api/courses                  # List courses
GET    /api/courses/:id?populate=*   # Get course with relations
GET    /api/lessons                  # List lessons
POST   /api/lesson-progresses        # Track progress
```

**Users:**
```bash
GET    /api/users/me                 # Current user
PUT    /api/users/:id                # Update user
GET    /api/user-profiles/:id        # User profile
```

**Query Parameters:**

```bash
# Filtering
?filters[featured][$eq]=true
?filters[category][name][$eq]=Sermons

# Sorting
?sort=publishedAt:desc
?sort[0]=title:asc&sort[1]=publishedAt:desc

# Pagination
?pagination[page]=1&pagination[pageSize]=10

# Population
?populate=*
?populate[0]=thumbnail&populate[1]=category

# Fields
?fields[0]=title&fields[1]=description
```

### Next.js API Routes

**Base URL:** `http://localhost:3000/api`

**AI Chat:**
```bash
POST /api/ai/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "What does John 3:16 mean?"}
  ]
}
```

**Scripture:**
```bash
GET /api/scripture?reference=John%203:16
```

**Analytics:**
```bash
POST /api/analytics/track
Content-Type: application/json

{
  "event": "media_view",
  "properties": {
    "mediaId": 123,
    "duration": 300
  }
}
```

---

## 🚀 Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Test production build locally
cd apps/ruach-next
pnpm start
```

### Environment-Specific Configs

**Development:**
- Debug logging enabled
- Source maps included
- Hot reload active

**Staging:**
- Production mode
- Staging API endpoints
- Test payment gateways

**Production:**
- Optimized builds
- CDN for static assets
- Production databases
- Real payment processors

### Docker Deployment

**Build images:**
```bash
# Frontend
docker build -t ruach-next:latest -f apps/ruach-next/Dockerfile .

# Backend
docker build -t ruach-backend:latest -f ruach-ministries-backend/Dockerfile .
```

**Run with compose:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel Deployment (Frontend)

**Option 1: Git Integration**
1. Connect GitHub repo to Vercel
2. Configure build settings:
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
3. Add environment variables
4. Deploy automatically on push to `main`

**Option 2: CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/ruach-next
vercel --prod
```

### Database Migrations

**Before deployment:**
```bash
# Test migrations locally
cd ruach-ministries-backend
pnpm strapi migrations:run

# Create new migration
pnpm strapi migrations:create add-scripture-fields

# Rollback (if needed)
pnpm strapi migrations:rollback
```

### Health Checks

**Endpoints to monitor:**
- `GET /api/health` - API health
- `GET /admin/health` - Admin health
- `GET /_next/health` - Next.js health

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:00:00Z",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue: "Module not found" errors**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules
pnpm install
```

**Issue: Build fails with memory error**
```bash
# Solution: Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

**Issue: Docker containers won't start**
```bash
# Solution: Reset Docker
docker-compose down -v
docker-compose up -d
```

**Issue: TypeScript errors after update**
```bash
# Solution: Clear cache and rebuild
rm -rf .next
rm -rf dist
pnpm build
```

**Issue: Strapi admin won't load**
```bash
# Solution: Rebuild admin panel
cd ruach-ministries-backend
pnpm strapi build --clean
```

### Debug Mode

**Enable debug logging:**
```bash
# Frontend
DEBUG=* pnpm dev

# Backend
NODE_ENV=development DEBUG=strapi:* pnpm develop
```

**Check logs:**
```bash
# Docker logs
docker-compose logs -f ruach-next
docker-compose logs -f strapi

# Application logs
tail -f apps/ruach-next/.next/trace
```

### Performance Issues

**Slow page loads:**
1. Check network tab for large assets
2. Optimize images (use next/image)
3. Enable caching
4. Use CDN for static assets

**Slow API responses:**
1. Add database indexes
2. Optimize Strapi queries
3. Enable Redis caching
4. Use pagination

---

## 🤝 Contributing

### Code Style

**TypeScript:**
- Use `interface` for object shapes
- Use `type` for unions and intersections
- Prefer `const` over `let`
- Use arrow functions for components

**React:**
- Functional components only
- Use hooks (no class components)
- Keep components small and focused
- Extract reusable logic to custom hooks

**Naming:**
- Components: PascalCase (`MediaPlayer`)
- Functions: camelCase (`fetchMediaItems`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Files: kebab-case (`media-player.tsx`)

### Pull Request Process

1. **Create feature branch** from `develop`
2. **Make changes** with clear commits
3. **Write tests** for new features
4. **Update documentation** if needed
5. **Run checks** locally before pushing
6. **Create PR** with description
7. **Request review** from team
8. **Address feedback** and make changes
9. **Merge** when approved

### Code Review Guidelines

**Reviewers should check:**
- Code follows style guide
- Tests are present and passing
- Documentation is updated
- No security vulnerabilities
- Performance considerations addressed

**Approval required from:**
- At least 1 team member
- Technical lead for major changes

---

## 📞 Support & Resources

### Documentation

- **System Map:** `/RUACH_SYSTEM_MAP.md`
- **Implementation Plan:** `/IMPLEMENTATION_PLAN.md`
- **Phase Completion Docs:** `/PHASE_*.md`
- **API Docs:** `http://localhost:1337/documentation`

### Community

- **GitHub Issues:** Report bugs and request features
- **Discussions:** Ask questions and share ideas
- **Wiki:** Community-contributed guides

### Helpful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Strapi Documentation](https://docs.strapi.io)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Ready to build amazing features for Ruach Ministries! 🚀**

Questions? Open an issue or start a discussion on GitHub.
