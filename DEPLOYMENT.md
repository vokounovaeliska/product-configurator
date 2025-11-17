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

2. **Configure Railway service**
     - Add a new service from your GitHub repository
     - Set the **Root Directory** to `backend/` in Railway service settings
     - Railway will automatically detect the Dockerfile in `backend/` directory
     - The workflow uses `railway up` without specifying a service name, so Railway will automatically detect the service based on the working directory (`backend/`)

3. **Configure Environment Variables in Railway**
    - Go to your Railway service → **Variables**
    - Add the following environment variables:
        - `DB_URL`: Your Supabase database connection string (same as `SUPABASE_DATABASE_URL`)
        - `DB_USERNAME`: `postgres`
        - `DB_PASSWORD`: Your Supabase database password
        - `SPRING_PROFILES_ACTIVE`: `prod`
        - Any other environment variables your application needs

## How It Works

When code is merged to the `main` branch:

1. **Supabase Migrations**:
    - The workflow runs Flyway migrations against your Supabase database
    - This ensures your database schema is always up to date

2. **Railway Deployment**:
    - The workflow uses Railway CLI to deploy the backend service
    - Railway builds and deploys the Docker image automatically

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
- Check that Railway service is properly configured
- Ensure the service name in the workflow matches your Railway service name

### Connection Issues

- Make sure your Supabase database allows connections from external IPs
- Check firewall settings if applicable
- Verify database credentials are correct

