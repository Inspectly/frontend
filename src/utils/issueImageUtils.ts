/**
 * Normalize issue image_urls from API (string or string[]) to a string array.
 * Handles: array, single URL string, or JSON string array from backend.
 */
export function getIssueImageUrls(imageUrls: string | string[] | undefined | null): string[] {
  if (imageUrls == null || imageUrls === "") return [];
  if (Array.isArray(imageUrls)) return imageUrls.filter((u): u is string => typeof u === "string" && u !== "");
  if (typeof imageUrls === "string") {
    const s = imageUrls.trim();
    if (!s || s === "None" || s === "null") return [];
    // Backend may return JSON array as string, e.g. '["url1","url2"]'
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) return parsed.filter((u): u is string => typeof u === "string" && u !== "");
      } catch {
        // fall through to single-url
      }
    }
    // Backend may return comma-separated URLs
    if (s.includes(",")) {
      return s.split(",").map((u) => u.trim()).filter((u) => u.length > 0);
    }
    return [s];
  }
  return [];
}

/**
 * Get image URLs from an issue. Checks image_urls, image_url, and images.
 * Use this so pictures stay visible regardless of which field the API returns.
 */
export function getIssueImageUrlsFromIssue(
  issue: { image_urls?: string | string[]; image_url?: string; images?: string | string[] } | undefined | null
): string[] {
  if (!issue) return [];
  const raw =
    (issue as { image_urls?: string | string[] }).image_urls ??
    (issue as { image_url?: string }).image_url ??
    (issue as { images?: string | string[] }).images;
  return getIssueImageUrls(raw);
}

export function getFirstIssueImageUrl(imageUrls: string | string[] | undefined | null, fallback: string): string {
  const urls = getIssueImageUrls(imageUrls);
  return urls[0] || fallback;
}

/**
 * Serialize image URLs for backend PUT (image_url field).
 * Backend expects string: single URL or JSON array string for multiple.
 */
export function serializeImageUrlsForBackend(urls: string[]): string {
  if (urls.length === 0) return "";
  if (urls.length === 1) return urls[0];
  return JSON.stringify(urls);
}
