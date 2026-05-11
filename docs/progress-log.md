# Progress Log

## Import Review Viewer - Versioned MOBY Sidecar Loop

Status: Working

Added a static Import Review Viewer at:

/import-review

The viewer consumes a real generated MOBY sidecar from trackingthc-import-mapper and displays:

- schema metadata
- importRun summary
- mappingProfile mappings
- validationIssues
- InventoryPackage entities

Validated real sidecar behavior:

- schema version, generator, and generated timestamp render correctly
- run ID, source, status, rows processed, warning count, package count, and source file render correctly
- mapping profile renders source fields, canonical fields, and mapping status
- validation issues render warning code, field, row number, severity, and message
- packages render label, product name, quantity, unit cost, total cost, and vendor
- invalid cost rows remain visibly unresolved with —
- valid package totalCost values render correctly after mapper parser hardening

Product insight:

trackingthc.com now proves the first real ecosystem handoff: trackingthc-import-mapper emits a MOBY-compatible sidecar, and trackingthc.com consumes and renders that artifact without needing to understand the mapper’s internal file formats.

This turns the MOBY sidecar from a static contract artifact into a visible review workflow foundation.

Next target:

Sample selector or upload local sidecar.
