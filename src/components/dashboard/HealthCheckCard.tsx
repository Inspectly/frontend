import React from "react";
import { Activity } from "lucide-react";

interface HealthCheckCardProps {
  needsYou: number;
  inProgress: number;
  resolved: number;
}

const HealthCheckCard: React.FC<HealthCheckCardProps> = ({ needsYou, inProgress, resolved }) => {
  const total = needsYou + inProgress + resolved;
  if (total === 0) return null;

  const rows = [
    {
      label: "Needs you",
      value: needsYou,
      dot: "bg-amber-500",
      tint: "bg-amber-50",
      text: needsYou > 0 ? "text-amber-700" : "text-muted-foreground",
    },
    {
      label: "In progress",
      value: inProgress,
      dot: "bg-blue-500",
      tint: "bg-blue-50",
      text: inProgress > 0 ? "text-blue-700" : "text-muted-foreground",
    },
    {
      label: "Resolved",
      value: resolved,
      dot: "bg-emerald-500",
      tint: "bg-emerald-50",
      text: resolved > 0 ? "text-emerald-700" : "text-muted-foreground",
    },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Health Check</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {total} project{total !== 1 ? "s" : ""} tracked
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
              row.value > 0 ? row.tint : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${row.dot} ${row.value === 0 ? "opacity-40" : ""}`} />
              <span className={`text-sm font-medium ${row.text}`}>{row.label}</span>
            </div>
            <span
              className={`font-display text-lg font-bold tabular-nums ${
                row.value > 0 ? row.text : "text-muted-foreground/50"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthCheckCard;
