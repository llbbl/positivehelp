# positive.help

Positive.help is a place where people share positivity. Currently, the ability to add new messages is invite-only, and user registration and sign up are managed through Clerk. Our database is with Turso.

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

