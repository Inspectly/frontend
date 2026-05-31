import { IssueOffer, IssueType, Listing, Vendor } from "../types";

const VENDOR_TO_ISSUE_TYPE_MAP: Record<string, string[]> = {
  electrician: ["electrical", "electrician", "electric", "wiring"],
  plumber: ["plumbing", "plumber", "pipe", "water", "drain"],
  painter: ["painting", "painter", "paint", "interior", "exterior"],
  hvac: ["hvac", "heating", "cooling", "ventilation", "ac"],
  roofer: ["roofing", "roof", "roofer", "shingle", "gutter"],
  carpenter: ["carpentry", "carpenter", "wood", "cabinet", "trim"],
  landscaper: ["landscaping", "landscaper", "lawn", "garden", "yard"],
  cleaner: ["cleaning", "cleaner", "janitorial"],
  general: ["general", "other", "misc", "interior", "exterior"],
};

export interface MarketplaceOpportunity {
  issue: IssueType;
  listing?: Listing;
  bidCount: number;
}

function expandVendorSpecialties(vendor?: Vendor | null): string[] {
  if (!vendor?.vendor_types) return [];
  const expanded = new Set<string>();
  vendor.vendor_types.split(",").forEach((raw) => {
    const type = raw.trim().toLowerCase();
    if (!type) return;
    expanded.add(type);
    (VENDOR_TO_ISSUE_TYPE_MAP[type] ?? []).forEach((t) => expanded.add(t));
  });
  return Array.from(expanded);
}

function matchesSpecialty(issue: IssueType, specialties: string[]): boolean {
  if (specialties.length === 0) return true;
  const issueType = (issue.type || "").toLowerCase();
  return specialties.some(
    (specialty) =>
      issueType.includes(specialty) || specialty.includes(issueType) || specialty === "general"
  );
}

function matchesCity(issue: IssueType, listingsMap: Record<number, Listing>, vendor?: Vendor | null): boolean {
  if (!vendor?.city) return true;
  const listing = listingsMap[issue.listing_id];
  if (!listing?.city) return false;
  return listing.city.toLowerCase() === vendor.city.toLowerCase();
}

const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Mirrors web VendorDashboard marketplace opportunity filtering. */
export function buildMarketplaceOpportunities(
  issues: IssueType[],
  listingsMap: Record<number, Listing>,
  vendor: Vendor | null | undefined,
  vendorOffers: IssueOffer[],
  bidCountsByIssueId: Record<number, number> = {}
): MarketplaceOpportunity[] {
  const alreadyBidOn = new Set(vendorOffers.map((o) => o.issue_id));
  const specialties = expandVendorSpecialties(vendor);

  const available = issues.filter(
    (i) => (i.status as string) === "Status.OPEN" && !i.vendor_id && i.active && !alreadyBidOn.has(i.id)
  );

  let filtered: IssueType[] = [];
  const exactMatch = available.filter((i) => matchesSpecialty(i, specialties) && matchesCity(i, listingsMap, vendor));
  if (exactMatch.length > 0) filtered = exactMatch;
  else {
    const specialtyOnly = available.filter((i) => matchesSpecialty(i, specialties));
    if (specialtyOnly.length > 0) filtered = specialtyOnly;
    else {
      const cityOnly = available.filter((i) => matchesCity(i, listingsMap, vendor));
      filtered = cityOnly.length > 0 ? cityOnly : available;
    }
  }

  return [...filtered]
    .sort((a, b) => {
      const at = new Date(a.created_at || 0).getTime();
      const bt = new Date(b.created_at || 0).getTime();
      if (bt !== at) return bt - at;
      return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
    })
    .map((issue) => ({
      issue,
      listing: listingsMap[issue.listing_id],
      bidCount: bidCountsByIssueId[issue.id] ?? 0,
    }));
}
