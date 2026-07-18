# Knip reporting policy

Knip is configured as a report-only maintenance aid. Run it with:

```bash
pnpm knip
```

The command uses `--no-exit-code`, so findings do not fail CI or local quality
gates. Knip is intentionally not part of `just check`.

## Safety boundary

Knip analyzes this TypeScript project. It cannot discover consumers in other
repositories, services, languages, deployment configuration, or direct database
clients. Treat its output as evidence to investigate, not authorization to
delete code.

Before changing a reported file or export:

1. Check local imports, tests, framework conventions, and operational scripts.
2. Check known external consumers for HTTP, authentication, token, environment,
   response-payload, and database-schema contracts.
3. Preserve intentional TypeScript API exports with a documented `@public` tag.
4. Make removals manually in a focused change with normal review and tests.

Never run Knip with `--fix` or `--allow-remove-files` in this repository.

## Configuration

`knip.json` declares operational TypeScript scripts as entry points so they are
not mistaken for unused files. `ignoreExportsUsedInFile` suppresses exports that
are also used internally while continuing to report symbols with no local
references.

Any future CI enforcement belongs in a separate change after the baseline has
been reviewed and intentional contracts have been documented.
