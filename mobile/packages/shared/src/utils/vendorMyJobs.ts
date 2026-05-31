import { IssueOffer, IssueOfferStatus, IssueType } from "../types";

export type MyJobsTab = "all" | "active" | "completed" | "pending" | "rejected" | "disputed";
export type MyJobsSort = "date" | "price" | "status";

export const MY_JOBS_TABS: { label: string; value: MyJobsTab }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
  { label: "Disputed", value: "disputed" },
];

export const MY_JOBS_SORT_OPTIONS: { label: string; value: MyJobsSort }[] = [
  { label: "Sort by Date", value: "date" },
  { label: "Sort by Price", value: "price" },
  { label: "Sort by Priority", value: "status" },
];

export function isIssueCompleted(issueStatus?: string): boolean {
  if (!issueStatus) return false;
  const normalized = issueStatus.toUpperCase();
  return normalized === "COMPLETED" || normalized === "STATUS.COMPLETED";
}

export interface MyJobsStats {
  activeCount: number;
  completedCount: number;
  pendingCount: number;
  rejectedCount: number;
  disputedCount: number;
  totalOffers: number;
}

export function computeMyJobsStats(
  offers: IssueOffer[],
  issuesMap: Record<number, IssueType>,
  disputedOfferIds: Set<number>
): MyJobsStats {
  const acceptedOffers = offers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);

  const activeCount = acceptedOffers.filter((offer) => {
    const issue = issuesMap[offer.issue_id];
    return !isIssueCompleted(issue?.status);
  }).length;

  const completedCount = offers.filter((offer) => {
    const issue = issuesMap[offer.issue_id];
    return isIssueCompleted(issue?.status) && !disputedOfferIds.has(offer.id);
  }).length;

  const pendingCount = offers.filter((offer) => {
    if (offer.status !== IssueOfferStatus.RECEIVED) return false;
    const issue = issuesMap[offer.issue_id];
    return !isIssueCompleted(issue?.status);
  }).length;

  const rejectedCount = offers.filter((o) => o.status === IssueOfferStatus.REJECTED).length;
  const disputedCount = offers.filter((o) => disputedOfferIds.has(o.id)).length;

  return {
    activeCount,
    completedCount,
    pendingCount,
    rejectedCount,
    disputedCount,
    totalOffers: offers.length,
  };
}

function tabCount(stats: MyJobsStats, tab: MyJobsTab): number | null {
  switch (tab) {
    case "active":
      return stats.activeCount;
    case "completed":
      return stats.completedCount;
    case "pending":
      return stats.pendingCount;
    case "rejected":
      return stats.rejectedCount;
    case "disputed":
      return stats.disputedCount;
    default:
      return null;
  }
}

export function getMyJobsTabLabel(tab: MyJobsTab, stats: MyJobsStats): string {
  const base = MY_JOBS_TABS.find((t) => t.value === tab)?.label ?? tab;
  const count = tabCount(stats, tab);
  return count !== null ? `${base} (${count})` : base;
}

function getStatusPriority(offer: IssueOffer, issuesMap: Record<number, IssueType>): number {
  if (offer.status === IssueOfferStatus.RECEIVED) return 1;
  if (offer.status === IssueOfferStatus.ACCEPTED) {
    const issueStatus = issuesMap[offer.issue_id]?.status?.toUpperCase() || "";
    if (issueStatus.includes("IN_PROGRESS")) return 2;
    if (issueStatus.includes("REVIEW")) return 3;
    if (issueStatus.includes("COMPLETED")) return 4;
    return 2;
  }
  if (offer.status === IssueOfferStatus.REJECTED) return 5;
  return 6;
}

/** Mirrors web VendorJobsPage filter + sort. */
export function filterAndSortMyJobsOffers(input: {
  offers: IssueOffer[];
  issuesMap: Record<number, IssueType>;
  disputedOfferIds: Set<number>;
  activeTab: MyJobsTab;
  searchQuery: string;
  sortBy: MyJobsSort;
}): IssueOffer[] {
  const { offers, issuesMap, disputedOfferIds, activeTab, searchQuery, sortBy } = input;
  let filtered = [...offers];

  if (activeTab === "active") {
    filtered = filtered.filter((offer) => {
      if (offer.status !== IssueOfferStatus.ACCEPTED) return false;
      return !isIssueCompleted(issuesMap[offer.issue_id]?.status);
    });
  } else if (activeTab === "completed") {
    filtered = filtered.filter((offer) => {
      const issue = issuesMap[offer.issue_id];
      return isIssueCompleted(issue?.status) && !disputedOfferIds.has(offer.id);
    });
  } else if (activeTab === "pending") {
    filtered = filtered.filter((offer) => {
      if (offer.status !== IssueOfferStatus.RECEIVED) return false;
      return !isIssueCompleted(issuesMap[offer.issue_id]?.status);
    });
  } else if (activeTab === "rejected") {
    filtered = filtered.filter((offer) => offer.status === IssueOfferStatus.REJECTED);
  } else if (activeTab === "disputed") {
    filtered = filtered.filter((offer) => disputedOfferIds.has(offer.id));
  }

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((offer) => {
      const issue = issuesMap[offer.issue_id];
      return (
        issue?.type?.toLowerCase().includes(q) ||
        issue?.summary?.toLowerCase().includes(q)
      );
    });
  }

  filtered.sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "price") {
      return (b.price || 0) - (a.price || 0);
    }
    const priorityA = getStatusPriority(a, issuesMap);
    const priorityB = getStatusPriority(b, issuesMap);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return filtered;
}
