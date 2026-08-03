# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MediMeet — a Next.js 15 (App Router) doctor-appointment booking platform. Auth via Clerk, data via Prisma/PostgreSQL (Neon). Patients book video consultations with doctors using a credit system; doctors are verified by admins before they can accept appointments.

## Commands

```bash
npm run dev      # start dev server (Turbopack), http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (flat config, extends next/core-web-vitals)
```

There is no test suite/runner configured in this repo.

Prisma (schema at `prisma/schema.prisma`, datasource is `DATABASE_URL` in `.env`):

```bash
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma generate                    # regenerate the client after schema changes
npx prisma studio                      # browse the DB
```

## Architecture

**Route groups.** `src/app/(auth)` holds Clerk sign-in/sign-up pages under a plain layout; `src/app/(main)` holds the authenticated app (doctors list, onboarding, etc.) wrapped in a centered container layout. Route protection is NOT done per-page — it's centralized in `src/middleware.js`, which uses `clerkMiddleware` + `createRouteMatcher` to gate `/doctors`, `/onboarding`, `/doctor`, `/admin`, `/video-call`, and `/appointments`; unauthenticated users are redirected to sign-in.

**Server actions live at the repo root, not under `src/`.** The `actions/` directory (`actions/admin.js`, `actions/credits.js`, `actions/onboarding.js`) sits next to `package.json`. Code imports it with the bare specifier `actions/...` (e.g. `import { getCurrentUser } from "actions/onboarding"`), which resolves because `jsconfig.json` sets `baseUrl: "."` — only `@/*` (→ `src/*`) is an explicit alias, but the root `baseUrl` makes `actions/*` resolvable too. When adding new server actions, put them in this root `actions/` folder to match the existing convention, and start each file with `"use server"`.

**User lifecycle / role model.** `User.role` is one of `UNASSIGNED | PATIENT | DOCTOR | ADMIN` (see `prisma/schema.prisma`). Flow:
1. `src/lib/checkUser.js` runs on every render of `Header` (`src/components/header.jsx`). It looks up the Clerk `currentUser()` in the DB by `clerkUserId`; if missing, it JIT-provisions a `User` row and grants 2 free credits via a `CreditTransaction`.
2. New users (`UNASSIGNED`) are routed to `/onboarding` (`actions/onboarding.js#setUserRoles`), where they choose PATIENT (immediate) or DOCTOR (requires `specialty`/`experience`/`credentialUrl`/`description`, validated by the shared zod schema in `src/lib/schema.js`, then set to `verificationStatus: PENDING`).
3. Admins verify/reject/suspend doctors via `actions/admin.js` (`verifyAdmin`, `getPendingDoctors`, `updateDoctorStatus`, `updateDoctorActiveStatus`) — every admin action re-checks `verifyAdmin()` server-side rather than trusting client role state.
4. `src/app/(main)/onboarding/layout.js` redirects already-onboarded users away from `/onboarding` based on role + verification status.

**Credits.** Patients get monthly credits based on their Clerk Billing plan (`free_user`/`standard`/`premium`, mapped to credit counts in `actions/credits.js`). `checkAndAllocateCredits(user)` is called from `Header` on every request for `role === PATIENT`; it de-dupes by checking whether a `CREDIT_PURCHASE` transaction already exists for the current plan+month before writing a new `CreditTransaction` and incrementing `User.credits` (wrapped in `db.$transaction`). Appointments cost `APPOINTMENT_CREDIT_COST` (2) credits. Doctor payouts (`Payout` model: platform fee $2/credit, doctor nets $8/credit) exist in the schema but have no action/UI implementation yet.

**Data model** (`prisma/schema.prisma`): `User` (unified table for patients/doctors/admins, distinguished by `role`), `Availability` (doctor-defined open slots, `SlotStatus`), `Appointment` (links a patient + doctor, has `videoSessionId`/`videoSessionToken` fields reserved for Vonage Video API — not yet wired up), `CreditTransaction`, `Payout`.

**Client data fetching from server actions.** `src/app/hooks/useFetch.js` is the standard wrapper for calling a server action from a client component: it tracks `loading`/`error`/`data`, and on error calls `toast.error(error.message)` via `sonner`. New client-side calls into `actions/*` should go through this hook rather than ad hoc `useState`/`try-catch`.

**UI components.** `src/components/ui/*` are shadcn/ui components (style: "new-york", see `components.json`); base color is neutral, icons from `lucide-react`. Prefer extending/composing these over adding new UI primitives. Static marketing copy (features/testimonials/pricing blurbs) lives in `src/lib/data.js`; the specialty list for doctor onboarding/search lives in `src/lib/specialities.js`.

**Path aliases:** `@/*` → `src/*` (jsconfig.json). Files are `.jsx`/`.js`, not TypeScript, despite `next-env.d.ts` being present.

## Notes on repo state

- `.env` contains live Clerk test keys and a Neon Postgres connection string checked into the working tree (it's gitignored, but treat these as real credentials — don't print or log them).
- `getVerifiedDoctors` in `actions/admin.js` currently filters on `verificationStatus: "PENDING"` (likely should be `"VERIFIED"`) — be aware if working in that area.
