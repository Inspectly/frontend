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
    // NOTE: do not put `overflow-hidden` on this section — it would clip CTA
    // dropdowns that drop below the hero. The radial glow is clipped by its
    // own absolute-positioned wrapper below.
    <section
      className="relative rounded-2xl border border-primary/15 shadow-hero
                 bg-gradient-to-br from-card via-card to-primary/[0.07]
                 px-6 py-5 lg:px-7 lg:py-6 mb-6"
    >
      {/* Soft gold radial glow in upper-right — clipped to the rounded
          rectangle by its own wrapper so the section itself can stay
          overflow-visible (needed for dropdown CTAs in the slot). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <div
          className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl
                     bg-primary/10 -translate-y-1/2 translate-x-1/4"
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        <div className="min-w-0 flex-1">
          {/* Kicker — greeting demoted to a small label */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] lg:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {greeting}{firstName ? `, ${firstName}` : ""}
            </span>
            {isQuiet && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                               bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
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
