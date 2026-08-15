# syntax=docker/dockerfile:1
# Use Node.js with pnpm for building (most stable option)
FROM node:24-alpine AS base
# Use corepack to enable pnpm (avoids npm dependency)
RUN corepack enable && corepack prepare pnpm@11.1.3 --activate

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
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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
# next.config.ts resolves the canonical origin during `next build` and inlines it
# into the client bundle, so Coolify's injected vars must be visible as build
# args too — otherwise the COOLIFY_URL fallback only works server-side at
# runtime, and preview builds bake the production origin into the browser.
ARG COOLIFY_URL
ARG COOLIFY_FQDN

# Set environment variables for build
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
ENV TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
ENV COOLIFY_URL=${COOLIFY_URL}
ENV COOLIFY_FQDN=${COOLIFY_FQDN}
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

# Next's standalone server reads HOSTNAME (not the HOST variable Coolify
# injects), and defaults to localhost — which is unreachable from Coolify's
# Traefik proxy. Bind all interfaces explicitly.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

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

# Coolify infers the container port from EXPOSE when configuring Traefik.
EXPOSE 3000

# Reads PORT at runtime rather than hardcoding 3000: PORT is an overridable ENV,
# and probing a fixed port would mark a healthy container unhealthy — and send
# Coolify into a restart loop — the moment someone changes it.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run the application with Node.js
CMD ["node", "server.js"]
