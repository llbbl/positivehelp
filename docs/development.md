# Local development

## Requirements

- Node.js matching `package.json`: `^22.18.0 || ^24.11.0 || >=26.0.0`. CI tests Node 22 and
  24; `.node-version` selects Node 22 by default, and Docker uses Node 24.
- pnpm 12.8.1, pinned in `package.json`.
- A Clerk application and a development Turso database with a compatible schema.
  See [database setup](database.md) before using an empty database.

## Install

```bash
git clone https://github.com/llbbl/positivehelp.git
cd ./positivehelp
```

If you need pnpm, install the manifest's pinned version:

```bash
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION="$(node -p 'require("./package.json").packageManager.slice(5)')" sh -
```

Reload your shell as directed by the installer, then check `pnpm --version`
and install:

```bash
pnpm install --frozen-lockfile
```

The native installer avoids older Corepack versions that cannot launch pnpm 12.
See the [pnpm installation guide](https://pnpm.io/installation) for other options.

## Configure the application

Create `.env.local` in the project root using credentials for your own
development services:

```dotenv
TURSO_DATABASE_URL=libsql://your-development-database
TURSO_AUTH_TOKEN=your-development-turso-token
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the actual keys from your Clerk application and configure it for the local
origin. Only Clerk's publishable key belongs in a `NEXT_PUBLIC_` variable;
keep the secret key and database token private. Do not commit credentials.

Next.js and `drizzle.config.ts` load local environment files. The database
variable names are `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` throughout the app.

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Signed-in users can submit messages
for review. Admins can publish directly and manage submissions; admin access is
controlled by Clerk user public metadata `isAdmin` (`true` or `"true"`).

## Commands and checks

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server with Turbopack |
| `pnpm lint` | Biome lint checks |
| `pnpm typecheck` | TypeScript checks for the project |
| `pnpm test` | Vitest tests (one complete run) |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:coverage` | Vitest run with V8 coverage (text and LCOV) |
| `pnpm knip` | Unused files, dependencies, and exports |
| `pnpm build` | Production build; needs working Clerk and database configuration |
| `pnpm start` | Apply database migrations, then start the production server |

Before proposing a change, run lint, typecheck, tests, and Knip. Run a production
build for changes that affect rendering or deployment. See [CI](ci.md) for the
checks GitHub runs, and [Knip policy](knip.md) before removing reported code.

Vitest uses `vitest.config.mts` and `vitest.setup.ts`. Component tests run in
jsdom; server tests use `@vitest-environment node`. Import test functions and
mock helpers from `vitest`, and use `@testing-library/jest-dom/vitest` for DOM
matchers. The matcher package works with Vitest and does not require Jest.
jsdom stays on major 27 to support the Node versions in `package.json`.

Test observable behavior and failure boundaries. Use valid fixtures that reach
the intended guard, assert the particular refusal and absence of side effects,
and check that a focused defect makes the test fail. Avoid adding tests only to
increase counts or pin incidental classes and implementation details.

Next.js supports Vitest for unit tests and synchronous Server/Client Components.
Rendering async Server Components requires a different testing approach; see
the [Next.js Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest).

`pnpm start` and `pnpm vercel-build` apply migrations to the configured database.
Use `pnpm build` for build validation without applying migrations.

## Optional Just shortcuts

If [Just](https://github.com/casey/just) is installed, `just` lists available
recipes. Common shortcuts include `just install`, `just dev`, `just test`,
`just build`, `just lint`, and `just format` (which writes formatting changes).
`just ci` runs formatting checks, lint, Knip, tests, and build; it does not include
the separate project-wide `pnpm typecheck` check. Run that as well.

Next.js and Drizzle load `.env.local`, but Just's dotenv loader and Docker Compose
use `.env` by default. Export variables into the shell when invoking those tools
if they need them. With the variables exported, `docker compose up --build` builds
and runs the production image locally; use a development database, since the
build prerenders database-backed pages.

## Contributions

Use [GitHub issues](https://github.com/llbbl/positivehelp/issues) to discuss
meaningful changes and track their tasks. Keep pull requests focused and include
the checks you ran. Preserve the install-script decisions and security policies
in `pnpm-workspace.yaml` when changing dependencies.
