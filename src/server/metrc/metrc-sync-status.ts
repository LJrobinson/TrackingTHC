import "server-only";

export const syncStatusLegend = [
  {
    status: "NOT_SYNCED",
    label: "Not synced",
    description: "Local record exists but has not been sent to or compared with Metrc."
  },
  {
    status: "SYNC_PENDING",
    label: "Pending",
    description: "A sync job is queued or ready to run."
  },
  {
    status: "SYNCED",
    label: "Synced",
    description: "Local state is currently aligned with the Metrc adapter."
  },
  {
    status: "SYNC_FAILED",
    label: "Failed",
    description: "The most recent sync attempt failed and needs review."
  },
  {
    status: "CONFLICT",
    label: "Conflict",
    description: "Local and Metrc adapter state disagree and require reconciliation."
  }
] as const;
