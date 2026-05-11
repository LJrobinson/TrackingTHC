import type { Metadata } from "next";
import { MobyRunHistoryViewer } from "@/components/moby-runs/moby-run-history-viewer";

export const metadata: Metadata = {
  title: "MOBY Runs | TrackingTHC",
  description: "Static MOBY run manifest viewer for TrackingTHC demo workflows"
};

export default function MobyRunsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-moss">MOBY Mission Control</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">MOBY Run History</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Read-only demo view for committed MOBY run manifests. It shows what each module ran, what files it
            produced, and which warnings need review without using uploads, background jobs, or database persistence.
          </p>
        </div>
      </section>

      <MobyRunHistoryViewer />
    </div>
  );
}
