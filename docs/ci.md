# GitHub Actions

## Quality checks

[`test.yml`](../.github/workflows/test.yml) runs on pull requests targeting `main`
and pushes to `main`. Separate jobs run:

- `pnpm run lint` (Biome).
- `pnpm run typecheck` (TypeScript).
- `pnpm run knip` (unused files, dependencies, and exports).
- `pnpm run test` (Vitest), on Node 22.x and 24.x with fail-fast disabled.

Production builds and formatting checks are not jobs in this workflow. See
[development](development.md) for local checks and build requirements.

## Package manager and install policy

All quality and migration jobs use `pnpm/setup@v3`. It reads pnpm 12.8.1 from
`package.json`, chooses Node from `.node-version` unless the test matrix supplies
the runtime, caches the pnpm store using `pnpm-lock.yaml`, and installs with
`require-lockfile: true` for frozen-lockfile behavior.

When changing dependencies, regenerate the lockfile with the pinned pnpm version
and verify a frozen install. Preserve `pnpm-workspace.yaml` policies:

- A 24-hour minimum release age.
- Blocking exotic transitive dependencies.
- Explicit `allowBuilds` decisions and strict dependency-build checks.
- Dependency verification before scripts run and security overrides.

An unreviewed install script can fail CI during installation. Review its behavior
before adding an allow or deny entry; do not disable the checks to make a job pass.

## Database migrations

[`migrate.yml`](../.github/workflows/migrate.yml) applies migrations independently
of the quality checks. Configure these repository secrets under **Settings →
Secrets and variables → Actions**:

| Target | Trigger | Required secrets |
| --- | --- | --- |
| Production | Push to `main` | `TURSO_DATABASE_URL_PROD`, `TURSO_AUTH_TOKEN_PROD` |
| Staging | PR opened, updated, or reopened targeting `staging` | `TURSO_DATABASE_URL_STAGING`, `TURSO_AUTH_TOKEN_STAGING` |

Each job maps its secrets to `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, then runs
`pnpm run db:migrate`. These jobs write to their configured databases. A successful
quality check does not verify that migration credentials or SQL will succeed.
See [database guidance](database.md) for the known fresh-database issue.
