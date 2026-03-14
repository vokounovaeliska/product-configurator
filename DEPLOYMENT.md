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

- **`SUPABASE_DB_PORT`**: Port (defaults to `6543` if not set – override if your connection string uses `5432` or another port)
- **`SUPABASE_DB_NAME`**: Database name (defaults to `postgres` if not set)
- **`SPRING_MAIL_HOST`**: SMTP server hostname (for backend email sync to Railway)
- **`SPRING_MAIL_PORT`**: SMTP port, e.g. `587`
- **`SPRING_MAIL_USERNAME`**: Full mailbox email address
- **`SPRING_MAIL_PASSWORD`**: Mailbox password
- **`MAIL_FROM`**: Sender address shown in outgoing emails
- **`MAIL_FROM_NAME`**: Sender display name shown in outgoing emails

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
        - Example (using the pooler on port `6543`):  
          `jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0`
        - Use your **Supabase connection settings exactly as shown in the dashboard** (host + port from your connection string, which may be `5432` or `6543`)
        - `prepareThreshold=0` is required for pgbouncer compatibility
    - `DB_USERNAME`: Your Supabase database user (format: `postgres.tenant-id`)
    - `DB_PASSWORD`: Your Supabase database password
    - `SPRING_PROFILES_ACTIVE`: `prod`
    - `JWT_USERS_KEY`: Secret used to sign user JWTs
        - **Must be at least 256 bits (32+ random characters)** or you will see  
          `The secret length must be at least 256 bits` from the login endpoint
    - `CORS_ALLOWED_ORIGINS`: Comma‑separated list of allowed frontend origins for CORS, e.g.  
      `https://frontend-production-1234.up.railway.app,https://your-custom-domain.com`
    - Any other environment variables your application needs

**Email (SMTP) – for sending confirmation and notification emails:**

When a customer submits a quote request, the app sends:
- a confirmation email to the customer
- a notification email to the product owner (user’s `notificationEmail` or `email`)

Without email configuration, these emails are only logged (noop). To send real emails, use **Resend** (recommended for Railway) or SMTP.

**Option A – Resend (recommended for Railway Free/Hobby):**

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Your Resend API key (from [resend.com/api-keys](https://resend.com/api-keys)) |
| `MAIL_FROM` | Sender address (must be from a [verified domain](https://resend.com/domains) in Resend) |
| `MAIL_FROM_NAME` | Sender display name |

**Option B – SMTP (blocked on Railway Free/Hobby; Pro plan only):**

| Variable | Description | Example (Webglobe) |
|----------|-------------|--------------------|
| `SPRING_MAIL_HOST` | SMTP server hostname | `mail.webglobe.cz` |
| `SPRING_MAIL_PORT` | SMTP port (465 SMTPS, 587 STARTTLS) | `465` (prefer if 587 times out) |
| `SPRING_MAIL_USERNAME` | Full email address | `info@konfiguruj.com` |
| `SPRING_MAIL_PASSWORD` | Mailbox password | your mailbox password |
| `MAIL_FROM` | Sender address (e.g. noreply) | `noreply@konfiguruj.com` |
| `MAIL_FROM_NAME` | Sender display name | `Konfiguruj` |

You can configure these in one of two ways:

1. **Recommended for this repository:** add the six values above as **GitHub Actions secrets** with the exact same names.  
   The deployment workflow automatically syncs them to the Railway `backend` service before deploy.
2. **Manual alternative:** set them directly in Railway → `backend` service → **Variables**.

If a mail secret is missing in GitHub, the workflow leaves the existing Railway value unchanged.

**Webglobe SMTP settings:**
- Host: `mail.webglobe.cz`
- Port: `465` (SMTPS/SSL) or `587` (STARTTLS). If 587 times out in cloud (Railway etc.), use 465.
- For port 465: default config uses SSL. For port 587: set `SPRING_MAIL_PORT=587`, `SPRING_MAIL_SSL_ENABLE=false`, `SPRING_MAIL_STARTTLS_ENABLE=true`
- Authentication required: use full email and mailbox password

Ensure your domain’s SPF/DKIM records allow sending from this server (Webglobe usually configures these).

### 3. Configure Frontend Service

1. Add another service from your GitHub repository
2. Name it `nextjs` (this name must match the service name in the workflow)
3. Set the **Root Directory** to `frontend/` in Railway service settings
4. Railway will automatically detect the `Dockerfile` in the `frontend/` directory

**Frontend Environment Variables:**

- Go to your nextjs Railway service → **Variables**
- Add the following environment variables (required for build):
    - `ENV_NAME`: `production`
    - `NEXT_PUBLIC_SITE_URL`: Your **public frontend URL** (e.g., `https://your-frontend.railway.app`)
    - `NEXT_PUBLIC_API_URL`: Your **public backend API URL** (e.g., `https://your-backend.railway.app`)
    - `NEXT_PUBLIC_BE_URL`: Your backend URL (same as `NEXT_PUBLIC_API_URL`)
    - `NEXT_PUBLIC_REST_API_URL`: Your REST API URL (same as `NEXT_PUBLIC_API_URL`)

**Important:**

- All `NEXT_PUBLIC_*` URLs must be **public HTTPS URLs**, not internal hosts like  
  `http://backend.railway.internal`, because they are called directly from the browser.
- The origins you configure in `CORS_ALLOWED_ORIGINS` on the backend must match the  
  frontend URLs you set here so that browsers can call the API without CORS errors.

**Note:** These variables are used during the Docker build process, so they must be set before deployment. Railway
automatically passes environment variables as build arguments.

## How It Works

When code is pushed to the `main` branch:

1. **Supabase Migrations**:
    - The workflow runs Flyway migrations against your Supabase database
    - This ensures your database schema is always up to date

2. **Railway Deployment**:
    - The workflow uses Railway CLI to deploy both backend and frontend services
    - Before deploying backend, it syncs optional mail-related GitHub secrets to Railway service variables
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

- **Use the correct port**:
    - The workflow defaults to port `6543` (pooler). If your Supabase connection string uses `5432` (direct DB) or a different port, set `SUPABASE_DB_PORT` accordingly so `FLYWAY_URL` matches your actual settings.
    - In Supabase dashboard → **Settings** → **Database**, use the host and port from the connection (pooler or direct) you intend to use.

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
- If email is still not working, verify the corresponding GitHub secrets exist and are named exactly:
  `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_FROM_NAME`
- For frontend: Ensure all `NEXT_PUBLIC_*` variables are set before building
- For backend: Ensure `DB_URL` is a full JDBC URL starting with `jdbc:postgresql://`

### Backend Connection Issues

**"Driver claims to not accept jdbcUrl" error:**

- Ensure `DB_URL` is a full JDBC connection string, not just a hostname
- Format: `jdbc:postgresql://[HOST]:[PORT]/[DATABASE]?sslmode=require&prepareThreshold=0`
- Example (pooler): `jdbc:postgresql://aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0`
- The `prepareThreshold=0` parameter is required for Supabase connection pooler (pgbouncer); you can still keep it when using port `5432`.

### Frontend Build Issues

**"Missing required environment variables" error:**

- All `NEXT_PUBLIC_*` variables and `ENV_NAME` must be set in Railway before building
- These are used during the Docker build process
- Set them in Railway service → **Variables** tab
- `ENV_NAME` must be exactly `production` (not `prod` or anything else)

### Connection Pooler Setup

1. **Use Connection Pooler (commonly port 6543)**:
    - Many setups prefer the Connection Pooler endpoint on port `6543`, but if your Supabase project shows a different port (e.g. `5432`) for the connection you’re using, follow that.
    - In Supabase dashboard → **Settings** → **Database** → **Connection Pooler**
    - Copy the pooler connection string (Transaction mode, note the port it uses)
    - Extract the host: should be `aws-X-region.pooler.supabase.com`
    - Extract the user: should be `postgres.tenant-id` (includes tenant ID)

2. **Verify Credentials**:
    - Ensure `SUPABASE_DB_PASSWORD` is your **database password**, not your Supabase API keys
    - Database password is different from `anon` and `service_role` keys

3. **Check Host and User Format**:
    - Host should be pooler host: `aws-X-region.pooler.supabase.com` (NOT `db.xxxxx.supabase.co`)
    - User should include tenant ID: `postgres.tenant-id` (NOT just `postgres`)
