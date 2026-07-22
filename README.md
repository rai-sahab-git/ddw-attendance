# DDW Attendance (A2Z)

Mobile-first PWA for employee attendance and salary management (Divine Digital Group).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Auth, Postgres, RLS)
- Employee PIN login (bcrypt-hashed) + Admin email/password (Supabase Auth)

## Setup

1. Clone and install:

```bash
npm install
cp .env.example .env.local
```

2. Apply SQL migrations in Supabase (in order):

- [`migrations/v2-migration.sql`](migrations/v2-migration.sql) — attendance settings
- [`migrations/v3-multi-tenant.sql`](migrations/v3-multi-tenant.sql) — warehouses, team roles, preferences
- [`migrations/rls-harden.sql`](migrations/rls-harden.sql) — optional RLS tighten

3. Run:

```bash
npm run dev
```

## Features

- **Responsive shell** — bottom nav (mobile) / sidebar (desktop)
- **Appearance** — light / dark / system theme (`/admin/appearance`)
- **Organization** — multi-warehouse + admin roles (`/admin/organization`)
- **Reports** — custom Excel packs (`/admin/reports`)
- **Permissions** — super_admin / admin / manager / viewer (see `src/lib/permissions.ts`)
- Instant route prefetch for admin tabs

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Start production |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

## Roles

| Role | Access |
|------|--------|
| super_admin | All warehouses + org management |
| admin / owner | Full warehouse ops |
| manager | Attendance, requests, view salary |
| viewer | Read-only + reports export |
| employee | Employee portal (PIN) |

## Security

- `/api/admin/*` requires auth + permission checks
- PINs hashed with bcrypt; rate-limited login
- Never commit `.env.local` or service role key
