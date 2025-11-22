# Wrapper Dockerfile for Railway deployment
# This file allows Railway to build from the frontend/ root directory
# while using the actual Dockerfile located at apps/nextjs/Dockerfile
#
# NOTE: This Dockerfile requires package.json, turbo.json, and pnpm-lock.yaml
# to be present in the frontend/ directory. These are copies of the root files.
# Keep them in sync with the root versions for Railway builds to work.

# Base image with essential tools
FROM node:22-alpine AS base

# Install necessary packages and setup pnpm
RUN apk add --no-cache libc6-compat && \
    npm install -g corepack && \
    corepack enable && \
    corepack enable pnpm

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Builder stage for pruning dependencies
FROM base AS builder

# Add build arguments
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BE_URL
ARG NEXT_PUBLIC_REST_API_URL
ARG ENV_NAME

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BE_URL=$NEXT_PUBLIC_BE_URL
ENV NEXT_PUBLIC_REST_API_URL=$NEXT_PUBLIC_REST_API_URL
ENV ENV_NAME=$ENV_NAME

WORKDIR /app

# Install TurboRepo globally
RUN pnpm add -g turbo

# Copy source code and prune dependencies for Next.js
COPY . .
RUN turbo prune --scope=nextjs --docker

# Installer stage for installing and building the app
FROM base AS installer

# Add build arguments
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BE_URL
ARG NEXT_PUBLIC_REST_API_URL
ARG ENV_NAME

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BE_URL=$NEXT_PUBLIC_BE_URL
ENV NEXT_PUBLIC_REST_API_URL=$NEXT_PUBLIC_REST_API_URL
ENV ENV_NAME=$ENV_NAME

WORKDIR /app

# Copy pruned dependencies and install them
COPY --from=builder /app/out/json/ .
RUN pnpm install

# Copy full source and build the app
COPY --from=builder /app/out/full/ .

# Validate required environment variables before building
RUN if [ -z "$ENV_NAME" ] || [ -z "$NEXT_PUBLIC_SITE_URL" ] || [ -z "$NEXT_PUBLIC_API_URL" ] || [ -z "$NEXT_PUBLIC_BE_URL" ] || [ -z "$NEXT_PUBLIC_REST_API_URL" ]; then \
        echo "ERROR: Missing required environment variables!" && \
        echo "ENV_NAME: ${ENV_NAME:-'NOT SET'}" && \
        echo "NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-'NOT SET'}" && \
        echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-'NOT SET'}" && \
        echo "NEXT_PUBLIC_BE_URL: ${NEXT_PUBLIC_BE_URL:-'NOT SET'}" && \
        echo "NEXT_PUBLIC_REST_API_URL: ${NEXT_PUBLIC_REST_API_URL:-'NOT SET'}" && \
        echo "Please set these variables in Railway service settings -> Variables" && \
        exit 1; \
    fi

RUN pnpm turbo run build --filter=nextjs

# Final stage
FROM base AS final

# Add build arguments
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BE_URL
ARG NEXT_PUBLIC_REST_API_URL
ARG ENV_NAME

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BE_URL=$NEXT_PUBLIC_BE_URL
ENV NEXT_PUBLIC_REST_API_URL=$NEXT_PUBLIC_REST_API_URL
ENV ENV_NAME=$ENV_NAME

WORKDIR /app

# Copy built output and production deps
COPY --from=installer /app ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Expose the port Next.js runs on
EXPOSE 3001

# Start the app
CMD ["pnpm", "turbo", "start", "--filter=nextjs"]

