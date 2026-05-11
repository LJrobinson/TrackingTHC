"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

const INDEX_PATH = "/samples/moby-run-manifests/index.json";
const MODULE_REGISTRY_PATH = "/samples/moby-module-registry.json";
const FALLBACK = "-";
const ALL_FILTER = "all";

type MetadataRecord = Record<string, unknown>;

type SampleIndexEntry = {
  label?: string;
  module?: string;
  description?: string;
  path?: string;
};

type SampleIndexPayload = {
  manifests?: SampleIndexEntry[];
};

type MobySourceMetadata = {
  system?: string;
  name?: string;
  fileName?: string;
  filePath?: string;
  receivedAt?: string;
  metadata?: MetadataRecord;
};

type MobyArtifact = {
  id?: string;
  role?: string;
  path?: string;
  format?: string;
  label?: string;
  mediaType?: string;
  metadata?: MetadataRecord;
};

type MobyWarning = {
  code?: string;
  severity?: string;
  message?: string;
  artifactId?: string;
  field?: string;
  rowNumber?: number | string;
  metadata?: MetadataRecord;
};

type MobyRunSummary = {
  processedCount?: number | string;
  successCount?: number | string;
  warningCount?: number | string;
  errorCount?: number | string;
  artifactCount?: number | string;
  metadata?: MetadataRecord;
};

type MobyRunManifest = {
  schemaVersion?: string;
  runId?: string;
  runType?: string;
  generatedBy?: string;
  generatedAt?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  sources?: MobySourceMetadata[];
  artifacts?: MobyArtifact[];
  warnings?: MobyWarning[];
  summary?: MobyRunSummary;
  metadata?: MetadataRecord;
};

type LoadedRun = {
  sample: SampleIndexEntry;
  path: string;
  manifest: MobyRunManifest;
};

type MobyModuleRegistryEntry = {
  module?: string;
  displayName?: string;
  category?: string;
  description?: string;
  shortLabel?: string;
  businessPurpose?: string;
};

type MobyModuleRegistry = Record<string, MobyModuleRegistryEntry>;

type MobyModuleRegistryPayload = {
  modules?: MobyModuleRegistry | MobyModuleRegistryEntry[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSampleIndexEntry(value: unknown): value is SampleIndexEntry {
  return isRecord(value) && typeof value.path === "string" && value.path.trim().length > 0;
}

function getSampleEntries(payload: unknown): SampleIndexEntry[] {
  if (Array.isArray(payload)) {
    return payload.filter(isSampleIndexEntry);
  }

  if (isRecord(payload)) {
    const manifests = (payload as SampleIndexPayload).manifests;
    return Array.isArray(manifests) ? manifests.filter(isSampleIndexEntry) : [];
  }

  return [];
}

function isRegistryEntry(value: unknown): value is MobyModuleRegistryEntry {
  return isRecord(value) && typeof value.module === "string" && value.module.trim().length > 0;
}

function getModuleRegistry(payload: unknown): MobyModuleRegistry {
  const entries = isRecord(payload) && "modules" in payload ? (payload as MobyModuleRegistryPayload).modules : payload;

  if (Array.isArray(entries)) {
    return Object.fromEntries(entries.filter(isRegistryEntry).map((entry) => [entry.module as string, entry]));
  }

  if (!isRecord(entries)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => isRecord(value)).map(([module, value]) => [module, value as MobyModuleRegistryEntry])
  );
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return FALLBACK;
  }

  if (typeof value === "object") {
    return FALLBACK;
  }

  return String(value);
}

function titleValue(value: unknown) {
  const valueText = display(value);
  return valueText === FALLBACK ? undefined : valueText;
}

function TruncatedText({ value, className = "" }: { value: unknown; className?: string }) {
  return (
    <span className={`block truncate ${className}`} title={titleValue(value)}>
      {display(value)}
    </span>
  );
}

function displayDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return FALLBACK;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getSources(manifest: MobyRunManifest) {
  return Array.isArray(manifest.sources) ? manifest.sources : [];
}

function getArtifacts(manifest: MobyRunManifest) {
  return Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
}

function getWarnings(manifest: MobyRunManifest) {
  return Array.isArray(manifest.warnings) ? manifest.warnings : [];
}

function getWarningCount(manifest: MobyRunManifest) {
  return toNumber(manifest.summary?.warningCount) ?? getWarnings(manifest).length;
}

function getArtifactCount(manifest: MobyRunManifest) {
  return toNumber(manifest.summary?.artifactCount) ?? getArtifacts(manifest).length;
}

function getMetadataString(metadata: MetadataRecord | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function getPrimarySourceFile(manifest: MobyRunManifest) {
  const source = getSources(manifest)[0];

  return (
    source?.fileName ??
    source?.filePath ??
    getMetadataString(manifest.metadata, "sourceFile") ??
    getMetadataString(manifest.metadata, "inputFile")
  );
}

function getRunModuleValue(run: LoadedRun) {
  return run.sample.module ?? run.manifest.generatedBy ?? run.manifest.runType ?? "unknown";
}

function getModuleRegistryEntry(run: LoadedRun, registry: MobyModuleRegistry) {
  const candidates = [run.sample.module, run.manifest.generatedBy, getRunModuleValue(run), run.manifest.runType].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  for (const candidate of candidates) {
    const entry = registry[candidate];

    if (entry) {
      return entry;
    }
  }

  return undefined;
}

function getModuleDisplayName(run: LoadedRun, registry: MobyModuleRegistry) {
  const entry = getModuleRegistryEntry(run, registry);
  return entry?.displayName ?? run.sample.label ?? run.manifest.generatedBy ?? run.manifest.runType ?? run.sample.module ?? FALLBACK;
}

function getModuleShortLabel(run: LoadedRun, registry: MobyModuleRegistry) {
  const entry = getModuleRegistryEntry(run, registry);
  return entry?.shortLabel ?? entry?.displayName ?? run.manifest.generatedBy ?? run.manifest.runType ?? run.sample.module ?? FALLBACK;
}

function getModuleCategory(run: LoadedRun, registry: MobyModuleRegistry) {
  const entry = getModuleRegistryEntry(run, registry);
  return entry?.category ?? run.manifest.runType ?? FALLBACK;
}

function getRunStatusValue(run: LoadedRun) {
  return typeof run.manifest.status === "string" && run.manifest.status.trim() !== "" ? run.manifest.status : "unknown";
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return FALLBACK;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => display(item)).join(", ") : FALLBACK;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function metadataEntries(metadata: MetadataRecord | undefined) {
  return Object.entries(metadata ?? {}).filter(([, value]) => value !== undefined).slice(0, 8);
}

function statusClass(status: unknown) {
  const value = typeof status === "string" ? status : "";

  if (value === "completed") {
    return "border border-moss/20 bg-moss/10 text-moss";
  }

  if (value === "completed_with_warnings") {
    return "border border-clay/20 bg-clay/10 text-clay";
  }

  if (value === "warning") {
    return "border border-clay/20 bg-clay/10 text-clay";
  }

  if (value === "failed") {
    return "border border-clay bg-clay text-white";
  }

  if (value === "pending") {
    return "border border-ink/15 bg-ink/10 text-ink/70";
  }

  if (value === "processing") {
    return "border border-mint/40 bg-mint/25 text-moss";
  }

  return "border border-ink/10 bg-ink/10 text-ink/70";
}

function StatusBadge({ status }: { status: unknown }) {
  return (
    <span
      className={`inline-flex max-w-[14rem] rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
      title={titleValue(status)}
    >
      <span className="truncate">{display(status)}</span>
    </span>
  );
}

function CategoryBadge({ label, title }: { label: unknown; title?: unknown }) {
  return (
    <span
      className="inline-flex max-w-[12rem] rounded-full border border-ink/10 bg-cream px-2.5 py-1 text-xs font-semibold text-ink/70"
      title={titleValue(title ?? label)}
    >
      <span className="truncate">{display(label)}</span>
    </span>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-ink/60">{detail}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/60">{message}</p>;
}

function Section({
  title,
  description,
  meta,
  children
}: {
  title: string;
  description?: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink/60">{description}</p> : null}
        </div>
        {meta ? <p className="rounded-md border border-ink/10 px-3 py-2 text-sm text-ink/60">{meta}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function SourceTable({ sources }: { sources: MobySourceMetadata[] }) {
  if (sources.length === 0) {
    return <EmptyState message="No source metadata was present in this manifest." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
            <th className="py-2 pr-4">System</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">File</th>
            <th className="py-2 pr-4">Path</th>
            <th className="py-2 pr-4">Received</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source, index) => (
            <tr key={`${source.filePath ?? source.fileName ?? "source"}-${index}`} className="border-b border-ink/10 align-top last:border-0">
              <td className="py-3 pr-4 font-medium text-ink">{display(source.system)}</td>
              <td className="py-3 pr-4 text-ink/70">{display(source.name)}</td>
              <td className="py-3 pr-4 text-ink/70">
                <TruncatedText value={source.fileName} className="max-w-[16rem]" />
              </td>
              <td className="py-3 pr-4">
                <TruncatedText value={source.filePath} className="max-w-[28rem] font-mono text-[11px] leading-5 text-ink/70" />
              </td>
              <td className="py-3 pr-4 text-ink/70">{displayDate(source.receivedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArtifactTable({ artifacts }: { artifacts: MobyArtifact[] }) {
  if (artifacts.length === 0) {
    return <EmptyState message="No artifacts were present in this manifest." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
            <th className="py-2 pr-4">Label</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Format</th>
            <th className="py-2 pr-4">Path</th>
            <th className="py-2 pr-4">Artifact ID</th>
          </tr>
        </thead>
        <tbody>
          {artifacts.map((artifact, index) => (
            <tr key={`${artifact.id ?? artifact.path ?? "artifact"}-${index}`} className="border-b border-ink/10 align-top last:border-0">
              <td className="py-3 pr-4 font-semibold text-ink">
                <TruncatedText value={artifact.label} className="max-w-[16rem]" />
              </td>
              <td className="py-3 pr-4 text-ink/70">{display(artifact.role)}</td>
              <td className="py-3 pr-4 text-ink/70">{display(artifact.format)}</td>
              <td className="py-3 pr-4">
                <TruncatedText value={artifact.path} className="max-w-[28rem] font-mono text-[11px] leading-5 text-ink/70" />
              </td>
              <td className="py-3 pr-4">
                <TruncatedText value={artifact.id} className="max-w-[15rem] font-mono text-[11px] leading-5 text-ink/60" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WarningTable({ warnings }: { warnings: MobyWarning[] }) {
  if (warnings.length === 0) {
    return <EmptyState message="No warnings were present in this run manifest." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
            <th className="py-2 pr-4">Severity</th>
            <th className="py-2 pr-4">Code</th>
            <th className="py-2 pr-4">Field</th>
            <th className="py-2 pr-4">Row</th>
            <th className="py-2 pr-4">Artifact</th>
            <th className="py-2 pr-4">Message</th>
          </tr>
        </thead>
        <tbody>
          {warnings.map((warning, index) => (
            <tr key={`${warning.code ?? "warning"}-${index}`} className="border-b border-ink/10 align-top last:border-0">
              <td className="py-3 pr-4">
                <StatusBadge status={warning.severity} />
              </td>
              <td className="py-3 pr-4 font-mono text-xs text-ink/70">{display(warning.code)}</td>
              <td className="py-3 pr-4 text-ink/70">{display(warning.field)}</td>
              <td className="py-3 pr-4 text-ink/70">{display(warning.rowNumber)}</td>
              <td className="py-3 pr-4">
                <TruncatedText value={warning.artifactId} className="max-w-[15rem] font-mono text-[11px] leading-5 text-ink/60" />
              </td>
              <td className="py-3 pr-4 text-ink/70">
                <p className="max-w-[34rem] whitespace-normal leading-6" title={titleValue(warning.message)}>
                  {display(warning.message)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetadataSummary({ metadata }: { metadata: MetadataRecord | undefined }) {
  const entries = metadataEntries(metadata);

  if (entries.length === 0) {
    return <EmptyState message="No compact metadata was present in this manifest." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-md border border-ink/10 bg-cream p-4">
          <p className="text-xs font-medium uppercase text-ink/50">{key}</p>
          <p className="mt-2 max-h-24 overflow-auto break-words text-sm font-semibold text-ink">{formatMetadataValue(value)}</p>
        </div>
      ))}
    </div>
  );
}

async function loadModuleRegistry(): Promise<MobyModuleRegistry> {
  try {
    const response = await fetch(MODULE_REGISTRY_PATH);

    if (!response.ok) {
      return {};
    }

    return getModuleRegistry((await response.json()) as unknown);
  } catch {
    return {};
  }
}

export function MobyRunHistoryViewer() {
  const [runs, setRuns] = useState<LoadedRun[]>([]);
  const [moduleRegistry, setModuleRegistry] = useState<MobyModuleRegistry>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRuns() {
      try {
        const indexResponse = await fetch(INDEX_PATH);

        if (!indexResponse.ok) {
          throw new Error(`Unable to load manifest index (${indexResponse.status}).`);
        }

        const indexPayload = (await indexResponse.json()) as unknown;
        const entries = getSampleEntries(indexPayload);

        if (entries.length === 0) {
          throw new Error("Manifest index did not include any sample manifest paths.");
        }

        const runPromises = entries.map(async (entry) => {
          const path = entry.path?.trim() ?? "";
          const manifestResponse = await fetch(path);

          if (!manifestResponse.ok) {
            throw new Error(`Unable to load sample manifest ${path} (${manifestResponse.status}).`);
          }

          const manifest = (await manifestResponse.json()) as MobyRunManifest;

          return { sample: entry, path, manifest };
        });
        const [loadedRuns, loadedRegistry] = await Promise.all([
          Promise.all(runPromises),
          loadModuleRegistry()
        ]);

        if (isMounted) {
          setRuns(loadedRuns);
          setModuleRegistry(loadedRegistry);
          setSelectedPath(loadedRuns[0]?.path ?? null);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setRuns([]);
          setSelectedPath(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load MOBY run manifests.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRuns();

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const moduleNames = new Set(
      runs.map((run) => run.manifest.generatedBy ?? run.manifest.runType ?? run.sample.module).filter(Boolean)
    );

    return {
      runCount: runs.length,
      moduleCount: moduleNames.size,
      warningCount: runs.reduce((sum, run) => sum + getWarningCount(run.manifest), 0),
      artifactCount: runs.reduce((sum, run) => sum + getArtifactCount(run.manifest), 0)
    };
  }, [runs]);

  const moduleOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const run of runs) {
      options.set(getRunModuleValue(run), getModuleDisplayName(run, moduleRegistry));
    }

    return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
  }, [moduleRegistry, runs]);

  const statusOptions = useMemo(() => Array.from(new Set(runs.map(getRunStatusValue))).sort(), [runs]);

  const filteredRuns = useMemo(
    () =>
      runs.filter((run) => {
        const matchesModule = moduleFilter === ALL_FILTER || getRunModuleValue(run) === moduleFilter;
        const matchesStatus = statusFilter === ALL_FILTER || getRunStatusValue(run) === statusFilter;

        return matchesModule && matchesStatus;
      }),
    [moduleFilter, runs, statusFilter]
  );

  const selectedRun = filteredRuns.find((run) => run.path === selectedPath) ?? filteredRuns[0];

  if (isLoading) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-ink">Loading MOBY run history...</p>
        <p className="mt-1 text-sm text-ink/60">Reading {INDEX_PATH}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-clay/40 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-clay">MOBY run history unavailable</h2>
        <p className="mt-2 text-sm text-ink/70">{error}</p>
        <p className="mt-1 text-sm text-ink/60">Expected sample index: {INDEX_PATH}</p>
      </section>
    );
  }

  if (runs.length === 0) {
    return <EmptyState message="No sample MOBY run manifests are available." />;
  }

  const selectedManifest = selectedRun?.manifest;
  const selectedSources = selectedManifest ? getSources(selectedManifest) : [];
  const selectedArtifacts = selectedManifest ? getArtifacts(selectedManifest) : [];
  const selectedWarnings = selectedManifest ? getWarnings(selectedManifest) : [];
  const selectedModuleEntry = selectedRun ? getModuleRegistryEntry(selectedRun, moduleRegistry) : undefined;
  const selectedDisplayName = selectedRun ? getModuleDisplayName(selectedRun, moduleRegistry) : FALLBACK;
  const selectedCategory = selectedRun ? getModuleCategory(selectedRun, moduleRegistry) : FALLBACK;
  const selectedDescription = selectedModuleEntry?.description ?? selectedRun?.sample.description;
  const selectedBusinessPurpose = selectedModuleEntry?.businessPurpose;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total runs" value={String(totals.runCount)} detail="Static sample manifests" />
        <SummaryCard label="Module count" value={String(totals.moduleCount)} detail="Distinct MOBY generators" />
        <SummaryCard label="Total warnings" value={String(totals.warningCount)} detail="Warnings listed across runs" />
        <SummaryCard label="Total artifacts" value={String(totals.artifactCount)} detail="Files described by manifests" />
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-5 md:items-end">
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Module</span>
            <select
              className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
            >
              <option value={ALL_FILTER}>All modules</option>
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-medium uppercase text-ink/60">Status</span>
            <select
              className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value={ALL_FILTER}>All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
              type="button"
              onClick={() => {
                setModuleFilter(ALL_FILTER);
                setStatusFilter(ALL_FILTER);
              }}
            >
              Clear
            </button>
            <p className="text-sm text-ink/60">
              {filteredRuns.length} of {runs.length}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Run list</h2>
            <p className="mt-1 text-sm text-ink/60">Static sample manifests loaded from {INDEX_PATH}</p>
          </div>
          <p className="rounded-md border border-ink/10 px-3 py-2 text-sm text-ink/60">{filteredRuns.length} shown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase text-ink/50">
                <th className="py-3 pl-5 pr-4">Run ID</th>
                <th className="py-3 pr-4">Module</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Run type</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Generated at</th>
                <th className="py-3 pr-4">Warnings</th>
                <th className="py-3 pr-4">Artifacts</th>
                <th className="py-3 pr-5">Primary source</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-5">
                    <EmptyState message="No sample manifests match the current filters." />
                  </td>
                </tr>
              ) : null}
              {filteredRuns.map((run) => {
                const manifest = run.manifest;
                const isSelected = run.path === selectedRun?.path;

                return (
                  <tr key={run.path} className={`border-b border-ink/10 align-top last:border-0 ${isSelected ? "bg-cream" : ""}`}>
                    <td className="py-4 pl-5 pr-4">
                      <button className="text-left font-semibold text-moss" type="button" onClick={() => setSelectedPath(run.path)}>
                        <TruncatedText value={manifest.runId} className="max-w-[15rem]" />
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <TruncatedText value={getModuleDisplayName(run, moduleRegistry)} className="max-w-[16rem] font-semibold text-ink" />
                    </td>
                    <td className="py-4 pr-4">
                      <CategoryBadge label={getModuleShortLabel(run, moduleRegistry)} title={getModuleCategory(run, moduleRegistry)} />
                    </td>
                    <td className="py-4 pr-4">
                      <TruncatedText value={manifest.runType} className="max-w-[14rem] font-mono text-xs text-ink/70" />
                    </td>
                    <td className="py-4 pr-4">
                      <StatusBadge status={manifest.status} />
                    </td>
                    <td className="py-4 pr-4 text-ink/70">{displayDate(manifest.generatedAt)}</td>
                    <td className="py-4 pr-4 font-semibold text-ink">{getWarningCount(manifest)}</td>
                    <td className="py-4 pr-4 font-semibold text-ink">{getArtifactCount(manifest)}</td>
                    <td className="py-4 pr-5">
                      <TruncatedText value={getPrimarySourceFile(manifest)} className="max-w-[20rem] font-mono text-[11px] leading-5 text-ink/70" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRun && selectedManifest ? (
        <>
          <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-moss">{selectedDisplayName}</p>
                  <CategoryBadge label={selectedModuleEntry?.shortLabel ?? selectedCategory} title={selectedCategory} />
                </div>
                <h2 className="mt-1 break-words text-lg font-semibold text-ink">{display(selectedManifest.runId)}</h2>
                <p className="mt-1 text-sm text-ink/60">
                  {display(selectedManifest.runType)} generated by {display(selectedManifest.generatedBy)}.
                </p>
                {selectedDescription ? <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">{selectedDescription}</p> : null}
                {selectedBusinessPurpose ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">
                    <span className="font-semibold text-ink">Business purpose:</span> {selectedBusinessPurpose}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase text-ink/50">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedManifest.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Schema</p>
                  <p className="mt-1 font-semibold text-ink">{display(selectedManifest.schemaVersion)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Processed</p>
                  <p className="mt-1 font-semibold text-ink">{display(selectedManifest.summary?.processedCount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-ink/50">Errors</p>
                  <p className="mt-1 font-semibold text-ink">{display(selectedManifest.summary?.errorCount)}</p>
                </div>
              </div>
            </div>
          </section>

          <Section title="Source info" description="Where the run came from and which source file was described." meta={`${selectedSources.length} source(s)`}>
            <SourceTable sources={selectedSources} />
          </Section>

          <Section title="Artifacts" description="Files or outputs produced by the selected module run." meta={`${selectedArtifacts.length} artifact(s)`}>
            <ArtifactTable artifacts={selectedArtifacts} />
          </Section>

          <Section title="Warnings" description="Review notes linked back to source rows, fields, or artifacts where available." meta={`${selectedWarnings.length} warning(s)`}>
            <WarningTable warnings={selectedWarnings} />
          </Section>

          <Section title="Metadata summary" description="Compact module-specific context included in the manifest.">
            <MetadataSummary metadata={selectedManifest.metadata ?? selectedManifest.summary?.metadata} />
          </Section>
        </>
      ) : (
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <EmptyState message="Select a run or clear the filters to view manifest details." />
        </section>
      )}
    </div>
  );
}
