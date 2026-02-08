/**
 * Shared style constants for consistent styling across the application.
 */

export const GOLD = {
  BG: "bg-gold",
  BG_SOFT: "bg-gold-200",
  TEXT: "text-gold",
  BORDER: "border-gold",
  RING: "ring-gold-300",
};

export const CARD_HOVER = {
  LIFT: "transition-all duration-200 ease-out transform-gpu hover:-translate-y-1 hover:shadow-xl",
  LIFT_SCALE: "transition-all duration-200 ease-out transform-gpu hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl",
  LIFT_GOLD_BORDER: "transition-all duration-200 border-l-4 border-transparent hover:border-gold hover:shadow-md hover:-translate-y-0.5",
  DARK_ON_HOVER: "hover:bg-foreground hover:text-background transition",
};

export const BUTTON_HOVER = "hover:bg-foreground hover:text-background transition";

export const SELECTED = {
  GOLD_BG: "bg-gold-200",
};

export const CARD_STYLES = {
  STAT_CARD: `bg-white rounded-xl p-5 border border-gray-200 cursor-pointer ${CARD_HOVER.LIFT_GOLD_BORDER}`,
  LIST_ITEM: `group p-4 bg-gray-50 rounded-xl cursor-pointer ${CARD_HOVER.LIFT_GOLD_BORDER}`,
  CONTENT_CARD: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300",
};
