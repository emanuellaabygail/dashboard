export function formatPercent(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatSignedPercent(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

export function formatCurrency(value: string | null): string {
  if (!value) {
    return "Not set";
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "Not set";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: "compact"
  }).format(amount);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Fixed-order categorical hues (validated for CVD-safety); assign by index, never cycle. */
export const CATEGORICAL_HUES = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834" // orange
];

export function hueForIndex(index: number): string {
  return CATEGORICAL_HUES[index % CATEGORICAL_HUES.length];
}
