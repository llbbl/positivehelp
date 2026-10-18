# Export published messages

Create a read-only snapshot of the published message collection for content
review or duplicate checking:

```sh
mkdir -p ./_/message-corpus
pnpm exec tsx ./scripts/message-corpus.ts --output ./_/message-corpus/published.json
```

The default reads the public website without credentials. The JSON contains
message IDs, text, slugs and dates, plus a capture timestamp, source, count,
completeness basis and SHA-256 digest. Existing output files are never overwritten;
choose a new path for each snapshot. Files under `_/` stay local and ignored.

## Completeness

The [public API](message-api.md) returns at most 100 messages. Under its current
unfiltered endpoint contract, a response below that cap contains the complete
collection. At the cap, the exporter fails because completeness is unknown,
even if the true collection contains exactly 100 messages. The incremental
cursor cannot bootstrap the entire published history.

For larger collections, verify that the existing Turso configuration points to
the intended website database, then explicitly select database mode:

```sh
pnpm exec tsx ./scripts/message-corpus.ts --output ./_/message-corpus/published.json --database
```

Database mode loads existing environment configuration with `@next/env` and
selects all published messages in a read transaction. It does not load application
startup, run migrations, or export user identifiers or tokens. Driver errors and
credentials are not included in output.

## Scope

The snapshot covers only the published `messages` collection. Pending submissions
and companion-app ranking candidates are separate and are not exported. Refresh
the snapshot before a later publication decision; the capture timestamp is not
a guarantee that the collection has remained unchanged.
