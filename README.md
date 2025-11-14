# Welcome to JoinRuach

> **"Where technology meets testimony, and code carries Kingdom purpose."**

[![CI/CD Pipeline](https://github.com/joinruach/JoinRuach/actions/workflows/ci.yml/badge.svg)](https://github.com/joinruach/JoinRuach/actions/workflows/ci.yml)
[![Enhanced CI](https://github.com/joinruach/JoinRuach/actions/workflows/ci-enhanced.yml/badge.svg)](https://github.com/joinruach/JoinRuach/actions/workflows/ci-enhanced.yml)
[![codecov](https://codecov.io/gh/joinruach/JoinRuach/branch/main/graph/badge.svg)](https://codecov.io/gh/joinruach/JoinRuach)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is JoinRuach?

**JoinRuach** is the community, contribution, and collaboration hub for **Ruach Ministries** — a faith-driven media and technology initiative restoring identity, purpose, and hope through storytelling, software, and systems.

We're building:
- **Faith-centered media** that reframes narratives of identity and purpose
- **Technical infrastructure** that scales Kingdom work globally
- **Creative tools** that empower believers to build with excellence
- **Multilingual platform** serving communities in English, Spanish, French, and Portuguese

Whether you're a **developer**, **designer**, **storyteller**, or **visionary**, there's a place for you here.

---

## Architecture Overview

This is a **Turborepo monorepo** powered by **pnpm workspaces**, containing:

### Apps
- **ruach-next** — Next.js 15 (App Router) platform with i18n, PWA, AI assistant, and Strapi CMS integration

### Packages
- **@ruach/ai** — AI-powered features (chat assistant, content generation)
- **@ruach/components** — Shared React component library
- **@ruach/hooks** — Custom React hooks
- **@ruach/icons** — Icon system and components
- **@ruach/addons** — Next.js-specific addons and utilities
- **@ruach/types** — Shared TypeScript types
- **@ruach/utils** — Utility functions and helpers
- **@ruach/tailwind-preset** — Tailwind CSS configuration preset

### Backend
- **ruach-ministries-backend** — Strapi 5 headless CMS for content management

## Tech Stack

### Frontend (ruach-next)
- **Next.js 15** (App Router) with React 18
- **next-intl** for internationalization (4 locales)
- **NextAuth.js** for authentication
- **Tailwind CSS** + **tailwindcss-animate** for styling
- **@ducanh2912/next-pwa** for Progressive Web App support
- **AI SDK** (Anthropic Claude) for AI assistant
- **Sentry** for error monitoring
- **Upstash Redis** for rate limiting and caching

### Backend
- **Strapi 5** headless CMS
- **PostgreSQL** database
- **Cloudflare R2** for media storage
- **BullMQ** + **Redis** for job queues

### Infrastructure
- **Docker** with multi-stage builds (standalone mode)
- **Turborepo** for monorepo management
- **pnpm** for package management
- **GitHub Actions** for CI/CD
- **Playwright** for E2E testing
- **Vitest** for unit/integration testing

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9.12.0+
- Docker (optional, for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/joinruach/JoinRuach.git
cd JoinRuach

# Install dependencies
pnpm install

# Set up environment variables
cp apps/ruach-next/.env.example apps/ruach-next/.env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev
```

The Next.js app will be available at http://localhost:3000

### Build for Production

```bash
# Build all packages and apps
pnpm build

# Build specific app
pnpm --filter ruach-next build

# Build all packages only
pnpm build:packages
```

---

## Quick Navigation

### **Getting Started**
- [Vision & Mission](./Vision-and-Mission) — Why we exist and where we're going
- [How to Contribute](./How-to-Contribute) — Join the work
- [Code of Conduct](./Code-of-Conduct) — Our community values

### **For Developers**
- [Technical Stack](#tech-stack) — Architecture and tools
- [Development Setup](#quick-start) — Get your environment running
- [Testing Guide](./docs/TESTING.md) — Comprehensive testing documentation
- [Coverage Matrix](./docs/COVERAGE_MATRIX.md) — Test coverage tracking
- [API Documentation](./API-Documentation) — Integrate with Ruach systems
- [Contributing Code](./Contributing-Code) — Pull requests, standards, and workflows

### **For Creators**
- [Content Guidelines](./Content-Guidelines) — Storytelling with purpose
- [Design System](./Design-System) — Visual language and brand standards
- [Media Submission](./Media-Submission) — Share your work

### **Project Resources**
- [Roadmap](./Roadmap) — What's next
- [FAQs](./FAQs) — Common questions answered
- [Community](./Community) — Connect with the team

---

## Core Principles

1. **Excellence as Worship** — We build with craftsmanship because our work reflects our Creator
2. **Truth Over Trends** — We don't chase culture; we shape it with timeless truth
3. **Kingdom Scale** — We think local, build global, impact eternal
4. **Open Hearts, Open Source** — We share generously and collaborate freely

---

## Get Involved

### **Three Ways to Join**

1. **Build** — Contribute code, design, or infrastructure
2. **Create** — Submit stories, media, or creative content
3. **Support** — Pray, fund, or share the vision

[→ Start Contributing](./How-to-Contribute)

---

## Testing & Quality

We maintain **100% test coverage** across all critical paths to ensure reliability and stability.

### Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run complete test matrix
./scripts/test-matrix.sh --coverage
```

### Test Coverage

- ✅ Unit Tests: 100% coverage target
- ✅ Integration Tests: API, Database, R2 Storage
- ✅ E2E Tests: Full user journeys
- ✅ CI/CD: Automated testing on every PR

For comprehensive testing documentation, see [docs/TESTING.md](./docs/TESTING.md).

---

## Stay Connected

- **Website**: [ruachstudios.com](https://ruachstudios.com)
- **GitHub**: [github.com/ruachstudios](https://github.com/ruachstudios)
- **Contact**: hello@ruachstudios.com

---

*Built with purpose. Powered by faith. Driven by community.*
