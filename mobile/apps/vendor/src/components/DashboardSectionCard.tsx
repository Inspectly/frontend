import React from "react";
import { View, ViewProps } from "react-native";
import { dashboardCardShadow, DASHBOARD_SECTION_CLASS, DASHBOARD_SECTION_FLOATING_CLASS } from "../constants/dashboardTheme";

interface DashboardSectionCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  /** Use when children are individual floating cards — avoids clipping their shadows. */
  floatingChildren?: boolean;
}

/** Outer shell for dashboard list cards — web `shadow-card` parity. */
export function DashboardSectionCard({
  children,
  className = "",
  floatingChildren = false,
  style,
  ...rest
}: DashboardSectionCardProps) {
  const shellClass = floatingChildren ? DASHBOARD_SECTION_FLOATING_CLASS : DASHBOARD_SECTION_CLASS;

  return (
    <View
      className={`${shellClass} ${className}`}
      style={[dashboardCardShadow, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
