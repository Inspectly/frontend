// Home Health scoring — shared between any UI surface that shows the score.
// Score: 100 base, deduct for problems. Floor 0, ceiling 100.
//   -3 per open issue       (signals workload, not crisis)
//   -8 per high-severity open issue  (real risk)
//  -10 per overdue user-blocked item (something is stuck)

export interface HomeHealthInputs {
  openIssues: number;
  highSeverityOpen: number;
  overdueCount: number;
}

export interface ScoreBand {
  /** Short label for the score band ("Excellent", "Good", "Fair", "Needs attention") */
  label: string;
  /** SVG stroke class for ring/donut visuals */
  ringClass: string;
  /** Foreground text class for the score number / label */
  textClass: string;
  /** Background tint class (icon tile, soft chip backgrounds) */
  bgClass: string;
  /** Border tint class for outlined chips */
  borderClass: string;
}

export const computeHomeHealthScore = ({
  openIssues,
  highSeverityOpen,
  overdueCount,
}: HomeHealthInputs): number => {
  const deductions = openIssues * 3 + highSeverityOpen * 8 + overdueCount * 10;
  return Math.max(0, Math.min(100, 100 - deductions));
};

export const getHomeHealthBand = (score: number): ScoreBand => {
  if (score >= 90) {
    return {
      label: "Excellent",
      ringClass: "stroke-emerald-500",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
    };
  }
  if (score >= 75) {
    return {
      label: "Good",
      ringClass: "stroke-primary",
      textClass: "text-primary",
      bgClass: "bg-primary/10",
      borderClass: "border-primary/20",
    };
  }
  if (score >= 50) {
    return {
      label: "Fair",
      ringClass: "stroke-amber-500",
      textClass: "text-amber-600",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-200",
    };
  }
  return {
    label: "Needs attention",
    ringClass: "stroke-rose-500",
    textClass: "text-rose-600",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
  };
};
