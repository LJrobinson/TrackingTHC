export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDecimal(value: { toString(): string } | number | string) {
  const text = value.toString();
  return text.replace(/\.?0+$/, "");
}

export function formatQuantity(value: { toString(): string } | number | string, unit: string) {
  return `${formatDecimal(value)} ${unit}`;
}

export function summarizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "No metadata";
  }

  const blockedKeys = ["api", "authorization", "credential", "key", "password", "secret", "token"];
  const entries = Object.entries(value)
    .filter(([key]) => !blockedKeys.some((blockedKey) => key.toLowerCase().includes(blockedKey)))
    .slice(0, 4)
    .map(([key, entry]) => `${key}: ${typeof entry === "object" ? "object" : String(entry)}`);

  return entries.length > 0 ? entries.join(", ") : "No displayable metadata";
}
