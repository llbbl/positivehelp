# Coolify deployment

Positive.help deploys from the repository `Dockerfile` with Coolify's Dockerfile
build pack. The Next.js build prerenders database-backed pages, so Clerk and
Turso credentials must be available during both the image build and at runtime.

## Environment variables

Configure these application variables in Coolify with both **Build Variable**
and **Runtime Variable** enabled:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

`COOLIFY_URL` and `COOLIFY_FQDN` are provided by Coolify automatically. The
explicit `NEXT_PUBLIC_APP_URL` is preferred and is inlined into the client bundle
during `next build`.

Enable **Use Docker Build Secrets** in the application's environment-variable
settings. Coolify then passes build variables with BuildKit's `--secret` transport
instead of `--build-arg`. The Dockerfile exposes them only to the `pnpm run build`
step; `CLERK_SECRET_KEY` and `TURSO_AUTH_TOKEN` are never declared as `ARG` or
persisted as `ENV` values.

BuildKit is required. If a deployment log says Coolify is falling back to
traditional build arguments, update or enable BuildKit on the build server before
deploying. The build intentionally fails when either credential secret is absent.

Variables that the build does not read should be runtime-only. In particular, do
not make source-provider credentials such as `GITHUB_SECRET` build variables.

## Local Docker builds

`docker compose build` reads the non-secret build arguments and the two build
secrets from the shell environment (or a local `.env` file):

```bash
docker compose build
```

For a direct build, pass public configuration as build arguments and credentials
as secrets. Never pass the credentials with `--build-arg`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  --build-arg TURSO_DATABASE_URL="$TURSO_DATABASE_URL" \
  --secret id=CLERK_SECRET_KEY,env=CLERK_SECRET_KEY \
  --secret id=TURSO_AUTH_TOKEN,env=TURSO_AUTH_TOKEN \
  -t positivehelp:local .
```

The secret values are available only while the build command runs and are not
stored in the resulting image configuration or layer history.
