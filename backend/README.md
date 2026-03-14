# Backend

Kotlin Spring Boot backend application.

## Prerequisites

- Java 21
- Docker (for database)

## Quick Start

```bash
# From root directory
pnpm db:up              # Start database
pnpm backend:migrate     # Run migrations + generate jOOQ
pnpm backend:dev        # Start backend
```

Backend runs at `http://localhost:8080`

## Environment Variables

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

Required variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SPRING_MAIL_PASSWORD` (for email)

## API Documentation

- Swagger UI: http://localhost:8080/swagger/ui-docs
- OpenAPI JSON: http://localhost:8080/swagger/api-docs
