import { IssueAddress, IssueType, Listing, Vendor } from "../types";

export const MARKETPLACE_ISSUE_TYPES: { label: string; value: string }[] = [
  { label: "All Types", value: "" },
  { label: "Electrical", value: "electrical" },
  { label: "Plumbing", value: "plumbing" },
  { label: "HVAC", value: "hvac" },
  { label: "Roofing", value: "roofing" },
  { label: "Flooring", value: "flooring" },
  { label: "Painting", value: "painting" },
  { label: "Landscaping", value: "landscaping" },
  { label: "Structural", value: "structural" },
  { label: "Dry Wall", value: "dry wall" },
  { label: "Carpentry", value: "carpentry" },
  { label: "Other", value: "other" },
];

export type MarketplaceFilterMode = "all" | "exact" | "type_only" | "city_only";

const TYPE_VARIATIONS: Record<string, string[]> = {
  electrical: ["electrical", "electrician", "electric", "wiring", "outlet", "circuit"],
  plumbing: ["plumbing", "plumber", "pipe", "pipes", "water", "drain", "faucet", "toilet"],
  hvac: ["hvac", "heating", "cooling", "furnace", "ac", "air conditioning", "ventilation"],
  roofing: ["roofing", "roof", "roofer", "shingle", "shingles", "gutter", "gutters"],
  flooring: ["flooring", "floor", "floors", "carpet", "hardwood", "tile", "laminate"],
  painting: ["painting", "paint", "painter", "wall", "walls", "interior", "exterior"],
  landscaping: ["landscaping", "landscape", "landscaper", "yard", "garden", "lawn", "tree"],
  structural: ["structural", "structure", "foundation", "beam", "support", "framing", "load bearing"],
  "dry wall": ["dry wall", "drywall", "wall", "sheetrock", "gypsum", "patching", "texture"],
  carpentry: ["carpentry", "carpenter", "wood", "trim", "cabinet", "door", "window", "molding"],
  other: ["other", "misc", "miscellaneous", "general", "repair", "maintenance"],
};

const VENDOR_TYPE_TO_ISSUE: Record<string, string> = {
  electrician: "electrical",
  plumber: "plumbing",
  painter: "painting",
  roofer: "roofing",
  carpenter: "carpentry",
  landscaper: "landscaping",
  hvac: "hvac",
  general: "other",
};

export function getTypeVariations(selectedType: string): string[] {
  return TYPE_VARIATIONS[selectedType] || [selectedType];
}

export function getVendorSpecialtyAsIssueType(vendor?: Vendor | null): string | null {
  if (!vendor?.vendor_types) return null;
  const primary = vendor.vendor_types.toLowerCase().split(",")[0]?.trim();
  if (!primary) return null;
  return VENDOR_TYPE_TO_ISSUE[primary] || primary;
}

export function filterOpenUnassigned(issues: IssueType[]): IssueType[] {
  return issues.filter((issue) => {
    const status = (issue.status || "").toLowerCase().replace("status.", "");
    if (status !== "open") return false;
    if (issue.vendor_id) return false;
    return true;
  });
}

export function filterIssuesByType(issues: IssueType[], type: string): IssueType[] {
  const variations = getTypeVariations(type);
  return issues.filter((issue) => {
    const issueType = issue.type?.toLowerCase() || "";
    return variations.some(
      (variation) =>
        issueType.includes(variation.toLowerCase()) ||
        variation.toLowerCase().includes(issueType)
    );
  });
}

export function filterIssuesByCity(
  issues: IssueType[],
  city: string,
  addressMap: Record<number, IssueAddress>
): IssueType[] {
  return issues.filter((issue) => {
    const address = addressMap[issue.id];
    return address?.city?.toLowerCase() === city.toLowerCase();
  });
}

/** Mirrors web Marketplace smart filter fallbacks. */
export function applyMarketplaceFilters(
  rawIssues: IssueType[],
  selectedType: string,
  selectedCity: string,
  addressMap: Record<number, IssueAddress>
): { filteredIssues: IssueType[]; currentFilterMode: MarketplaceFilterMode } {
  if (!selectedType && !selectedCity) {
    return { filteredIssues: rawIssues, currentFilterMode: "all" };
  }

  let result = rawIssues;

  if (selectedType) {
    result = filterIssuesByType(result, selectedType);
  }

  if (selectedCity && Object.keys(addressMap).length > 0) {
    const cityFiltered = filterIssuesByCity(result, selectedCity, addressMap);

    if (cityFiltered.length > 0) {
      return { filteredIssues: cityFiltered, currentFilterMode: "exact" };
    }

    if (selectedType && result.length > 0) {
      return { filteredIssues: result, currentFilterMode: "type_only" };
    }

    if (selectedType) {
      const cityOnly = filterIssuesByCity(rawIssues, selectedCity, addressMap);
      if (cityOnly.length > 0) {
        return { filteredIssues: cityOnly, currentFilterMode: "city_only" };
      }
    }

    return { filteredIssues: rawIssues, currentFilterMode: "all" };
  }

  return { filteredIssues: result, currentFilterMode: "exact" };
}

export interface AddressIssueGroup {
  address: IssueAddress;
  issues: IssueType[];
}

export function groupIssuesByAddress(
  issues: IssueType[],
  addressMap: Record<number, IssueAddress>
): AddressIssueGroup[] {
  const groups: Record<string, AddressIssueGroup> = {};

  issues.forEach((issue) => {
    const address = addressMap[issue.id];
    if (!address) return;
    const key = `${address.address}_${address.city}_${address.state}`;
    if (!groups[key]) {
      groups[key] = { address, issues: [] };
    }
    groups[key].issues.push(issue);
  });

  return Object.values(groups);
}

export function getUniqueStates(listings: Listing[] = []): string[] {
  return [...new Set(listings.map((l) => l.state).filter(Boolean))].sort() as string[];
}

export function getUniqueCities(listings: Listing[] = [], state?: string): string[] {
  const source = state
    ? listings.filter((l) => l.state === state)
    : listings;
  return [...new Set(source.map((l) => l.city).filter(Boolean))].sort() as string[];
}
