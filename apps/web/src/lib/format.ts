const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** A stored `yyyy-mm-dd` day → "Sep 17, 2026". Anything unparseable is shown as-is. */
export function formatDayLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) {
    return value
  }
  return DAY_FORMAT.format(new Date(year, month - 1, day))
}

/** A table amount: 780 → "780.00", nothing → "—". No currency symbol yet. */
export function formatAmount(value: number | null): string {
  return value === null ? "—" : AMOUNT_FORMAT.format(value)
}

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return "";
  }
}
