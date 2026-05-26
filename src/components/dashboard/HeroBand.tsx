import React from "react";
import { Sparkles } from "lucide-react";

interface HeroBandProps {
  greeting: string;
  firstName?: string;
  summary: string;
  /** Optional CTA slot (e.g. Create dropdown) rendered on the right. */
  cta?: React.ReactNode;
  /** Optional "All caught up" chip next to the greeting. */
  isQuiet?: boolean;
}

const HeroBand: React.FC<HeroBandProps> = ({
  greeting,
  firstName,
  summary,
  cta,
  isQuiet = false,
}) => {
  return (
    <section
      className="relative rounded-2xl border border-border shadow-hero
                 bg-card px-6 py-5 lg:px-7 lg:py-6 mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        <div className="min-w-0 flex-1">
          {/* Kicker — greeting demoted to a small label */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] lg:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </span>
            {isQuiet && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                               bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                All caught up
              </span>
            )}
          </div>

          {/* H1 — the actionable summary IS the headline */}
          <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground leading-snug tracking-tight">
            {summary}
          </h1>
        </div>

        {cta && <div className="flex-shrink-0">{cta}</div>}
      </div>
    </section>
  );
};

export default HeroBand;
