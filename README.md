# Universal Product Configurator Backend

Kotlin Spring Boot backend for a product configurator and inquiry system.

## Prerequisites

- Java 21
- Maven 3.8+ (or use `./mvnw`)
- Docker & Docker Compose

## Quick Start

```bash
# 1. Start database
docker-compose -f docker-compose.dev.yaml up -d

# 2. Build the project
mvn clean install -Dspring.datasource.url=jdbc:postgresql://localhost:5432/configuratordb -Dspring.datasource.username=configuratoruser -Dspring.datasource.password=configuratorpassword -DskipTests

# 3. Run the application
mvn spring-boot:run
```

Application available at `http://localhost:8080`

## Configuration

Set environment variables or use defaults in `application.yaml`:

- `DB_URL` - Database connection URL (default: `jdbc:postgresql://localhost:5432/configuratordb`)
- `DB_USERNAME` - Database user (default: `configuratoruser`)
- `DB_PASSWORD` - Database password (default: `configuratorpassword`)
- `SPRING_PROFILES_ACTIVE` - Active profiles (default: `dev`)

## API Documentation

- Swagger UI: http://localhost:8080/swagger/ui-docs
- Health Check: http://localhost:8080/actuator/health

## Project Structure

Single-module Maven project with feature modules as packages:

- `products/` - Product configuration features
- `users/` - User management
- `shared/` - Shared utilities

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture guidelines.

## Testing

```bash
# All tests
./mvnw test

# Unit tests only
./mvnw test -Dtest=**/unit/**/*

# Integration tests only
./mvnw test -Dtest=**/integration/**/*
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment to Railway, Supabase, and Vercel/Netlify.
