import React from "react";
import { View, Text } from "react-native";
import { formatMoneyShort } from "@inspectly/shared";
import { dashboardHeroShadow } from "../constants/dashboardTheme";

interface EarningsHeroBandProps {
  pendingTotal: number;
  pendingCount: number;
  completedCount: number;
}

export function EarningsHeroBand({ pendingTotal, pendingCount, completedCount }: EarningsHeroBandProps) {
  const headline =
    completedCount > 0
      ? `${completedCount} completed job${completedCount !== 1 ? "s" : ""}`
      : "No completed jobs yet";

  const pendingLine =
    pendingCount > 0
      ? `${formatMoneyShort(pendingTotal)} pending across ${pendingCount} quote${pendingCount !== 1 ? "s" : ""}`
      : "Track your income and payouts";

  return (
    <View
      className="rounded-2xl border border-border/60 bg-white px-5 py-5 mb-3 shadow-hero"
      style={dashboardHeroShadow}
    >
      <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
        Earnings
      </Text>
      <Text className="text-xl font-bold text-foreground leading-snug tracking-tight">{headline}</Text>
      <Text className="text-sm text-muted-foreground mt-1.5">{pendingLine}</Text>
    </View>
  );
}
