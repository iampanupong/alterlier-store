# Nord Alterlier

Next.js (App Router) + TypeScript + Tailwind CSS, with Better Auth, Drizzle ORM and Neon Postgres.

## Setup

```bash
pnpm install
cp .env.example .env    # fill in DATABASE_URL and BETTER_AUTH_SECRET
pnpm auth:generate      # writes Better Auth tables to src/db/schema.ts
pnpm db:generate && pnpm db:migrate
pnpm dev
```

## Structure

```
src/
  app/api/auth/[...all]/route.ts  Better Auth route handler
  db/index.ts                     Drizzle client (Neon HTTP driver)
  db/schema.ts                    Drizzle schema
  lib/auth.ts                     Better Auth server config
  lib/auth-client.ts              Better Auth React client
drizzle.config.ts                 drizzle-kit config (migrations → ./drizzle)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `db:generate` / `db:migrate` / `db:push` / `db:studio` | drizzle-kit |
| `auth:generate` | Generate the Better Auth Drizzle schema |
