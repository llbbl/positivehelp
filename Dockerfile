# syntax=docker/dockerfile:1
# Use Node.js with pnpm for building (most stable option)
FROM node:24-alpine AS base
# Use corepack to enable pnpm (avoids npm dependency)
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Install dependencies only when needed
FROM base AS deps
# Update package index and install required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    ca-certificates \
    tzdata

WORKDIR /app

# Install dependencies with pnpm (faster than npm, more reliable than bun for builds)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Accept environment variables as build arguments
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG TURSO_DATABASE_URL
ARG TURSO_AUTH_TOKEN

# Set environment variables for build
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
ENV TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with Node.js (stable and reliable)
RUN pnpm run build

# Production image, use Node.js for better Next.js compatibility
FROM node:24-alpine AS runner

# Install required packages for Alpine Linux
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    tzdata

# Remove npm to avoid glob vulnerability (not needed for runtime)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache and logs
RUN mkdir -p .next logs
RUN chown -R nextjs:nodejs .next logs

# Copy the Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Run the application with Node.js
CMD ["node", "server.js"]