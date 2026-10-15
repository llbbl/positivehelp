# Database setup and migrations

The app uses Turso (libSQL) with Drizzle ORM. The schema is in
[`db/schema.ts`](../db/schema.ts); generated SQL and migration metadata live in
[`db/migrations/`](../db/migrations/). [`drizzle.config.ts`](../drizzle.config.ts)
selects the Turso dialect and loads environment variables through `@next/env`.

## Development database

Use a dedicated development database and token. Configure `TURSO_DATABASE_URL`
and `TURSO_AUTH_TOKEN` in `.env.local` as shown in the
[development guide](development.md). Check the target database before applying
migrations.

The migration history currently fails on a new, empty database: migration
`0003_normal_mystique.sql` references an `accounts.id` column that an earlier
migration does not create. This is tracked in
[issue #310](https://github.com/llbbl/positivehelp/issues/310). Until it is fixed,
use an existing development database with a compatible schema, or arrange a
development copy with the maintainer. The commands below describe the normal
workflow; they do not resolve that fresh-database limitation.

## Change the schema

Edit `db/schema.ts`, then generate a migration using the repository script:

```bash
pnpm db:generate
```

Review the generated SQL and metadata before applying it, especially table
rebuilds, column changes, and destructive statements. Include the schema and
generated migration files together in your change.

## Apply migrations

```bash
pnpm db:migrate
```

This writes to the database selected by your environment. Test schema changes on
a development database before production, and plan backups and recovery for
changes that affect existing data.

`pnpm start` and `pnpm vercel-build` also run `db:migrate`. The standalone Docker
server starts with `node server.js` and does not apply migrations at startup;
the [GitHub workflow](ci.md) handles production migrations separately.

## Resetting a development database

There is no verified reset or rollback procedure yet, and recreating a database
hits the fresh-database limitation above.
