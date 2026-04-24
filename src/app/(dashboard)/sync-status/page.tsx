import { PagePanel } from "@/components/ui/page-panel";
import { syncStatusLegend } from "@/server/metrc/metrc-sync-status";

export default function SyncStatusPage() {
  return (
    <PagePanel
      title="Metrc sync status"
      description="Placeholder for sync job queues, outbound request history, webhook processing, reconciliation conflicts, and adapter health. This page uses fake Metrc status semantics only."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {syncStatusLegend.map((item) => (
          <div key={item.status} className="rounded-md border border-ink/10 bg-cream p-4">
            <p className="text-sm font-semibold text-ink">{item.label}</p>
            <p className="mt-1 font-mono text-xs text-moss">{item.status}</p>
            <p className="mt-2 text-sm leading-5 text-ink/65">{item.description}</p>
          </div>
        ))}
      </div>
    </PagePanel>
  );
}
