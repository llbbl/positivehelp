# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm run dev

# Build for production
pnpm run build

# Run linting
pnpm run lint

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch
```

## Database Management (Drizzle + Turso)

```bash
# Generate new migration after schema changes
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Reset database to latest migration
pnpm run db:reset
```

## Project Architecture

**Positive.help** is a Next.js 15 application for sharing positive messages. The platform uses invite-only message submission with admin approval workflow.

### Key Technologies
- **Frontend**: Next.js 15 with React 19, Tailwind CSS, Radix UI components
- **Authentication**: Clerk (handles user registration and auth)
- **Database**: Turso (libSQL) with Drizzle ORM
- **Deployment**: Vercel

### Database Schema
- `messages`: Approved positive messages with slug-based URLs
- `submissions`: Pending messages awaiting admin approval 
- `authors`: Message attribution system
- `message_authors`: Many-to-many relationship between messages and authors

### Application Flow
1. **Submission**: Users submit messages via `/add` (requires Clerk auth)
2. **Moderation**: Admins review submissions at `/admin` and `/submissions`
3. **Approval**: Approved messages move from `submissions` to `messages` table
4. **Display**: Public messages accessible at `/msg/[slug]` without auth

### Key Directories
- `app/`: Next.js App Router pages and API routes
- `db/`: Drizzle schema and migrations 
- `lib/`: Core utilities (auth, database client, message handling)
- `components/`: Reusable UI components
- `utils/`: Text processing and sanitization utilities

### Environment Variables Required
```env
TURSO_DATABASE_URL="libsql://your-database-url"
TURSO_AUTH_TOKEN="your-auth-token"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
```

### Admin Features
- Review and approve/reject message submissions
- User management through Clerk integration
- Database operations require proper authentication tokens

### Message Processing
- Content sanitization via `utils/sanitize.ts`
- Slug generation for SEO-friendly URLs
- Author attribution system supports multiple authors per message