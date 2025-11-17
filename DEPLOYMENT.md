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

- **`SUPABASE_DATABASE_URL`**: Full PostgreSQL connection string
    - Format: `postgresql://postgres:[PASSWORD]@db.memedfsccinxuvcthfz.supabase.co:5432/postgres`
    - Replace `[PASSWORD]` with your actual Supabase database password
    - You can find this in your Supabase project settings under **Database** → **Connection string**

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

- Check that `SUPABASE_DATABASE_URL` secret is correctly set
- Verify the connection string format is correct
- Ensure your Supabase database is accessible from GitHub Actions IPs

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

- Make sure your Supabase database allows connections from external IPs
- Check firewall settings if applicable
- Verify database credentials are correct

