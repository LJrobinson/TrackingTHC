# TrackingTHC

TrackingTHC is a clean rebuild of a cannabis POS and inventory tracking prototype. The goal is a portfolio-worthy, compliance-aware system that is small enough to build solo but structured like a serious multi-facility SaaS product.

## Stack

- Next.js App Router
- TypeScript strict mode
- PostgreSQL
- Prisma
- Tailwind CSS
- Server-side Metrc adapter interface
- Fake Metrc adapter before any real Metrc Connect calls

## Security Posture

- No legacy PHP files or credentials are used.
- Metrc logic belongs in `src/server/metrc`.
- Metrc credentials must never be exposed in frontend code, local storage, public env vars, browser bundles, screenshots, or logs.
- `.env.example` contains fake placeholders only.
- Audit logging is part of the foundation, not a later feature.

## First Local Setup

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Expected local URL:

```text
http://localhost:3000
```

## Current Scope

This foundation includes the database model, demo seed data, central audit service, Metrc adapter interface, fake Metrc adapter, and placeholder operational pages. Full CRUD, real auth, real Metrc Connect integration, and production deployment are intentionally not implemented yet.
