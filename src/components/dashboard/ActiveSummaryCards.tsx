import React, { useMemo } from "react";
import { Briefcase, FileText, AlertCircle, Shield } from "lucide-react";
import {
  computeHomeHealthScore,
  getHomeHealthBand,
  HomeHealthInputs,
} from "../../utils/homeHealth";

interface ActiveSummaryCardsProps {
  activeIssuesTotal: number;
  needsAttentionCount: number;
  pendingQuotesTotal: number;
  pendingQuotesAmount: number;
  activeProjectsTotal: number;
  inProgressCount: number;
  /** Raw inputs for the Home Health score (4th card). */
  homeHealth: HomeHealthInputs & { totalIssues: number };
  onClickActiveIssues: () => void;
  onClickPendingQuotes: () => void;
  onClickActiveProjects: () => void;
  onClickHomeHealth: () => void;
}

const formatMoney = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
};

interface MetricCardProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  /** Either a number (rendered tabular) or any ReactNode (e.g. a colored score). */
  value: React.ReactNode;
  subtext: React.ReactNode;
  onClick: () => void;
}

// Compact KPI card — sized so 4 of these stacked vertically at xl roughly
// match the natural height the previous 3-card stack had.
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
    {/* Header row: label + icon */}
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-tight">
        {label}
      </span>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
    </div>

    {/* Big number + subtext */}
    <div className="flex flex-col gap-1">
      <div className="font-display text-[26px] font-bold text-foreground leading-none tabular-nums">
        {value}
      </div>
      <div className="text-[11px] leading-snug min-h-[1rem]">{subtext}</div>
    </div>
  </button>
);

const ActiveSummaryCards: React.FC<ActiveSummaryCardsProps> = ({
  activeIssuesTotal,
  needsAttentionCount,
  pendingQuotesTotal,
  pendingQuotesAmount,
  activeProjectsTotal,
  inProgressCount,
  homeHealth,
  onClickActiveIssues,
  onClickPendingQuotes,
  onClickActiveProjects,
  onClickHomeHealth,
}) => {
  const score = useMemo(() => computeHomeHealthScore(homeHealth), [homeHealth]);
  const band = useMemo(() => getHomeHealthBand(score), [score]);

  // Compact one-liner explaining the score (mirrors the full HomeHealthScoreCard logic)
  const homeHealthSubtext = useMemo<React.ReactNode>(() => {
    if (homeHealth.totalIssues === 0) {
      return <span className="text-muted-foreground">No projects yet</span>;
    }
    if (score === 100) {
      return <span className={`font-semibold ${band.textClass}`}>Excellent — all clear</span>;
    }
    const bits: string[] = [];
    if (homeHealth.overdueCount > 0) bits.push(`${homeHealth.overdueCount} overdue`);
    if (homeHealth.highSeverityOpen > 0) bits.push(`${homeHealth.highSeverityOpen} high sev`);
    if (bits.length === 0 && homeHealth.openIssues > 0) bits.push(`${homeHealth.openIssues} open`);
    return (
      <span>
        <span className={`font-semibold ${band.textClass}`}>{band.label}</span>
        {bits.length > 0 && (
          <>
            <span className="text-muted-foreground/60"> · </span>
            <span className="text-muted-foreground">{bits.join(" · ")}</span>
          </>
        )}
      </span>
    );
  }, [homeHealth, score, band]);

  // Keep the strip visible whenever there's any signal — including Home Health,
  // which is meaningful even when other counts are zero.
  if (
    activeIssuesTotal === 0 &&
    pendingQuotesTotal === 0 &&
    activeProjectsTotal === 0 &&
    homeHealth.totalIssues === 0
  ) {
    return null;
  }

  return (
    // 1-up on narrow, 2-up grid on sm/lg, 1-up vertical stack at xl+.
    // At xl the cards stay at NATURAL (compact) height so 4 of them roughly
    // equal the previous 3-card natural height — AP follows via the
    // absolute-fill wiring in ClientDashboard.
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-1 gap-3 xl:gap-2.5">
      {/* Active Issues — total funnel + "needs attention" callout */}
      <MetricCard
        label="Active Issues"
        icon={AlertCircle}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        value={activeIssuesTotal}
        onClick={onClickActiveIssues}
        subtext={
          needsAttentionCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-rose-600">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {needsAttentionCount} need{needsAttentionCount !== 1 ? "" : "s"} attention
            </span>
          ) : (
            <span className="text-muted-foreground">All caught up</span>
          )
        }
      />

      {/* Pending Quotes — decision queue + $ on the table */}
      <MetricCard
        label="Pending Quotes"
        icon={FileText}
        iconBg="bg-amber-100"
        iconColor="text-amber-700"
        value={pendingQuotesTotal}
        onClick={onClickPendingQuotes}
        subtext={
          pendingQuotesTotal === 0 ? (
            <span className="text-muted-foreground">No quotes to review</span>
          ) : pendingQuotesAmount > 0 ? (
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatMoney(pendingQuotesAmount)}
              </span>
              <span className="text-muted-foreground"> in offers</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Awaiting prices</span>
          )
        }
      />

      {/* Active Projects — contracted work */}
      <MetricCard
        label="Active Projects"
        icon={Briefcase}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-700"
        value={activeProjectsTotal}
        onClick={onClickActiveProjects}
        subtext={
          activeProjectsTotal === 0 ? (
            <span className="text-muted-foreground">Nothing in flight</span>
          ) : inProgressCount > 0 ? (
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {inProgressCount}
              </span>
              <span className="text-muted-foreground"> in progress</span>
            </span>
          ) : (
            <span className="text-muted-foreground">All paused or pending</span>
          )
        }
      />

      {/* Home Health — derived score, colored by band */}
      <MetricCard
        label="Home Health"
        icon={Shield}
        iconBg={band.bgClass}
        iconColor={band.textClass}
        value={
          <span className={`${band.textClass}`}>
            {score}
            <span className="text-base font-semibold text-muted-foreground/70 ml-0.5">/100</span>
          </span>
        }
        subtext={homeHealthSubtext}
        onClick={onClickHomeHealth}
      />
    </div>
  );
};

export default ActiveSummaryCards;
