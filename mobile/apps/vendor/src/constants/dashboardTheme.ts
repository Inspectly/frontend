import { Platform, ViewStyle } from "react-native";

/** Matches web `.bg-dashboard .shadow-card` — neutral contained lift. */
export const dashboardCardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#140F05",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 4 },
  default: {},
}) as ViewStyle;

/** Stronger lift for floating list cards (marketplace issues, job cards). */
export const dashboardFloatingCardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#140F05",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  android: { elevation: 9 },
  default: {},
}) as ViewStyle;

/** Matches web `.bg-dashboard .shadow-hero`. */
export const dashboardHeroShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#140F05",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  android: { elevation: 6 },
  default: {},
}) as ViewStyle;

export const dashboardMetricShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#140F05",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
  default: {},
}) as ViewStyle;

/** Upward lift for bottom tab bar — mirrors shadow-card on the footer. */
export const dashboardTabBarShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#140F05",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 10 },
  default: {},
}) as ViewStyle;

/** Floating footer pill — same lift as floating list cards. */
export const dashboardFloatingTabBarShadow: ViewStyle = dashboardFloatingCardShadow;

export const FLOATING_TAB_BAR_HEIGHT = 70;
export const FLOATING_TAB_BAR_H_MARGIN = 14;

/** Active tab pill in the footer. */
export const dashboardTabItemShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#140F05",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
  default: {},
}) as ViewStyle;

/** Shared outer card shell — mirrors web `bg-card rounded-2xl border border-border/60 shadow-card`. */
export const DASHBOARD_SECTION_CLASS =
  "mb-6 bg-white rounded-2xl border border-border/60 overflow-hidden shadow-card";

/** Section shell that allows floating child cards (shadows not clipped). */
export const DASHBOARD_SECTION_FLOATING_CLASS =
  "mb-6 bg-white rounded-2xl border border-border/60 shadow-card";

export const DASHBOARD_PAGE_BG = "bg-neutral-100";
