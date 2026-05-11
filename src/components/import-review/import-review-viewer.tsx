"use client";

import { useEffect, useState } from "react";

const SAMPLE_PATH = "/samples/moby-import-example.json";
const FALLBACK = "—";

type MappingEntry = {
  sourceField?: string;
  canonicalField?: string;
  status?: string;
};

type MappingProfile = {
  sourceSystem?: string;
  mappings?: MappingEntry[];
};

type ImportRun = {
  id?: string;
  sourceSystem?: string;
  source?: string;
  status?: string;
  rowsProcessed?: number;
  warningCount?: number;
  packageCount?: number;
  sourceFile?: string;
};

type ValidationIssue = {
  severity?: string;
  code?: string;
  field?: string;
  rowNumber?: number;
  message?: string;
};

type ImportPackage = {
  id?: string;
  label?: string;
  packageLabel?: string;
  productName?: string;
  product?: {
    name?: string;
  };
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  totalCost?: number;
  vendorName?: string;
  vendor?: {
    name?: string;
  };
};

type MobyImportSidecar = {
  mappingProfile?: MappingProfile;
  importRun?: ImportRun;
  validationIssues?: ValidationIssue[];
  packages?: ImportPackage[];
};

type SummaryItemProps = {
  label: string;
  value: string | number | undefined;
};

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return FALLBACK;
  }

  return String(value);
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return FALLBACK;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-cream p-4">
      <p className="text-xs font-medium uppercase text-ink/50">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{display(value)}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ImportReviewViewer() {
  const [data, setData] = useState<MobyImportSidecar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadImportReview() {
      try {
        const response = await fetch(SAMPLE_PATH);

        if (!response.ok) {
          throw new Error(`Unable to load sample import JSON (${response.status})`);
        }

        const payload = (await response.json()) as MobyImportSidecar;

        if (isMounted) {
          setData(payload);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load sample import JSON.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadImportReview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-ink">Loading import review...</p>
        <p className="mt-1 text-sm text-ink/60">Reading {SAMPLE_PATH}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-clay/40 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-clay">Import review unavailable</h2>
        <p className="mt-2 text-sm text-ink/70">{error}</p>
        <p className="mt-1 text-sm text-ink/60">Expected sample file: {SAMPLE_PATH}</p>
      </section>
    );
  }

  const importRun = data?.importRun;
  const mappingProfile = data?.mappingProfile;
  const mappings = Array.isArray(mappingProfile?.mappings) ? mappingProfile.mappings : [];
  const validationIssues = Array.isArray(data?.validationIssues) ? data.validationIssues : [];
  const packages = Array.isArray(data?.packages) ? data.packages : [];
  const source = importRun?.sourceSystem ?? importRun?.source ?? mappingProfile?.sourceSystem;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-ink">Import summary</h2>
          <p className="mt-1 text-sm text-ink/60">Static MOBY sidecar loaded from {SAMPLE_PATH}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Run ID" value={importRun?.id} />
          <SummaryItem label="Source" value={source} />
          <SummaryItem label="Status" value={importRun?.status} />
          <SummaryItem label="Rows processed" value={importRun?.rowsProcessed} />
          <SummaryItem label="Warning count" value={importRun?.warningCount ?? validationIssues.length} />
          <SummaryItem label="Package count" value={importRun?.packageCount ?? packages.length} />
          <SummaryItem label="Source file" value={importRun?.sourceFile} />
        </div>
      </section>

      <Section title="Mapping profile">
        {mappings.length === 0 ? (
          <EmptyState message="No field mappings were present in the sample sidecar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
                  <th className="py-2 pr-4">Source field</th>
                  <th className="py-2 pr-4">Canonical field</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping, index) => (
                  <tr key={`${mapping.sourceField ?? "mapping"}-${index}`} className="border-b border-ink/10 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">{display(mapping.sourceField)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-ink/70">{display(mapping.canonicalField)}</td>
                    <td className="py-3 pr-4 text-ink/70">{display(mapping.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Validation issues">
        {validationIssues.length === 0 ? (
          <EmptyState message="No validation issues were present in the sample sidecar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
                  <th className="py-2 pr-4">Severity</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Field</th>
                  <th className="py-2 pr-4">Row number</th>
                  <th className="py-2 pr-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {validationIssues.map((issue, index) => (
                  <tr key={`${issue.code ?? "issue"}-${index}`} className="border-b border-ink/10 align-top last:border-0">
                    <td className="py-3 pr-4 font-medium text-clay">{display(issue.severity)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-ink/70">{display(issue.code)}</td>
                    <td className="py-3 pr-4 text-ink/70">{display(issue.field)}</td>
                    <td className="py-3 pr-4 text-ink/70">{display(issue.rowNumber)}</td>
                    <td className="py-3 pr-4 text-ink/70">{display(issue.message)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Packages">
        {packages.length === 0 ? (
          <EmptyState message="No packages were present in the sample sidecar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
                  <th className="py-2 pr-4">Package label</th>
                  <th className="py-2 pr-4">Product name</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Unit cost</th>
                  <th className="py-2 pr-4">Total cost</th>
                  <th className="py-2 pr-4">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((item, index) => (
                  <tr key={`${item.id ?? item.label ?? "package"}-${index}`} className="border-b border-ink/10 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-moss">{display(item.label ?? item.packageLabel ?? item.id)}</td>
                    <td className="py-3 pr-4 text-ink/70">{display(item.product?.name ?? item.productName)}</td>
                    <td className="py-3 pr-4 text-ink/70">
                      {display(item.quantity)}
                      {item.unitOfMeasure ? ` ${item.unitOfMeasure}` : ""}
                    </td>
                    <td className="py-3 pr-4 text-ink/70">{formatCurrency(item.unitCost)}</td>
                    <td className="py-3 pr-4 text-ink/70">{formatCurrency(item.totalCost)}</td>
                    <td className="py-3 pr-4 text-ink/70">{display(item.vendor?.name ?? item.vendorName)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
