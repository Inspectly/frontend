import React from "react";
import { View, Text } from "react-native";
import { dashboardHeroShadow } from "../constants/dashboardTheme";

interface SettingsHeroBandProps {
  vendorName?: string;
  businessType?: string;
  verified?: boolean;
}

export function SettingsHeroBand({ vendorName, businessType, verified }: SettingsHeroBandProps) {
  const headline = vendorName?.trim() || "Your profile";

  const statusParts = [
    businessType,
    verified ? "Verified" : "Pending verification",
  ].filter(Boolean);

  return (
    <View
      className="rounded-2xl border border-border/60 bg-white px-5 py-5 mb-3 shadow-hero"
      style={dashboardHeroShadow}
    >
      <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
        Settings
      </Text>
      <Text className="text-xl font-bold text-foreground leading-snug tracking-tight">{headline}</Text>
      <Text className="text-sm text-muted-foreground mt-1.5">
        {statusParts.length > 0 ? `${statusParts.join(" · ")} · ` : ""}
        Manage your profile and preferences
      </Text>
    </View>
  );
}
