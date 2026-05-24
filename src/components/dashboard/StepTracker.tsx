import React from "react";

export type TrackerStep = 1 | 2 | 3 | 4 | 5;

export const TRACKER_LABELS = ["Posted", "Quoted", "Scheduled", "Working", "Done"] as const;

interface StepTrackerProps {
  currentStep: TrackerStep;
  /** When true, paints the active segment in destructive color (overdue treatment). */
  overdue?: boolean;
  /** Override the label shown next to the tracker (e.g. "Pending your approval"). */
  labelOverride?: string;
  className?: string;
}

const StepTracker: React.FC<StepTrackerProps> = ({
  currentStep,
  overdue = false,
  labelOverride,
  className = "",
}) => {
  const label = labelOverride ?? TRACKER_LABELS[currentStep - 1];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center gap-1 flex-1 max-w-[140px]">
        {[1, 2, 3, 4, 5].map((step) => {
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const isFuture = step > currentStep;
          return (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                isActive
                  ? overdue
                    ? "bg-rose-500"
                    : "bg-primary"
                  : isCompleted
                  ? overdue
                    ? "bg-rose-300"
                    : "bg-primary/50"
                  : isFuture
                  ? "bg-muted-foreground/15"
                  : ""
              }`}
            />
          );
        })}
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
          overdue ? "text-rose-600" : "text-foreground/70"
        }`}
      >
        {label}
        <span className="text-muted-foreground font-semibold ml-1.5">
          {currentStep}/5
        </span>
      </span>
    </div>
  );
};

export default StepTracker;
