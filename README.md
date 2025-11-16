# Configurator Monorepo

Monorepo containing backend (Kotlin Spring Boot) and frontend (Next.js) applications.

## Prerequisites

- Node.js >= 22
- pnpm 10.6.5
- Java 21
- Docker & Docker Compose

## Quick Start

```bash
# First time setup
pnpm install
cp backend/.env.dev backend/.env
cp frontend/apps/nextjs/.env.example frontend/apps/nextjs/.env

# Daily workflow
pnpm db:up              # Start database
pnpm backend:migrate    # Run migrations + generate jOOQ
pnpm backend:dev       # Start backend (port 8080)
pnpm frontend:dev       # Start Next.js frontend (port 3001)
```

## Available Commands

- `pnpm db:up` / `pnpm db:down` - Start/stop database
- `pnpm backend:migrate` - Run migrations + generate jOOQ code
- `pnpm backend:dev` - Start backend
- `pnpm frontend:dev` - Start Next.js app
- `pnpm api:generate` - Generate TypeScript types from OpenAPI

See [START.md](./START.md) for detailed workflow.
