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
ARG ENV_NAME

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
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
ARG ENV_NAME

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV ENV_NAME=$ENV_NAME

WORKDIR /app

# Copy pruned dependencies and install them
COPY --from=builder /app/out/json/ .
RUN pnpm install

# Copy full source and build the app
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=nextjs

# Final stage
FROM base AS final

# Add build arguments
ARG NEXT_PUBLIC_SITE_URL
ARG ENV_NAME

# Set environment variables from build arguments
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
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
