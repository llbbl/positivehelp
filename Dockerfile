# syntax=docker/dockerfile:1
# Use Node.js with pnpm for building (most stable option)
FROM node:24-alpine AS base
# Read the same package-manager pin used by development and CI.
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm/bin:$PATH"
WORKDIR /app
COPY package.json ./
# Use the native installer: older Corepack versions cannot launch pnpm 12.
# OpenSSL lets the installer verify npm signatures as well as checksums.
RUN apk add --no-cache curl openssl && \
    curl -fsSL https://get.pnpm.io/install.sh -o /tmp/install-pnpm.sh && \
    PNPM_VERSION="$(node -p 'require("./package.json").packageManager.slice(5)')" \
      ENV=/root/.shrc SHELL=/bin/sh sh /tmp/install-pnpm.sh && \
    rm -f /tmp/install-pnpm.sh

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

# Accept non-secret environment variables as build arguments. Credentials are
# provided only to the build command through BuildKit secret mounts below.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG TURSO_DATABASE_URL

# Set environment variables for build
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Some platforms pass build variables as BuildKit secrets; these optional mounts
# cover that, and plain builds fall back to ARG/ENV. Secret values do not key the
# layer cache, so rebuild without cache after changing one on an unchanged tree.
RUN --mount=type=secret,id=NEXT_PUBLIC_APP_URL \
    --mount=type=secret,id=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    --mount=type=secret,id=TURSO_DATABASE_URL \
    --mount=type=secret,id=CLERK_SECRET_KEY,env=CLERK_SECRET_KEY,required=true \
    --mount=type=secret,id=TURSO_AUTH_TOKEN,env=TURSO_AUTH_TOKEN,required=true \
    for name in NEXT_PUBLIC_APP_URL NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY TURSO_DATABASE_URL; do \
        secret_path="/run/secrets/${name}"; \
        if [ -f "${secret_path}" ]; then export "${name}=$(cat "${secret_path}")"; fi; \
    done && \
    pnpm run build

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

# Docker sets HOSTNAME to the container ID, which the standalone server would
# bind to, leaving the 127.0.0.1 healthcheck below unreachable.
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

EXPOSE 3000

# Reads PORT at runtime rather than hardcoding 3000: PORT is an overridable ENV,
# and probing a fixed port would mark a healthy container unhealthy and cause
# restart loops the moment someone changes it.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run the application with Node.js
CMD ["node", "server.js"]
