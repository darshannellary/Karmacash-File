# Supabase database plan

This is the agreed plan for moving Karmacash's state into Postgres on Supabase (project `pdnphcwsmoamylbrljki`). It's written for whoever picks it up next, person or Claude Code session.

## Why
Three of the before-live items need a database:
- Application state lives in a signed browser cookie, so an old cookie can be replayed to re-roll a decision, and the 90-day wait after a decline isn't enforced.
- Loan IDs come from `Date.now()`, so two loans signed in the same millisecond collide.
- The OTP limits (`src/lib/rate-limit.ts`) only have an in-memory store, so live mode refuses to run.

## Before writing any code
1. **Region.** In the Supabase dashboard, check **Project Settings → General**. The region should be **South Asia (Mumbai)**, because the privacy page promises data stays in India. A project's region can't be changed later.
2. **Connection string.** In the dashboard, click **Connect** and copy the **Transaction pooler** string (port 6543). Replace `[YOUR-PASSWORD]` with the database password. A password of only letters and digits avoids URL-encoding problems.
3. Put it in `.env.local` as `DATABASE_URL=…`. `.gitignore` already covers `.env*`. Never commit it or paste it anywhere.
4. **Check the connection** with `select 1` through `DATABASE_URL` before going further.

The publishable key (`sb_publishable_…`) is **not used**. Nothing in the browser talks to Supabase; only the server connects, through `DATABASE_URL`.

## Approach
- **Driver:** [`postgres`](https://github.com/porsager/postgres), server-only, with `prepare: false`, which the transaction pooler needs. Don't add `supabase-js`, because there's no browser-side data access and no Supabase Auth.
- **Lockdown:** turn on **row-level security on every table, with no policies**. Supabase's public API keys then can't read borrower data, while the server's `postgres` role is unaffected.

### Schema: `supabase/migrations/20261012000000_init.sql`
- **`applications`:** `id uuid primary key default gen_random_uuid()`, `phone text not null`, `state jsonb not null`, `created_at`, `updated_at`, `closed_at timestamptz null`.
  - Add a partial unique index on `phone where closed_at is null`, so each phone has at most one open application.
  - `state` keeps the existing `ApplicationState` shape (`src/lib/application.ts`), so `currentStep` and the step guards don't change.
- **`decisions`:** `id`, `application_id` (fk), `phone`, `decision`, `band`, `credit_limit`, `reasons text[]`, `policy_version`, `data_set`, `decided_at`. Index it on `(phone, decided_at desc)`. It's both an audit trail and the source for the reapply check.
- **`loans`:** `id text primary key default 'KC' || lpad(nextval('loan_no')::text, 8, '0')`, `application_id unique` (fk), `phone`, `amount`, `months`, `rate_pct`, `signed_at`, `status` (`active` | `exited_cooling_off`).
- **`otp_counters`:** `key text primary key`, `count int`, `expires_at timestamptz`.

### Code
- **New `src/lib/db.ts`:** a lazy `sql()` singleton that reads `DATABASE_URL`, throws a clear error if it's missing, and is kept on `globalThis` for dev reloads.
- **`src/lib/session.ts`:**
  - The cookie (`kc_session`) holds only the HMAC-signed application id. Reuse the existing `sign`/`timingSafeEqual` code.
  - `readState()` loads the open application by that id.
  - `writeState(state)` creates or updates the row.
  - Add `startApplication(phone)`, which closes any previous application for the phone and creates a new one.
  - `clearState()` drops the cookie.
- **`src/app/apply/actions.ts`:**
  - `sendOtp` starts an application for the phone.
  - `confirmOtp` resumes the phone's existing open application if there is one. Borrowers can then continue on another device, and a second application can't be opened.
  - `giveConsentAndDecide` also inserts a `decisions` row.
  - `startOver` closes the current application and opens a new one. In **live** mode it's refused while the phone has a decline under 90 days old (`reapplyDate`). In sandbox it stays allowed so testers can re-run, and the page says when live mode would allow it.
  - `signAgreement` inserts the loan and saves its database id in one transaction.
  - `exitDuringCoolingOff` sets the loan to `exited_cooling_off`.
- **`src/lib/rate-limit.ts`:**
  - Add `PostgresStore implements CounterStore`. `hit` is one atomic upsert that resets `count` and `expires_at` once the window has passed, using `RETURNING`.
  - `counterStore()` uses Postgres whenever `DATABASE_URL` is set, and falls back to memory only in sandbox without it.
- **Migrations:** add `npm run db:migrate` (`scripts/migrate.mjs`). It applies `supabase/migrations/*.sql` in order and records each one in `schema_migrations`.
- **Config:** add `.env.example` with `DATABASE_URL` and `SESSION_SECRET`. Live mode needs both, and test mode needs `DATABASE_URL`.

## Tests
- **Unit:** the existing unit tests stay pure. Run them with `npx vitest run`.
- **Integration (`*.db.test.ts`):** these run only when `TEST_DATABASE_URL` is set, so the default run stays green without a database. They cover:
  - the same counter tests against `MemoryStore` and `PostgresStore`
  - application create, read, update and resume-by-phone, including the one-open-per-phone rule
  - loan IDs being unique and sequential
  - the reapply query finding a recent decline
  - RLS: the `anon` role can't select from any table
- **End to end:** with `npm run build && npm start`, walk the sandbox flow to `/account`. Then check that:
  - the loan row has a `KC…` id
  - replaying an old cookie shows the current state
  - signing in with the same phone in a second browser resumes the application
  - the OTP limits still trigger

## When deploying
Set the same `DATABASE_URL`, plus a strong `SESSION_SECRET`, on the hosting provider.
