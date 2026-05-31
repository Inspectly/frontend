import { IssueOffer, IssueOfferStatus, IssueType } from "../types";

export type EarningsRangeKey = "lastYear" | "12mo";

export const EARNINGS_RANGE_LABEL: Record<EarningsRangeKey, string> = {
  lastYear: "Last Year",
  "12mo": "Last 12 Months",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface EarningsChartPoint {
  month: string;
  spend: number;
  key: string;
}

export interface TopCategoryRow {
  type: string;
  amount: number;
  pct: number;
}

export interface VendorEarningsMetrics {
  confirmedEarnings: number;
  pendingTotal: number;
  pendingCount: number;
  chartData: EarningsChartPoint[];
  topCategories: TopCategoryRow[];
  hasAnySignal: boolean;
}

export const formatMoneyShort = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

export const formatMoneyFull = (n: number): string => `$${Math.round(n).toLocaleString()}`;

export function isCompletedIssueForEarnings(status?: string): boolean {
  if (!status) return false;
  const s = status.toUpperCase();
  return s === "COMPLETED" || s === "STATUS.COMPLETED" || s.includes("COMPLETED");
}

export interface VendorEarningsOverview {
  totalEarned: number;
  thisMonth: number;
  lastMonth: number;
  monthTrendPct: number;
  pendingAmount: number;
  pendingCount: number;
  completedCount: number;
}

/** All-time / this-month / pending / completed — matches web VendorEarnings stat row. */
export function computeVendorEarningsOverview(
  vendorOffers: IssueOffer[],
  issuesMap: Record<number, IssueType>
): VendorEarningsOverview {
  const accepted = vendorOffers.filter((o) => o.status === IssueOfferStatus.ACCEPTED);
  const completed = accepted.filter((o) => isCompletedIssueForEarnings(issuesMap[o.issue_id]?.status));
  const pending = accepted.filter((o) => !isCompletedIssueForEarnings(issuesMap[o.issue_id]?.status));

  const totalEarned = completed.reduce((sum, o) => sum + (o.price || 0), 0);
  const pendingAmount = pending.reduce((sum, o) => sum + (o.price || 0), 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = completed
    .filter((o) => new Date(o.updated_at || o.created_at || 0) >= thisMonthStart)
    .reduce((sum, o) => sum + (o.price || 0), 0);

  const lastMonth = completed
    .filter((o) => {
      const d = new Date(o.updated_at || o.created_at || 0);
      return d >= lastMonthStart && d < thisMonthStart;
    })
    .reduce((sum, o) => sum + (o.price || 0), 0);

  const monthTrendPct =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

  return {
    totalEarned,
    thisMonth,
    lastMonth,
    monthTrendPct,
    pendingAmount,
    pendingCount: pending.length,
    completedCount: completed.length,
  };
}

export function formatMonthTrendLabel(
  lastMonth: number,
  thisMonth: number,
  trendPct: number
): string {
  if (lastMonth > 0) {
    return `${trendPct >= 0 ? "+" : ""}${trendPct}% vs last month`;
  }
  return thisMonth > 0 ? "First earnings" : "No earnings yet";
}

export function computeVendorEarningsMetrics(
  vendorOffers: IssueOffer[],
  issuesMap: Record<number, IssueType>,
  range: EarningsRangeKey
): VendorEarningsMetrics {
  const now = new Date();
  let windowStart: Date;
  let windowEnd: Date;
  if (range === "lastYear") {
    const year = now.getFullYear() - 1;
    windowStart = new Date(year, 0, 1);
    windowEnd = new Date(year, 11, 31, 23, 59, 59);
  } else {
    windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    windowEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const acceptedInRange = vendorOffers.filter((o) => {
    if (o.status !== IssueOfferStatus.ACCEPTED) return false;
    const ts = o.updated_at || o.created_at;
    if (!ts) return false;
    const d = new Date(ts);
    return d >= windowStart && d <= windowEnd;
  });

  const confirmedEarnings = acceptedInRange.reduce((sum, o) => sum + (o.price || 0), 0);

  const pendingOffers = vendorOffers.filter(
    (o) => o.status === IssueOfferStatus.RECEIVED && typeof o.price === "number" && o.price > 0
  );
  const pendingTotal = pendingOffers.reduce((sum, o) => sum + (o.price || 0), 0);
  const pendingCount = pendingOffers.length;

  const monthCount = 12;
  const chartData: EarningsChartPoint[] = [];
  for (let i = 0; i < monthCount; i++) {
    const targetDate =
      range === "lastYear"
        ? new Date(windowStart.getFullYear(), i, 1)
        : new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);

    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

    const spend = acceptedInRange
      .filter((o) => {
        const ts = o.updated_at || o.created_at;
        if (!ts) return false;
        const d = new Date(ts);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, o) => sum + (o.price || 0), 0);

    chartData.push({
      month: MONTH_LABELS[targetDate.getMonth()],
      spend,
      key: `${targetDate.getFullYear()}-${targetDate.getMonth()}`,
    });
  }

  const byCategory: Record<string, number> = {};
  acceptedInRange.forEach((o) => {
    const type = issuesMap[o.issue_id]?.type || "other";
    byCategory[type] = (byCategory[type] || 0) + (o.price || 0);
  });
  const topCategories = Object.entries(byCategory)
    .map(([type, amount]) => ({
      type,
      amount,
      pct: confirmedEarnings > 0 ? (amount / confirmedEarnings) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  return {
    confirmedEarnings,
    pendingTotal,
    pendingCount,
    chartData,
    topCategories,
    hasAnySignal: vendorOffers.length > 0,
  };
}
