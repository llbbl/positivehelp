# positive.help

Positive.help is a place where people share positivity. Currently, the ability to add new messages is invite-only, and user registration and sign up are managed through Clerk. Our database is with Turso.

## Quick Start with Just

This project uses [Just](https://github.com/casey/just) as a command runner. Install it first:

```bash
# macOS
brew install just

# Linux (via cargo)
cargo install just

# Other options: https://github.com/casey/just#installation
```

Then run `just` to see all available commands:

```bash
just          # Show all available commands
just install  # Install dependencies
just dev      # Start development server
just test     # Run tests
just build    # Build for production
```

### Common Just Commands

| Command | Description |
|---------|-------------|
| `just install` | Install dependencies with pnpm |
| `just dev` | Start dev server with Turbopack |
| `just build` | Build for production |
| `just test` | Run tests |
| `just lint` | Run Next.js linter |
| `just format` | Format code with Biome |
| `just db-migrate` | Apply database migrations |
| `just docker-up` | Start Docker containers |
| `just ci` | Run full CI checks locally |

> **Note:** Just wraps existing pnpm scripts. You can still use `pnpm run <script>` directly.

## Running the Project Locally

### Prerequisites

- Node.js (version 18 or later)
- pnpm
- Turso database credentials (URL and authentication token)
- Clerk API keys (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)

### Setup Instructions

1.  Clone the repository:

```bash
git clone <repository_url>
cd positivehelp
```

2.  Install dependencies:

```bash
pnpm install
```

3.  Create a `.env` file in the root directory (you can use a provided `.env.example` as a reference if it exists) and add your environment variables for Turso and Clerk.  **Important:** Use `NEXT_PUBLIC_` prefix for Clerk's publishable key so it's available in the browser. For example:

```env
DATABASE_URL="libsql://<your-database-url>"
DATABASE_AUTH_TOKEN="<your-auth-token>"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```

4.  Start the development server:

```bash
pnpm run dev
```

5.  Run the unit tests to ensure everything is working properly:

```bash
pnpm run test
```

6.  Open your browser and visit http://localhost:3000 to view the application.

## Database Setup (Drizzle ORM with Turso)

This project uses Drizzle ORM for database management and is configured to work with a [Turso](https://turso.tech/) database.

### Prerequisites (for database management)

*   You should have a Turso database created and have the database URL and authentication token (already covered in the main setup).
*   We will be using the drizzle-kit CLI in the node_modules/.bin directory.

* Ensure `drizzle.config.ts` file is correctly configured.

### 1. Generating a New Migration

After modifying your Drizzle schema (e.g., `src/db/schema.ts`), generate a migration:

```bash
pnpm drizzle-kit generate
```

### 2. Applying Migrations

To apply the migrations to your database:

```bash
pnpm drizzle-kit migrate
```

### 3. Resetting the Database

To reset the database to the latest migration:

```bash
pnpm drizzle-kit reset
```

## GitHub Actions & CI/CD

This project uses GitHub Actions for automated testing and database migrations.

### Required GitHub Secrets

To enable automated database migrations in CI/CD, you must configure the following secrets in your GitHub repository:

**Navigate to:** Repository Settings → Secrets and variables → Actions → New repository secret

#### Production Secrets

These secrets are used when code is merged to the `main` branch:

- **`TURSO_DATABASE_URL_PROD`** - Production Turso database URL (e.g., `libsql://your-prod-database-url`)
- **`TURSO_AUTH_TOKEN_PROD`** - Production Turso authentication token

#### Staging Secrets

These secrets are used when pull requests are created for the `staging` branch:

- **`TURSO_DATABASE_URL_STAGING`** - Staging/non-production Turso database URL (e.g., `libsql://your-staging-database-url`)
- **`TURSO_AUTH_TOKEN_STAGING`** - Staging/non-production Turso authentication token

### Automated Migration Workflow

The `.github/workflows/migrate.yml` workflow automatically runs database migrations:

- **Production**: Triggers when code is pushed to `main` (after PR merge)
- **Staging**: Triggers when a PR is opened, updated, or reopened targeting the `staging` branch

Both workflows run `pnpm run db:migrate` with the appropriate environment credentials.


## Deployment (Coolify)

Production runs on a self-hosted [Coolify](https://coolify.io) instance, deployed
from the repository `Dockerfile` (build pack: **Dockerfile**), with Cloudflare in
front of Coolify's Traefik proxy.

### Environment variables

Set these on the Coolify application. Note the build/runtime split — Next inlines
`NEXT_PUBLIC_*` values into the client bundle at build time, so those **must be
marked as build variables** or the browser will receive stale or empty values.

| Variable | Build | Runtime | Notes |
|----------|:-----:|:-------:|-------|
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | `https://positive.help`. Pins the canonical origin. Set it explicitly on production rather than relying on the `COOLIFY_URL` fallback. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | ✅ | Inlined into the client bundle. |
| `CLERK_SECRET_KEY` | ✅ | ✅ | |
| `TURSO_DATABASE_URL` | ✅ | ✅ | |
| `TURSO_AUTH_TOKEN` | ✅ | ✅ | |
| `TRUSTED_PROXY_HOPS` | | ✅ | `2` for the Cloudflare → Coolify chain. See below. |

The `Dockerfile` already declares the matching `ARG`s, so Coolify passes build
variables through automatically.

> **The build requires a reachable Turso database.** `app/page.tsx` and the
> sitemap route are prerendered during `next build` and query the database, so
> `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` must be **build** variables pointing
> at a live database — runtime-only values are not enough. Verified empirically:
> building with placeholder credentials fails with
> `LibsqlError: SERVER_ERROR ... Export encountered an error on /page: /`.
> This is the most likely cause of a first-deploy failure on Coolify.

### Port and health

The image sets `HOSTNAME=0.0.0.0` explicitly — Next's standalone server reads
`HOSTNAME`, *not* the `HOST` variable Coolify injects, and defaults to
`localhost`, which Traefik cannot reach. `EXPOSE 3000` lets Coolify infer the
port. Point Coolify's healthcheck at `/api/health`, which matches the
`HEALTHCHECK` baked into the image.

### Client IP and rate limiting

`TRUSTED_PROXY_HOPS` tells the rate limiter how many rightmost `x-forwarded-for`
entries were added by proxies it trusts. Cloudflare and Traefik each add one, so
production uses `2`. Use `1` for a Coolify-only chain with no Cloudflare.

Get this wrong in either direction and it bites:

- **Too low** buckets every visitor together under a proxy IP — everyone shares
  one rate limit. Annoying, but fail-closed.
- **Too high** is a rate-limit bypass. The limiter reads an entry the client
  supplied, so rotating a forged `x-forwarded-for` header defeats every limit,
  including the 10/min cap on token creation.

> **`2` is only safe if the origin cannot be reached directly.** Coolify's
> Traefik is publicly routable by IP unless you firewall it. If an attacker
> reaches the origin directly with `Host: positive.help`, the chain is one hop
> short, index `length - 2` lands on their own forged entry, and every rate
> limit is bypassed. Restrict inbound 80/443 on the Coolify server to
> [Cloudflare's IP ranges](https://www.cloudflare.com/ips/) before relying on
> `2` — otherwise use `1`, which is safe either way.

### Preview deployments

Preview deployments use **single-level** hostnames — `<pr-id>-preview.positive.help`,
set in Coolify under Configuration → Preview Deployments as the template
`{{pr_id}}-preview.positive.help`.

The dash is deliberate and load-bearing. Cloudflare's free Universal SSL covers
only the apex and *first-level* subdomains (`positive.help` and
`*.positive.help`), so a dotted `pr-123.preview.positive.help` would be a
second-level subdomain with no edge certificate, failing TLS on every preview.
Covering that shape requires Total TLS or Advanced Certificate Manager, which
are paid. `pr-123-preview.positive.help` is first-level and already covered.

DNS is a single proxied wildcard: `A  *  →  <origin IP>`, orange-clouded.
Explicit records such as `clerk.positive.help` still take precedence over it.
Keeping previews proxied (rather than DNS-only) matters for more than TLS: it
keeps the origin IP unpublished so the origin can stay firewalled to
Cloudflare's ranges, and it keeps the proxy-hop count at 2 on previews, so
`TRUSTED_PROXY_HOPS` is correct there too.

The matching `https://*.positive.help` entry in the CSP is **not** what makes
Clerk work on a preview host, despite appearances. A preview page is its own
origin and is already covered by `'self'`, and Clerk's assets load from the
separately-allowlisted `*.clerk.com` / `*.clerk.accounts.dev`. The entry only
matters if a page ever loads a resource *from a different* subdomain. The
`*.up.railway.app` entries it replaced were no-ops for the same reason.
Changing the preview hostname therefore does not require a CSP edit.

### Database migrations

Migrations are **not** run by the container — `.github/workflows/migrate.yml`
applies them from CI, so this is unchanged by the hosting platform.
