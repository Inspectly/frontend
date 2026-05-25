import React from "react";
import { Briefcase, FileText, DollarSign, Star } from "lucide-react";

interface VendorSummaryCardsProps {
  activeJobsTotal: number;
  /** Count of jobs scheduled or in-progress this week — helps "Active Jobs" feel momentum-y. */
  activeJobsThisWeek: number;
  quotesOutTotal: number;
  /** Sum of pending bid prices ($) so the vendor sees their pipeline value at a glance. */
  quotesOutAmount: number;
  thisMonthEarnings: number;
  /** Last calendar month's earnings — used for the YoY-style % delta. */
  lastMonthEarnings: number;
  avgRating: number;
  reviewCount: number;
  onClickActiveJobs: () => void;
  onClickQuotesOut: () => void;
  onClickEarnings: () => void;
  onClickRating: () => void;
}

const formatMoneyShort = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
};

interface MetricCardProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  value: React.ReactNode;
  subtext: React.ReactNode;
  onClick: () => void;
}

// Compact KPI tile — 4 of these stack vertically at xl so the overall column
// height matches Active Jobs to the left. Same shape as the homeowner's
// MetricCard so the visual cadence is consistent across dashboards.
const MetricCard: React.FC<MetricCardProps> = ({
  label,
  icon: Icon,
  iconBg,
  iconColor,
  value,
  subtext,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="group relative text-left overflow-hidden rounded-2xl
               bg-card border border-border/60 shadow-card
               hover:shadow-card-hover hover:-translate-y-0.5 hover:border-border
               transition-all duration-150 px-4 py-3.5
               flex flex-col justify-between gap-2 h-full"
  >
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
        {label}
      </span>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
    </div>

    <div className="flex flex-col gap-1">
      <div className="font-display text-[26px] font-bold text-foreground leading-none tabular-nums">
        {value}
      </div>
      <div className="text-[11px] leading-snug min-h-[1rem]">{subtext}</div>
    </div>
  </button>
);

const VendorSummaryCards: React.FC<VendorSummaryCardsProps> = ({
  activeJobsTotal,
  activeJobsThisWeek,
  quotesOutTotal,
  quotesOutAmount,
  thisMonthEarnings,
  lastMonthEarnings,
  avgRating,
  reviewCount,
  onClickActiveJobs,
  onClickQuotesOut,
  onClickEarnings,
  onClickRating,
}) => {
  // ── Subtext for each card — designed to be a single line of "why this number matters".
  const activeJobsSubtext: React.ReactNode =
    activeJobsTotal === 0 ? (
      <span className="text-muted-foreground">Nothing in flight</span>
    ) : activeJobsThisWeek > 0 ? (
      <span className="text-emerald-600 font-semibold">+{activeJobsThisWeek} this week</span>
    ) : (
      <span className="text-muted-foreground">In flight</span>
    );

  const quotesOutSubtext: React.ReactNode =
    quotesOutTotal === 0 ? (
      <span className="text-muted-foreground">No quotes pending</span>
    ) : (
      <span>
        <span className="font-semibold text-foreground tabular-nums">
          {formatMoneyShort(quotesOutAmount)}
        </span>
        <span className="text-muted-foreground"> pipeline value</span>
      </span>
    );

  const earningsSubtext: React.ReactNode = (() => {
    if (lastMonthEarnings === 0 && thisMonthEarnings === 0) {
      return <span className="text-muted-foreground">No earnings yet</span>;
    }
    if (lastMonthEarnings === 0) {
      return <span className="text-emerald-600 font-semibold">First earnings!</span>;
    }
    const pct = Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100);
    const isUp = pct >= 0;
    return (
      <span className={isUp ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
        {isUp ? "+" : ""}
        {pct}% vs last month
      </span>
    );
  })();

  const ratingSubtext: React.ReactNode =
    reviewCount === 0 ? (
      <span className="text-muted-foreground">No reviews yet</span>
    ) : (
      <span className="text-muted-foreground">
        {reviewCount} review{reviewCount === 1 ? "" : "s"}
      </span>
    );

  return (
    // 4-card responsive grid:
    //  - 1-up on narrow phones (col),
    //  - 2-up on sm,
    //  - 4-up on lg (so it fits the bottom of a tablet view),
    //  - 1-up STACKED on xl so it sits as a sidebar next to Active Jobs.
    // `auto-rows-fr` + `items-stretch` keep all 4 cards the same height even
    // when their subtext wraps differently.
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-1 gap-3 auto-rows-fr items-stretch h-full">
      <MetricCard
        label="Active Jobs"
        icon={Briefcase}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        value={activeJobsTotal}
        subtext={activeJobsSubtext}
        onClick={onClickActiveJobs}
      />
      <MetricCard
        label="Quotes Out"
        icon={FileText}
        iconBg="bg-primary/15"
        iconColor="text-primary"
        value={quotesOutTotal}
        subtext={quotesOutSubtext}
        onClick={onClickQuotesOut}
      />
      <MetricCard
        label="This Month"
        icon={DollarSign}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        value={formatMoneyShort(thisMonthEarnings)}
        subtext={earningsSubtext}
        onClick={onClickEarnings}
      />
      <MetricCard
        label="Avg Rating"
        icon={Star}
        iconBg="bg-orange-100"
        iconColor="text-orange-500"
        value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
        subtext={ratingSubtext}
        onClick={onClickRating}
      />
    </div>
  );
};

export default VendorSummaryCards;
