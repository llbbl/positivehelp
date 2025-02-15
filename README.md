# positive.help

Positive.help is a place where people share positivity. Currently, the ability to add new messages is invite-only, and user registration and sign up are managed through Clerk. Our database is with Turso.

## Running the Project Locally

### Prerequisites

- Node.js (version 18 or later)
- pnpm
- Turso database credentials
- Clerk API keys (e.g., CLERK_API_KEY, CLERK_FRONTEND_API)

### Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd positivehelp
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory (you can use a provided `.env.example` as a reference if it exists) and add your environment variables for Turso and Clerk. For example:

   ```env
   TURSO_DB_URL=your_turso_db_url
   CLERK_API_KEY=your_clerk_api_key
   CLERK_FRONTEND_API=your_clerk_frontend_api
   ```

4. Start the development server:

   ```bash
   pnpm run dev
   ```

5. Run the unit tests to ensure everything is working properly:

   ```bash
   pnpm run test
   ```

6. Open your browser and visit http://localhost:3000 to view the application.

### Note

Enjoy building a positive community with Positive.help!

