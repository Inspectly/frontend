import React from "react";
import { Loader2, Check } from "lucide-react";
import {
  BidStage,
  BID_STAGE_LABELS,
  isWaitingStage,
} from "../utils/bidStatus";

interface BidStatusButtonProps {
  stage: BidStage;
  onClick?: (e: React.MouseEvent) => void;
  /** Render as a hard-disabled status indicator (used in the modal footer,
   *  where separate edit/delete controls handle interaction). On cards we keep
   *  it clickable so a tap still opens the detail view. */
  disabled?: boolean;
  /** Layout/sizing classes supplied by the caller (width, height, etc.). */
  className?: string;
}

/**
 * Single source of truth for the vendor's bid CTA. It morphs through the
 * lifecycle: gold call-to-action → greyed "awaiting confirmation" (with a
 * spinner) → green "accepted" (with a check).
 */
const BidStatusButton: React.FC<BidStatusButtonProps> = ({
  stage,
  onClick,
  disabled = false,
  className = "",
}) => {
  const waiting = isWaitingStage(stage);
  const accepted = stage === "offer_accepted";

  const variant = accepted
    ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
    : waiting
    ? "bg-muted text-muted-foreground border border-border"
    : "text-white bg-gold hover:bg-foreground hover:text-background";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={waiting}
      className={`flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-default ${variant} ${className}`}
    >
      {waiting && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
      {accepted && <Check className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">{BID_STAGE_LABELS[stage]}</span>
    </button>
  );
};

export default BidStatusButton;
