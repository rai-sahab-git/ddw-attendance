# DDW Attendance (A2Z)

Mobile-first PWA for employee attendance and salary management (Divine Digital Group).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Auth, Postgres, RLS)
- Employee PIN login (bcrypt-hashed) + Admin email/password (Supabase Auth)

## Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy env example and fill in Supabase credentials:

```bash
cp .env.example .env.local
```

3. Apply migrations in the Supabase SQL editor (start with [`migrations/v2-migration.sql`](migrations/v2-migration.sql) plus your base schema for `employees`, `attendance_records`, etc.).

4. Run the dev server:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Roles

- **Admin** — Supabase email/password; manages attendance, employees, salary, requests, settings
- **Employee** — Emp code + 4-digit PIN; views own attendance/salary and submits requests

## Security notes

- All `/api/admin/*` routes require an authenticated admin session (`requireAdminAuth`)
- Employee PINs are stored hashed (bcrypt); legacy plaintext PINs are re-hashed on next successful login
- Employee login is rate-limited (5 attempts / 15 minutes per IP + emp code)
- Never commit `.env.local` or the service role key

## PWA

- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Icons: `public/icon-192.png`, `public/icon-512.png`, `public/icon.svg`
