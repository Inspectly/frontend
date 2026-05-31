import React from "react";
import { View, Text } from "react-native";
import { dashboardHeroShadow } from "../constants/dashboardTheme";

interface MarketplaceHeroBandProps {
  totalJobs: number;
}

export function MarketplaceHeroBand({ totalJobs }: MarketplaceHeroBandProps) {
  const jobsLabel =
    totalJobs === 1 ? "1 open job available" : `${totalJobs} open jobs available`;

  return (
    <View
      className="rounded-2xl border border-border/60 bg-white px-5 py-5 mb-3 shadow-hero"
      style={dashboardHeroShadow}
    >
      <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
        Marketplace
      </Text>
      <Text className="text-xl font-bold text-foreground leading-snug tracking-tight">{jobsLabel}</Text>
    </View>
  );
}
