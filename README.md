# Medzen Pharmacy — website & admin dashboard

Production-grade platform for Medzen Pharmacy (Showroom S1, Ramool New Building,
Nad Al Hamr Road, Umm Ramool, Dubai). Two applications in one Next.js codebase:

- **Customer website** — catalog, secure prescription upload, order requests,
  WhatsApp-first contact.
- **Staff dashboard** at `/admin` — prescriptions, orders, inventory, catalog,
  customers, content and settings, behind session auth and granular RBAC.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS v4 · PostgreSQL ·
Prisma · Radix primitives · Recharts · Zod.

## Getting started

```bash
npm install
```

Copy the environment template and fill it in:

```bash
cp .env.example .env
```

Two values must be set before anything runs:

| Variable | What it needs |
| --- | --- |
| `DATABASE_URL` | A reachable PostgreSQL database |
| `AUTH_SECRET` | 32+ random characters — `openssl rand -base64 48` |

A local database with Docker:

```bash
docker run --name medzen-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=medzen -p 5432:5432 -d postgres:16
```

Create the schema and load demo data:

```bash
npm run db:push
npm run db:seed
```

The seed prints a one-time admin password for `admin@medzen.local` unless you set
`SEED_ADMIN_PASSWORD` yourself. Then:

```bash
npm run dev
```

Website at http://localhost:3000, dashboard at http://localhost:3000/admin.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (needs a reachable `DATABASE_URL`) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync the schema without a migration |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Load demo data |
| `npx tsx prisma/seed.ts --clean` | Remove every demo record |

> The build prerenders the marketing pages, so `DATABASE_URL` must be reachable
> from the build environment. On Vercel, point it at your hosted Postgres.

## Removing demo data before launch

Everything the seed creates is flagged `isDemo`. One command removes all of it
and leaves real records untouched:

```bash
npx tsx prisma/seed.ts --clean
```

The seed deliberately creates **no testimonials** — the homepage testimonial
section stays hidden until the pharmacy enters genuine reviews — and **no
prescription files**, only request metadata.

## How prescriptions are protected

This is the part of the system that matters most, so the guarantees are explicit:

- Uploads are written to a **private storage prefix** under a key containing 24
  random bytes. Nothing derives that key from a request id.
- `/api/media/[...key]` — the public media route — **refuses** any key outside
  the `public/` prefix, so it cannot serve a prescription even if a key leaks.
- The only reader is `/api/admin/prescriptions/files/[fileId]`, which requires a
  valid session **and** the `prescriptions.download` permission, takes a database
  file id rather than a storage key, and re-checks the prefix before responding.
- Every view and download writes an audit entry naming the staff member.
- Responses are `no-store`, `noindex`, and served under a `sandbox` CSP.
- Admin list and detail endpoints project metadata only — storage keys are never
  serialised into a page payload or an API response.
- Uploads are validated by **magic number**, not by the declared Content-Type or
  file extension, and polyglot files with HTML/script headers are rejected.

## Roles

| Role | Scope |
| --- | --- |
| Super admin | Everything, including staff and settings |
| Pharmacy admin | Catalog, inventory, orders, prescriptions, customers, content |
| Pharmacist / staff | Prescriptions, orders, customers, messages |
| Content manager | Website content, banners, services, FAQs, testimonials |

Roles are a baseline only. Every check in the codebase tests a **permission**
string (`products.write`, `prescriptions.download`, …), and individual accounts
can be granted extras on top of their role from Admin → Staff.

## Configuration, not hardcoding

Business content lives in a single validated settings document edited at
Admin → Settings: pharmacy name, address, phone, **WhatsApp number**, opening
hours, homepage hero, announcement bar, about copy, social links, SEO metadata,
delivery fees and notification channels.

Every WhatsApp link in the app is produced by `src/lib/whatsapp.ts` from that
configured number plus an intent. No component builds a `wa.me` URL and no phone
number appears in JSX — changing the number in Settings changes every button.

## Project layout

```
prisma/schema.prisma          Data model (23 models, UUIDs, soft deletes, indexes)
prisma/seed.ts                Demo data, all flagged isDemo
src/app/(site)/               Customer website
src/app/admin/(dashboard)/    Staff dashboard (auth gate in the layout)
src/app/api/                  Public REST endpoints
src/app/api/admin/            Authorised REST endpoints
src/lib/auth.ts               Staff sessions (JWT cookie), password hashing, lockout
src/lib/rbac.ts               Permissions and role baselines
src/lib/storage.ts            Public/private storage, upload validation, Cloudinary and local drivers
src/lib/jwt.ts                JWT issue/verify for four audiences (admin, order status, customer, API)
src/lib/customer-auth.ts      Customer magic-link + remember-me cookie session
src/lib/api-auth.ts           Staff API bearer tokens: issue, revoke, requireApiUser
src/lib/admin-crud.ts         Shared CRUD factory (auth + audit applied centrally)
src/lib/queries.ts            Public read layer — published rows, public fields only
src/lib/settings.ts           The settings schema and defaults
src/middleware.ts             Edge cookie gate for /admin
```

## Security summary

Secure headers and a strict CSP (`next.config.ts`) · HTTP-only, SameSite session
cookies with server-side revocation · bcrypt at cost 12 · account lockout after 5
failed sign-ins · rate limiting on every unauthenticated write · Zod validation on
every request body · honeypot fields on public forms · audit logging with
redaction of sensitive keys · sanitised error responses that never leak Prisma or
schema detail · order prices always re-read from the database, never trusted from
the client.

## What is deliberately not built

Per the healthcare rules for this project, the platform does **not** diagnose,
recommend prescription medicines, or make any clinical decision automatically.
Prescription requests are routed to a pharmacist, and every regulated product
page carries the UAE dispensing notice.

Online card payments are **off**. The site takes order *requests*; the pharmacy
confirms stock and total before anything is prepared. The settings toggle exists
but should only be enabled once a payment provider is integrated and tested.

## Deployment

- **Frontend/API** — Vercel (or any Node host). Set every variable from
  `.env.example`.
- **Database** — managed PostgreSQL (Neon, Supabase, RDS).
- **Storage** — set `STORAGE_DRIVER=cloudinary` plus the `CLOUDINARY_*`
  variables (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, optional `CLOUDINARY_FOLDER`). Catalog images
  are uploaded as default public assets, but the app never exposes a raw
  Cloudinary URL — every read still passes through `/api/media/[...key]`.
  Prescription uploads are stored as `type: "private"`, so they have no
  publicly addressable URL at all; reads are served from a signed,
  short-lived download URL minted server-side, and only via
  `/api/admin/prescriptions/files/[fileId]` after a session + permission
  check.
- Set `NEXT_PUBLIC_SITE_URL` to the real origin so canonical URLs, OpenGraph
  tags and the sitemap are correct.
- On a staging deployment, turn off *Let search engines index this site* in
  Admin → Settings → SEO; `robots.ts` will then disallow everything.
