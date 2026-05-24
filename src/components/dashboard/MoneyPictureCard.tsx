import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, ChevronRight, ChevronDown } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { IssueOffer, IssueOfferStatus, IssueType } from "../../types";
import { getIssueTypeIcon, normalizeAndCapitalize } from "../../utils/typeNormalizer";

interface MoneyPictureCardProps {
  /** All offers across this homeowner's issues, keyed by issue_id. */
  offersByIssueId: Record<number, IssueOffer[]>;
  /** Issues used to look up the type/category of each spend. */
  issues: IssueType[];
}

type RangeKey = "ytd" | "12mo";

const RANGE_LABEL: Record<RangeKey, string> = {
  ytd: "This Year",
  "12mo": "Last 12 Months",
};

const formatMoneyShort = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

const formatMoneyFull = (n: number): string => `$${Math.round(n).toLocaleString()}`;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MoneyPictureCard: React.FC<MoneyPictureCardProps> = ({ offersByIssueId, issues }) => {
  const [range, setRange] = useState<RangeKey>("ytd");
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);

  const issueTypeById = useMemo(() => {
    const map: Record<number, string> = {};
    issues.forEach((i) => { map[i.id] = i.type || "other"; });
    return map;
  }, [issues]);

  const {
    confirmedSpend,
    pendingTotal,
    pendingCount,
    chartData,
    topCategories,
    hasAnySignal,
  } = useMemo(() => {
    const allOffers = Object.values(offersByIssueId).flat();
    const now = new Date();

    // Build the (start, end) window
    let windowStart: Date;
    if (range === "ytd") {
      windowStart = new Date(now.getFullYear(), 0, 1);
    } else {
      // last 12 calendar months, inclusive of current month
      windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }
    const windowEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const acceptedInRange = allOffers.filter((o) => {
      if (o.status !== IssueOfferStatus.ACCEPTED) return false;
      const ts = (o as any).updated_at || (o as any).created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d >= windowStart && d <= windowEnd;
    });

    const confirmedSpend = acceptedInRange.reduce((sum, o) => sum + (o.price || 0), 0);

    // Pending — open quotes still in review (range-agnostic; pending is "now" data)
    const pendingOffers = allOffers.filter(
      (o) => o.status === IssueOfferStatus.RECEIVED && typeof o.price === "number" && o.price > 0
    );
    const pendingTotal = pendingOffers.reduce((sum, o) => sum + (o.price || 0), 0);
    const pendingCount = pendingOffers.length;

    // Build month buckets for the chart
    const monthCount = range === "ytd" ? now.getMonth() + 1 : 12;
    const startMonthOffset = range === "ytd" ? 0 : 11;

    const chartData: { month: string; spend: number; key: string }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const refDate =
        range === "ytd"
          ? new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1)
          : new Date(now.getFullYear(), now.getMonth() - i, 1);

      // For YTD we want chronological Jan→Now order
      const targetDate = range === "ytd"
        ? new Date(now.getFullYear(), i, 1)
        : new Date(now.getFullYear(), now.getMonth() - (startMonthOffset - i), 1);

      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
      const spend = acceptedInRange
        .filter((o) => {
          const ts = (o as any).updated_at || (o as any).created_at;
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
      // refDate is only here to keep the eslint pleasing; mark used
      void refDate;
    }

    // Top categories — by issue.type within range
    const byCategory: Record<string, number> = {};
    acceptedInRange.forEach((o) => {
      const type = issueTypeById[o.issue_id] || "other";
      byCategory[type] = (byCategory[type] || 0) + (o.price || 0);
    });
    const topCategories = Object.entries(byCategory)
      .map(([type, amount]) => ({
        type,
        amount,
        pct: confirmedSpend > 0 ? (amount / confirmedSpend) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    const hasAnySignal = allOffers.length > 0;

    return {
      confirmedSpend,
      pendingTotal,
      pendingCount,
      chartData,
      topCategories,
      hasAnySignal,
    };
  }, [offersByIssueId, range, issueTypeById]);

  if (!hasAnySignal) return null;

  const hasChart = chartData.some((d) => d.spend > 0);

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Spending Overview</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Confirmed payments
            </p>
          </div>
        </div>

        {/* Range selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setRangeMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setRangeMenuOpen(false), 120)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                       bg-card border border-border text-xs font-semibold text-foreground
                       hover:bg-muted transition-colors"
          >
            {RANGE_LABEL[range]}
            <ChevronDown className={`w-3 h-3 transition-transform ${rangeMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {rangeMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-lg border border-border shadow-card-hover py-1 z-20">
              {(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => { setRange(k); setRangeMenuOpen(false); }}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors ${
                    range === k ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {RANGE_LABEL[k]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* TOTAL SPEND */}
        <div>
          <div className="font-display text-3xl font-bold text-foreground tabular-nums leading-none">
            {formatMoneyFull(confirmedSpend)}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            Total spend
            {pendingCount > 0 && (
              <>
                <span className="mx-1.5 text-muted-foreground/50">·</span>
                <span className="text-foreground font-semibold tabular-nums">{formatMoneyShort(pendingTotal)}</span>
                <span> pending across {pendingCount} quote{pendingCount !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>

        {/* AREA CHART */}
        {hasChart ? (
          <div className="-ml-2">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => formatMoneyShort(v)}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "6px 10px",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}
                  formatter={(value: number) => [formatMoneyFull(value), "Spend"]}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                  activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-center">
            <div className="text-xs text-muted-foreground">No spend yet in this period</div>
          </div>
        )}

        {/* TOP CATEGORIES */}
        {topCategories.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Top Categories
            </div>
            <div className="space-y-2">
              {topCategories.map(({ type, amount, pct }) => (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={getIssueTypeIcon(type)} className="text-primary text-xs" />
                  </div>
                  <div className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                    {normalizeAndCapitalize(type)}
                  </div>
                  <div className="text-sm font-semibold text-foreground tabular-nums">
                    {formatMoneyFull(amount)}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    {pct.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          to="/offers?filter=accepted"
          className="group flex items-center justify-between w-full px-3 py-2 -mx-1 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <span className="text-xs font-semibold text-foreground">View payments</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
};

export default MoneyPictureCard;
