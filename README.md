# TrackingTHC

TrackingTHC is a cannabis operations app shell for exploring import review, audit, and reconciliation workflows. It is not a full point-of-sale system, and it is not production SaaS yet.

The current MOBY demo surfaces are a static JSON Sidecar Viewer at `/import-review` and a static MOBY Run History viewer at `/moby-runs`. They consume committed sample JSON artifacts and turn the MOBY handoff into visible review workflows.

## Current Feature

### `/moby-runs` MOBY Run History Viewer

The MOBY Run History viewer loads committed sample `moby-run-manifest.json` files from:

```text
public/samples/moby-run-manifests/
```

It also loads static demo module metadata from:

```text
public/samples/moby-module-registry.json
```

Local route:

```text
http://localhost:3000/moby-runs
```

The viewer displays:

- Run metadata: `runId`, `runType`, `generatedBy`, `status`, and `generatedAt`.
- Summary counts: total runs, module count, warning count, and artifact count.
- Source info: system, source file name, source path, and received timestamp.
- Artifacts: label, role, format, path, and artifact ID.
- Warnings: severity, code, field, row number, linked artifact, and message.
- Compact metadata for the selected run.
- Friendly module labels, categories, descriptions, and business purpose when a module is listed in the static registry.

This is a static portfolio/demo viewer. The module registry is display metadata only; it does not replace `moby-run-manifest.json`, and unknown modules still render from manifest data. The viewer is not a database-backed ingestion system, does not scan local run folders, and does not upload or persist manifests.

### `/import-review` MOBY JSON Sidecar Viewer

The Import Review Viewer loads a sample MOBY sidecar from:

```text
public/samples/moby-import-example.json
```

Local route:

```text
http://localhost:3000/import-review
```

The viewer displays:

- Schema metadata: `schemaVersion`, `generatedBy`, and `generatedAt`.
- Import summary: run ID, source, status, row count, warning count, package count, and source file.
- Mapping profile: source fields, canonical MOBY fields, and mapping status.
- Validation issues: severity, code, field, row number, and message.
- Packages: package label, product name, quantity, unit cost, total cost, and vendor.

## Ecosystem Architecture

TrackingTHC is part of a small MOBY import ecosystem:

```text
moby-core -> trackingthc-import-mapper -> trackingthc.com
```

- `moby-core` defines the shared contracts and vocabulary for MOBY import artifacts.
- MOBY-compatible modules emit `moby-run-manifest.json` files that describe module runs, sources, artifacts, warnings, and summary counts.
- `trackingthc-import-mapper` reads source exports, applies mappings, validates rows, and generates versioned MOBY JSON sidecars.
- `trackingthc.com` consumes those sidecars and run manifests and displays them for review, audit prep, and future reconciliation workflows.

This repo is the consuming app. It should not need to understand mapper internals; it only needs the versioned sidecar and run manifest contracts.

## Current Status

- Static/client-side import review is working.
- Static/client-side MOBY run history is available at `/moby-runs`.
- No auth is required for `/import-review`.
- No database is required for `/import-review` or `/moby-runs`.
- Sample import sidecar JSON is served from `public/samples/moby-import-example.json`.
- Sample run manifest JSON is served from `public/samples/moby-run-manifests/`.
- Static module display metadata is served from `public/samples/moby-module-registry.json`.
- The pages currently use bundled samples rather than a selector, upload flow, local folder scanning, or persisted import history.

## Local Development

Install dependencies:

```powershell
npm install
```

Start the dev server:

```powershell
npm run dev
```

Open the Import Review Viewer:

```text
http://localhost:3000/import-review
```

Open the MOBY Run History Viewer:

```text
http://localhost:3000/moby-runs
```

Create a production build:

```powershell
npm run build
```

Some older operational prototype pages use Prisma/PostgreSQL and environment variables. The `/import-review` and `/moby-runs` pages do not require database setup.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma/PostgreSQL for earlier operational prototype areas

## Roadmap

- Sample selector for multiple generated MOBY sidecars.
- Upload local MOBY JSON sidecar.
- Manifest selector or local-file review for MOBY run history.
- Reconciliation prep workflow.
- Finance review workflow.

## Viewer Difference

`/import-review` reads a `moby-import.json` sidecar and focuses on one import review workflow: mappings, validation issues, and packages.

`/moby-runs` reads `moby-run-manifest.json` files and focuses on module run history: run metadata, sources, artifacts, warnings, and compact metadata across multiple MOBY-compatible modules.

Neither route stores uploaded files or writes database records in the current demo slice.

## Notes

TrackingTHC began as a cannabis retail operations prototype with product, package, adjustment, audit log, and fake Metrc sync concepts. The current documentation focus is the MOBY import review loop: proving that `trackingthc-import-mapper` can generate a real sidecar and `trackingthc.com` can display it clearly for human review.
