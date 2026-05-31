export function getIssueImageUrls(
  imageUrls: string | string[] | undefined | null
): string[] {
  if (imageUrls == null || imageUrls === "") return [];
  if (Array.isArray(imageUrls)) {
    return imageUrls.filter((u): u is string => typeof u === "string" && u !== "");
  }
  if (typeof imageUrls === "string") {
    const s = imageUrls.trim();
    if (!s || s === "None" || s === "null") return [];
    if (s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((u): u is string => typeof u === "string" && u !== "");
        }
      } catch {
        /* fall through */
      }
    }
    if (s.includes(",")) {
      return s
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
    }
    return [s];
  }
  return [];
}

/** Collect image URLs from any field the API may populate. */
export function getIssueImageUrlsFromIssue(
  issue: { image_urls?: string | string[]; image_url?: string; images?: string | string[] } | undefined | null
): string[] {
  if (!issue) return [];
  const raw =
    issue.image_urls ??
    (issue as { image_url?: string }).image_url ??
    (issue as { images?: string | string[] }).images;
  return getIssueImageUrls(raw);
}
