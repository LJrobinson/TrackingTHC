# TrackingTHC

TrackingTHC is a portfolio-ready cannabis retail operations prototype focused on the core compliance loop: product catalog management, inventory packages, quantity adjustments, audit logging, and fake Metrc sync workflows.

The project is intentionally scoped like an early SaaS foundation rather than a toy POS. It keeps compliance-sensitive logic server-side, models operational records with Prisma/PostgreSQL, and uses a fake Metrc adapter to demonstrate integration boundaries without touching real Metrc credentials or real cannabis compliance systems.

## Portfolio Summary

Cannabis retailers need inventory workflows that are easy for operators to use and structured enough for state compliance. TrackingTHC solves the first slice of that problem: it connects product records to inventory packages, lets staff adjust package quantities with before/after history, and records audit events for operational accountability.

Metrc-ready architecture matters because cannabis systems cannot treat compliance sync as a frontend convenience. TrackingTHC isolates adapter logic in server-only modules, queues sync jobs, records success/failure state, and keeps the UI focused on operational clarity.

The fake Metrc adapter demonstrates how the app would integrate with a regulated external system while remaining safe for a public portfolio project. It supports health checks, package adjustment simulation, sync job processing, and controlled failure simulation without making real Metrc Connect calls.

Audit logging matters because inventory changes need traceability. Product edits, package changes, adjustments, and fake sync results are written to the audit trail with sensitive data redaction patterns in place.

What I would build next: real authentication and authorization, background worker processing for sync jobs, stronger reconciliation workflows, test coverage around server actions, and eventually a real Metrc Connect adapter behind the existing server-side interface.

## Features

- Product CRUD with category, SKU, unit, price, and active/archive status.
- Inventory package CRUD with labels, quantities, package status, source, dates, and sync status.
- Inventory adjustment flow with required reasons, before/after quantities, negative inventory prevention, and audit logging.
- Package detail/history view for adjustments, fake sync jobs, and related audit events.
- Fake Metrc sync queue with pending/running/succeeded/failed status visibility.
- Manual fake sync processing and failure simulation for demo purposes.
- Audit log page with filters and safe metadata summaries.
- Dashboard KPIs for active products, package health, sync failures, recent adjustments, and recent audit activity.
- Role-aware UI placeholders and server-side permission checks for future real auth.

## Tech Stack

- Next.js App Router
- React
- TypeScript strict mode
- PostgreSQL
- Prisma
- Tailwind CSS
- Server Actions
- Server-only fake Metrc adapter

## Local Setup

Install dependencies:

```powershell
npm install
```

Create a local `.env` from `.env.example` and set `DATABASE_URL` for your PostgreSQL database.

Generate Prisma client:

```powershell
npm run prisma:generate
```

Run migrations:

```powershell
npm run prisma:migrate -- --name init
```

Seed demo data:

```powershell
npm run prisma:seed
```

Start the app:

```powershell
npm run dev
```

Local URL:

```text
http://localhost:3000
```

## Environment Variables

`.env.example` contains fake placeholder values only.

Required locally:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXT_PUBLIC_APP_URL`: local app URL.
- `METRC_ADAPTER_MODE`: keep as `fake`.
- `METRC_INTEGRATOR_API_KEY`: fake placeholder only.
- `CREDENTIAL_ENCRYPTION_KEY`: fake placeholder until real credential storage exists.

## Fake Metrc Adapter

TrackingTHC does not implement real Metrc Connect calls. All Metrc-related behavior runs through `src/server/metrc` and the fake adapter. The fake adapter is used to demonstrate:

- Server-side integration boundaries.
- Sync job creation and processing.
- Package sync success/failure states.
- Failure handling and audit events.
- Future adapter replacement without rewriting the UI.

## Security Notes

- No real Metrc credentials are used or stored.
- Metrc logic is server-side only.
- Credentials must never be placed in frontend code, browser storage, public environment variables, screenshots, or logs.
- Audit metadata summaries avoid exposing sensitive payloads.
- The current auth layer is stubbed for local demo use.

## Current Limitations

- No real authentication provider.
- No real Metrc Connect integration.
- No background worker for sync processing.
- No customer, patient, loyalty, or payment workflows.
- No production deployment configuration yet.
- Limited automated test coverage.

## Future Roadmap

- Replace stubbed auth with real user/session management.
- Add a worker process for queued sync jobs.
- Add real Metrc Connect adapter behind the existing interface.
- Add reconciliation workflows for conflicts.
- Add focused tests for server actions, permissions, and sync behavior.
- Add deployment hardening, observability, and backup strategy.

## Suggested Screenshots

- Dashboard
- Inventory list
- Package detail/history
- Sync status
- Audit log

## Deployment Preview Notes

A likely deployment path:

- Vercel for the Next.js app.
- Managed Postgres provider such as Neon or Supabase.
- Server-side environment variables for database and fake/real adapter configuration.
- Future worker process for real Metrc sync job execution.
- No real Metrc credentials in frontend bundles or public environment variables.

## Verification

```powershell
npm run typecheck
npm run lint
npm run build
```
