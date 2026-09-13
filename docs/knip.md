# Knip dead-code policy

Knip is the blocking dead-code and unused-export check. Run it directly with:

```bash
pnpm knip
```

The command exits non-zero when it finds unused files, dependencies, or exports.
It also runs in GitHub Actions and as part of the canonical `just check` quality
gate.

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

`knip.json` explicitly enables the Next.js plugin and declares operational
TypeScript scripts as entry points so framework routes and maintenance scripts
are not mistaken for unused files. `ignoreExportsUsedInFile` suppresses exports
that are also used internally while continuing to report symbols with no local
references.

The initial baseline was manually reviewed before enforcement. In particular,
`verifyApiToken` is marked `@public` because the companion Go API depends on the
shared token-authentication contract even though no local TypeScript import can
demonstrate that relationship.
