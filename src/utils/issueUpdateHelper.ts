import { IssueType, IssueStatus, statusMapping } from "../types";

/**
 * Format severity for backend (expects capitalized: "Low", "Medium", "High", "None")
 */
export const formatSeverity = (severity?: string): string => {
  if (!severity) return "None";
  const val = severity.toLowerCase();
  if (val === "low") return "Low";
  if (val === "medium") return "Medium";
  if (val === "high") return "High";
  return "None";
};

/**
 * Build issue update body with only fields the backend accepts.
 * The PUT /api/issues/{id} endpoint requires specific fields.
 */
export const buildIssueUpdateBody = (
  issue: IssueType,
  patch: Partial<IssueType>,
  listingId?: number
) => ({
  id: issue.id,
  report_id: issue.report_id,
  listing_id: listingId ?? issue.listing_id,
  vendor_id: patch.vendor_id !== undefined ? patch.vendor_id : (issue.vendor_id ?? null),
  type: issue.type || "other",
  description: issue.description || "",
  summary: issue.summary || "",
  severity: formatSeverity(issue.severity),
  status: patch.status || statusMapping[issue.status as IssueStatus] || "open",
  active: patch.active !== undefined ? patch.active : (issue.active ?? true),
  image_url: issue.image_urls?.[0] || "",
  cost: issue.cost || "0",
  review_status: patch.review_status || issue.review_status || "not_reviewed",
});
