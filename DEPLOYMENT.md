# Deployment Guide

This document describes how to set up automated deployment to Railway and Supabase migrations.

## Prerequisites

1. Railway account and project set up
2. Supabase project with PostgreSQL database
3. GitHub repository with Actions enabled

## GitHub Secrets Setup

Configure the following secrets in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

### Required Secrets

**Required:**

- **`SUPABASE_DB_HOST`**: Connection pooler host
    - Example: `aws-1-eu-west-1.pooler.supabase.com`
    - Find in Supabase → **Settings** → **Database** → **Connection Pooler**

- **`SUPABASE_DB_USER`**: User with tenant ID
    - Format: `postgres.tenant-id` (e.g., `postgres.memhwmoymcinxuvcthfz`)
    - Find in the connection pooler connection string

- **`SUPABASE_DB_PASSWORD`**: Database password
    - Your database password (NOT API keys)
    - Find in Supabase → **Settings** → **Database** → **Database password**

- **`RAILWAY_TOKEN`**: Railway API token
    - Go to Railway dashboard → Click your profile icon (top right) → **Settings** → **Tokens**
    - Or go directly to: https://railway.app/account/tokens
    - Click **New Token** → Give it a name → Copy the token

**Optional (have defaults):**

- **`SUPABASE_DB_PORT`**: Port (defaults to `6543` if not set)
- **`SUPABASE_DB_NAME`**: Database name (defaults to `postgres` if not set)

## Railway Setup

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository

### 2. Configure Backend Service

1. Add a new service from your GitHub repository
2. Name it `backend`
3. Set the **Root Directory** to `backend/` in Railway service settings
4. Railway will automatically detect the Dockerfile in `backend/` directory

**Backend Environment Variables:**

- Go to your backend Railway service → **Variables**
- Add the following environment variables:
    - `DB_URL`: Full JDBC connection string
        - Format: `jdbc:postgresql://[HOST]:[PORT]/[DATABASE]?sslmode=require&prepareThreshold=0`
        -
        Example: `jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0`
        - Use your Supabase connection pooler host and port `6543`
        - `prepareThreshold=0` is required for pgbouncer compatibility
    - `DB_USERNAME`: Your Supabase database user (format: `postgres.tenant-id`)
    - `DB_PASSWORD`: Your Supabase database password
    - `SPRING_PROFILES_ACTIVE`: `prod`
    - Any other environment variables your application needs

### 3. Configure Frontend Service

1. Add another service from your GitHub repository
2. Name it `nextjs` (this name must match the service name in the workflow)
3. Set the **Root Directory** to `frontend/` in Railway service settings
4. Railway will automatically detect the `Dockerfile` in the `frontend/` directory

**Frontend Environment Variables:**

- Go to your nextjs Railway service → **Variables**
- Add the following environment variables (required for build):
    - `ENV_NAME`: `production`
    - `NEXT_PUBLIC_SITE_URL`: Your frontend URL (e.g., `https://your-frontend.railway.app`)
    - `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://your-backend.railway.app`)
    - `NEXT_PUBLIC_BE_URL`: Your backend URL (same as `NEXT_PUBLIC_API_URL`)
    - `NEXT_PUBLIC_REST_API_URL`: Your REST API URL (same as `NEXT_PUBLIC_API_URL`)

**Note:** These variables are used during the Docker build process, so they must be set before deployment. Railway
automatically passes environment variables as build arguments.

## How It Works

When code is pushed to the `main` branch:

1. **Supabase Migrations**:
    - The workflow runs Flyway migrations against your Supabase database
    - This ensures your database schema is always up to date

2. **Railway Deployment**:
    - The workflow uses Railway CLI to deploy both backend and frontend services
    - Backend: Deploys from `backend/` directory
    - Frontend: Deploys from `frontend/` directory using the `nextjs` service name
    - Railway builds and deploys the Docker images automatically

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Railway and Supabase** workflow
3. Click **Run workflow** → **Run workflow**

## Troubleshooting

### Migrations Fail

- **Use Connection Pooler**: The workflow defaults to port `6543` (connection pooler). This is more reliable for
  external connections from GitHub Actions.
    - In Supabase dashboard → **Settings** → **Database**, look for "Connection Pooler" section
    - Use the pooler host and port `6543` instead of direct connection (port `5432`)

- **Check Database Status**:
    - Go to Supabase dashboard and verify your database is **not paused**
    - Free tier databases pause after inactivity - resume it if needed

- **Verify Secrets**: Check that all required secrets are set correctly

### Railway Deployment Fails

- Verify `RAILWAY_TOKEN` is valid and has proper permissions
- Check that Railway services are properly configured:
    - Backend service: Root directory `backend/`, service name `backend`
    - Frontend service: Root directory `frontend/`, service name `nextjs`
- Verify all required environment variables are set in Railway for both services
- For frontend: Ensure all `NEXT_PUBLIC_*` variables are set before building
- For backend: Ensure `DB_URL` is a full JDBC URL starting with `jdbc:postgresql://`

### Backend Connection Issues

**"Driver claims to not accept jdbcUrl" error:**

- Ensure `DB_URL` is a full JDBC connection string, not just a hostname
- Format: `jdbc:postgresql://[HOST]:[PORT]/[DATABASE]?sslmode=require&prepareThreshold=0`
- Example: `jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0`
- The `prepareThreshold=0` parameter is required for Supabase connection pooler (pgbouncer)

### Frontend Build Issues

**"Missing required environment variables" error:**

- All `NEXT_PUBLIC_*` variables and `ENV_NAME` must be set in Railway before building
- These are used during the Docker build process
- Set them in Railway service → **Variables** tab
- `ENV_NAME` must be exactly `production` (not `prod` or anything else)

### Connection Pooler Setup

1. **Use Connection Pooler (Port 6543)**:
    - Direct connections (port 5432) are often restricted
    - Use the Connection Pooler endpoint with port `6543`
    - In Supabase dashboard → **Settings** → **Database** → **Connection Pooler**
    - Copy the pooler connection string (Transaction mode, port 6543)
    - Extract the host: should be `aws-X-region.pooler.supabase.com`
    - Extract the user: should be `postgres.tenant-id` (includes tenant ID)

2. **Verify Credentials**:
    - Ensure `SUPABASE_DB_PASSWORD` is your **database password**, not your Supabase API keys
    - Database password is different from `anon` and `service_role` keys

3. **Check Host and User Format**:
    - Host should be pooler host: `aws-X-region.pooler.supabase.com` (NOT `db.xxxxx.supabase.co`)
    - User should include tenant ID: `postgres.tenant-id` (NOT just `postgres`)
