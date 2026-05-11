import type { Metadata } from "next";
import { ImportReviewViewer } from "@/components/import-review/import-review-viewer";

export const metadata: Metadata = {
  title: "Import Review | TrackingTHC",
  description: "Static MOBY import sidecar review for TrackingTHC demo imports"
};

export default function ImportReviewPage() {
  return (
    <main className="min-h-screen bg-cream px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">TrackingTHC Import Review</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">MOBY JSON Sidecar Viewer</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
            Static review page for sample import artifacts produced by trackingthc-import-mapper.
          </p>
        </header>

        <ImportReviewViewer />
      </div>
    </main>
  );
}
