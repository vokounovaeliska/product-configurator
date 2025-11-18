# Deployment Guide

This document describes how to set up automated deployment to Railway and Supabase migrations.

## Prerequisites

1. Railway account and project set up
2. Supabase project with PostgreSQL database
3. GitHub repository with Actions enabled

## GitHub Secrets Setup

You need to configure the following secrets in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

### Required Secrets

The workflow uses separate secrets for better security and flexibility. Add these secrets:

- **`SUPABASE_DB_HOST`**: Your Supabase connection pooler host
    - Format: `aws-X-region.pooler.supabase.com` (e.g., `aws-1-eu-west-1.pooler.supabase.com`)
    - **Important**: Use the **Connection Pooler** host, NOT the direct database host
    - Find this in Supabase connection → **Settings** → **Database** → **Connection Pooler** → **Connection string**
    - Example: `aws-1-eu-west-1.pooler.supabase.com`

- **`SUPABASE_DB_PORT`**: Database port (optional, defaults to 6543)
    - **Recommended**: `6543` (Connection Pooler - Transaction mode, best for migrations)
    - Alternative: `5432` (Session mode on pooler, also works but 6543 is preferred)
    - If not set, the workflow defaults to `6543` (pooler port)

- **`SUPABASE_DB_NAME`**: Database name (usually `postgres`)

- **`SUPABASE_DB_USER`**: Database user with tenant ID
    - Format: `postgres.tenant-id` (e.g., `postgres.memhwmoymcinxuvcthfz`)
    - **Important**: Must include the tenant ID after the dot
    - Find this in Supabase dashboard → **Settings** → **Database** → **Connection Pooler** → **Connection string**
    - The user format is: `postgres.` followed by your project reference ID

- **`SUPABASE_DB_PASSWORD`**: Database password
    - This is your database password, NOT your Supabase API keys
    - Find this in Supabase dashboard → **Settings** → **Database** → **Database password**

- **`RAILWAY_TOKEN`**: Railway API token
    - Go to Railway dashboard → **Settings** → **Tokens**
    - Create a new token and copy it
    - This token is used to authenticate Railway CLI in GitHub Actions

## Railway Setup

1. **Create a Railway project** (if not already created)
    - Go to [Railway](https://railway.app)
    - Create a new project
    - Connect your GitHub repository

2. **Configure Backend Railway service**
     - Add a new service from your GitHub repository
     - Name it `backend` (or any name you prefer)
     - Set the **Root Directory** to `backend/` in Railway service settings
     - Railway will automatically detect the Dockerfile in `backend/` directory
     - The workflow uses `railway up` without specifying a service name, so Railway will automatically detect the service based on the working directory (`backend/`)

3. **Configure Frontend Railway service**
     - Add another service from your GitHub repository
     - Name it `nextjs` (this name must match the `--service` flag in the workflow)
     - Set the **Root Directory** to `frontend/` in Railway service settings
     - Railway will automatically detect the `Dockerfile` in the `frontend/` directory
     - **Note**: There's a wrapper `Dockerfile` at `frontend/Dockerfile` that Railway will use automatically - no additional configuration needed!

4. **Configure Environment Variables in Railway**

   **Backend Service Variables:**
     - Go to your backend Railway service → **Variables**
     - Add the following environment variables:
         - `DB_URL`: Your Supabase database connection string (same as `SUPABASE_DATABASE_URL`)
         - `DB_USERNAME`: `postgres`
         - `DB_PASSWORD`: Your Supabase database password
         - `SPRING_PROFILES_ACTIVE`: `prod`
         - Any other environment variables your application needs

   **Frontend Service Variables:**
     - Go to your nextjs Railway service → **Variables**
     - Add the following environment variables:
         - `NEXT_PUBLIC_SITE_URL`: Your frontend URL (e.g., `https://your-app.railway.app`)
         - `NEXT_PUBLIC_API_URL`: Your API URL (e.g., `https://your-backend.railway.app`)
         - `NEXT_PUBLIC_BE_URL`: Your backend URL (same as `NEXT_PUBLIC_API_URL`)
         - `NEXT_PUBLIC_REST_API_URL`: Your REST API URL (same as `NEXT_PUBLIC_API_URL`)
         - `ENV_NAME`: `production`

## How It Works

When code is merged to the `main` branch:

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

- **Use Connection Pooler**: The workflow defaults to port `6543` (connection pooler). This is more reliable for external connections from GitHub Actions.
  - In Supabase dashboard → **Settings** → **Database**, look for "Connection Pooler" section
  - Use the pooler host and port `6543` instead of direct connection (port `5432`)
  - Direct connections (port 5432) may be restricted or unreachable from GitHub Actions

- **Check Database Status**: 
  - Go to Supabase dashboard and verify your database is **not paused**
  - Free tier databases pause after inactivity - resume it if needed

- **Verify Secrets**: Check that all required secrets are set:
  - `SUPABASE_DB_HOST` - Should be the pooler host (e.g., `db.xxxxx.supabase.co` or pooler host)
  - `SUPABASE_DB_PORT` - Should be `6543` for pooler (or leave unset to use default)
  - `SUPABASE_DB_NAME` - Usually `postgres`
  - `SUPABASE_DB_USER` - Usually `postgres`
  - `SUPABASE_DB_PASSWORD` - Your database password (not API keys)

- **Network Connectivity**: 
  - The workflow includes a connectivity test that will fail early if the database is unreachable
  - Check the error messages for specific guidance
  - Ensure your Supabase project allows connections from external IPs (default: enabled)

### Railway Deployment Fails

- Verify `RAILWAY_TOKEN` is valid and has proper permissions
- Check that Railway services are properly configured
- Ensure the service names match:
  - Backend service should be detected automatically from `backend/` directory
  - Frontend service must be named `nextjs` to match the `--service nextjs` flag in the workflow
- Verify Dockerfile paths are correct:
  - Backend: `backend/Dockerfile` (auto-detected from root directory)
  - Frontend: `frontend/Dockerfile` (wrapper Dockerfile that Railway auto-detects)
- Check that all required environment variables are set in Railway for both services

### Connection Issues

**"Network is unreachable" or "Connection attempt failed" errors:**

1. **Use Connection Pooler (Port 6543)**:
   - Direct connections (port 5432) are often restricted or unreachable from GitHub Actions
   - Use the Connection Pooler endpoint with port `6543` instead
   - In Supabase dashboard → **Settings** → **Database** → **Connection Pooler**
   - Copy the pooler connection string (Transaction mode, port 6543)
   - Extract the host: should be `aws-X-region.pooler.supabase.com`
   - Extract the user: should be `postgres.tenant-id` (includes tenant ID)
   - Set `SUPABASE_DB_HOST` to the pooler host (e.g., `aws-1-eu-west-1.pooler.supabase.com`)
   - Set `SUPABASE_DB_USER` to the full user format (e.g., `postgres.memhwmoymcinxuvcthfz`)
   - Set `SUPABASE_DB_PORT` to `6543` (or leave unset to use default)

2. **Database Paused**:
   - Free tier Supabase databases pause after inactivity
   - Go to Supabase dashboard → **Settings** → **Database**
   - Click "Resume" if the database is paused
   - Wait a few minutes for the database to fully start

3. **Verify Credentials**:
   - Ensure `SUPABASE_DB_PASSWORD` is your **database password**, not your Supabase API keys
   - Database password is different from `anon` and `service_role` keys
   - Reset database password in Supabase dashboard if needed

4. **Check Host and User Format**:
   - Host should be pooler host: `aws-X-region.pooler.supabase.com` (NOT `db.xxxxx.supabase.co`)
   - User should include tenant ID: `postgres.tenant-id` (NOT just `postgres`)
   - No `http://` or `https://` prefix
   - No trailing slashes
   - Example connection string format:
     ```
     postgresql://postgres.memhwmoymcinxuvcthfz:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
     ```

5. **Test Locally**:
   - Try connecting from your local machine using the same credentials
   - If local connection works but GitHub Actions fails, it's likely a network/firewall issue
   - Use connection pooler endpoint for both local and CI/CD connections

