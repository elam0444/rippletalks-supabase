/**
 * Utility functions for text formatting and manipulation
 */

/**
 * Truncate text to a maximum length and add ellipsis if needed
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateText("This is a long description", 10) // "This is a…"
 * truncateText("Short", 10) // "Short"
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "…";
}

/**
 * Format a website URL for display by removing protocol and trailing slash
 *
 * @param url - The full URL
 * @returns Formatted URL without protocol
 *
 * @example
 * formatWebsite("https://example.com/") // "example.com"
 * formatWebsite("http://www.example.com") // "www.example.com"
 */
export function formatWebsite(url: string): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Format a date string to locale string
 *
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 *
 * @example
 * formatDate("2026-02-14T10:00:00Z") // "2/14/2026, 10:00:00 AM"
 */
export function formatDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    return new Date(dateString).toLocaleString(undefined, options);
  } catch {
    return dateString;
  }
}

export function formatAvailableDate(dateStr: string, timeZone?: string): string {
  const date = new Date(dateStr);
  const opts: Intl.DateTimeFormatOptions = timeZone ? { timeZone } : {};

  const month = date.toLocaleString("en-US", { ...opts, month: "long" });
  const day = parseInt(date.toLocaleString("en-US", { ...opts, day: "numeric" }), 10);
  const year = date.toLocaleString("en-US", { ...opts, year: "numeric" });
  const time = date.toLocaleString("en-US", {
    ...opts,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const suffix =
    day % 10 === 1 && day !== 11 ? "st"
    : day % 10 === 2 && day !== 12 ? "nd"
    : day % 10 === 3 && day !== 13 ? "rd"
    : "th";

  const tzLabel = timeZone
    ? " " + date.toLocaleString("en-US", { ...opts, timeZoneName: "short" }).split(" ").at(-1)
    : "";

  return `${month} ${day}${suffix}, ${year} ${time}${tzLabel}`;
}
