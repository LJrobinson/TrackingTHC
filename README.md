# TrackingTHC

TrackingTHC is a cannabis retail operations prototype focused on package cost visibility, audit trails, reconciliation workflows, and compliance-adjacent data review.

The current demo shows how cannabis retail data can move from messy operational inputs into structured, reviewable artifacts that are easier for operators, finance teams, and technical teams to understand.

## MOBY Mission Control

TrackingTHC includes a static demo viewer for MOBY run manifests at:

```text
/moby-runs
```

MOBY Mission Control reads committed sample `moby-run-manifest.json` files and displays what each module ran, which artifacts it produced, and which warnings need review.

The current demo uses a fictional **Desert Bloom Retail - Las Vegas** scenario across four MOBY-compatible modules:

- `trackingthc-import-mapper` — normalizes messy POS/package exports
- `invoice-cost-spreader` — allocates invoice-level costs for COGS review
- `cannabis-approval-router` — routes operational approval requests with evidence warnings
- `cannabis-shift-handoff` — turns messy shift notes into structured follow-up items

The viewer is intentionally read-only and static for this slice. It does not use uploads, background jobs, API ingestion, or database persistence.

![MOBY Mission Control](./public/screenshots/moby-runs-mission-control.png)

## Static sample manifests

Sample MOBY run manifests live in:

```text
public/samples/moby-run-manifests/
```

Module display metadata lives in:

```text
public/samples/moby-module-registry.json
```

These files power the `/moby-runs` demo page without requiring database setup.

## MOBY-compatible module pattern

A MOBY-compatible module does useful work, writes its normal output artifact, and emits a `moby-run-manifest.json` receipt describing the run.

The pattern is intentionally boring:

1. Preserve existing behavior.
2. Add explicit artifact output mode when needed.
3. Write the module's normal result artifact unchanged.
4. Write `moby-run-manifest.json` next to it.
5. Keep module-specific business logic inside the module.
6. Use `moby-core` as the shared contract language.
7. Avoid surprise file output.
8. Test both old behavior and run-output behavior.

Current aligned modules:

| Module | Purpose | MOBY artifact behavior |
|---|---|---|
| `moby-core` | Shared TypeScript contracts | Defines run manifest, artifact, warning, source, summary, and workflow/domain types |
| `trackingthc-import-mapper` | Data normalization | Emits normalized import outputs and `moby-run-manifest.json` |
| `invoice-cost-spreader` | Cost allocation / COGS | Emits `spread-result.json` and `moby-run-manifest.json` |
| `cannabis-approval-router` | Approval decision routing | Emits `approval-result.json` and `moby-run-manifest.json` |
| `cannabis-shift-handoff` | Operational handoff memory | Emits handoff output and `moby-run-manifest.json` |

## Demo routes

| Route | Description |
|---|---|
| `/dashboard` | Main operational dashboard |
| `/moby-runs` | Static MOBY run manifest viewer / Mission Control |
| `/import-review` | Static import sidecar review page |
| `/inventory` | Inventory-oriented demo pages |
| `/products` | Product-oriented demo pages |
| `/sales` | Sales demo page |
| `/sync-status` | Sync status demo page |
| `/audit` | Audit trail demo page |

## Local development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Open MOBY Mission Control directly:

```text
http://localhost:3000/moby-runs
```

## Verification

Run the local checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Current scope

This project is a portfolio/demo prototype. The MOBY Mission Control page currently reads committed static sample files from `public/samples/`. It is not yet a production ingestion system.

Intentionally not included in this slice:

- Upload flows
- Background jobs
- API ingestion for run manifests
- Database persistence for MOBY runs
- Auth changes
- File-system scanning of generated run folders

## Roadmap

Near-term ideas:

- Keep improving the `/moby-runs` demo experience
- Add screenshots and demo notes for the MOBY workflow
- Create one generated end-to-end sample chain from real module outputs
- Add a lightweight module registry concept for richer module metadata
- Eventually evaluate database-backed MOBY run history after the static demo proves the workflow

## Why this exists

Cannabis retail operations generate messy data across POS exports, invoices, approvals, shift notes, compliance systems, and human workflows.

TrackingTHC explores a small, practical path toward making those workflows more visible, auditable, and explainable.

MOBY is the guide dog for the chaos: it does not replace the operator, but it leaves clean paw-print receipts for what happened.
