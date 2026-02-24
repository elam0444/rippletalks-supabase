/**
 * Extracts the hostname from a URL string.
 * e.g. "https://www.stripe.com/pricing" → "stripe.com"
 */
function extractDomain(website: string): string | null {
  try {
    const url = new URL(
      website.startsWith("http") ? website : `https://${website}`,
    );
    // Strip leading "www."
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Returns a logo.dev image URL for a given company website/domain.
 * Falls back to null if no website is provided or the token is not configured.
 *
 * Requires NEXT_PUBLIC_LOGO_DEV_TOKEN to be set in your environment.
 */
export function getLogoDevUrl(website?: string | null): string | null {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  if (!token || !website) return null;

  const domain = extractDomain(website);
  if (!domain) return null;

  return `https://img.logo.dev/${domain}?token=${token}&size=64&format=png`;
}
