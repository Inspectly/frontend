import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  VendorEarningsOverview,
  formatMoneyFull,
  formatMonthTrendLabel,
} from "@inspectly/shared";
import { dashboardMetricShadow } from "../constants/dashboardTheme";

interface EarningsStatCardsProps {
  overview: VendorEarningsOverview;
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  footnote: string;
}

function StatCard({ icon, iconBg, iconColor, value, label, footnote }: StatCardProps) {
  return (
    <View
      className="flex-1 bg-white rounded-xl border border-border/60 p-4 shadow-card"
      style={dashboardMetricShadow}
    >
      <View className={`w-10 h-10 rounded-lg items-center justify-center mb-3 ${iconBg}`}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text className="text-2xl font-bold text-foreground leading-none">{value}</Text>
      <Text className="text-sm text-muted-foreground mt-1">{label}</Text>
      <Text className="text-xs font-medium text-primary mt-2">{footnote}</Text>
    </View>
  );
}

/** 2×2 KPI grid — mirrors web VendorEarnings stat cards. */
export function EarningsStatCards({ overview }: EarningsStatCardsProps) {
  const monthFootnote = formatMonthTrendLabel(
    overview.lastMonth,
    overview.thisMonth,
    overview.monthTrendPct
  );

  return (
    <View className="gap-3 mb-4">
      <View className="flex-row gap-3">
        <StatCard
          icon="cash-outline"
          iconBg="bg-emerald-100"
          iconColor="#059669"
          value={formatMoneyFull(overview.totalEarned)}
          label="Total Earned"
          footnote="All time"
        />
        <StatCard
          icon="trending-up-outline"
          iconBg="bg-primary/15"
          iconColor="#D4A853"
          value={formatMoneyFull(overview.thisMonth)}
          label="This Month"
          footnote={monthFootnote}
        />
      </View>
      <View className="flex-row gap-3">
        <StatCard
          icon="time-outline"
          iconBg="bg-primary/15"
          iconColor="#D4A853"
          value={formatMoneyFull(overview.pendingAmount)}
          label="Pending"
          footnote={`${overview.pendingCount} payment${overview.pendingCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon="checkmark-circle-outline"
          iconBg="bg-blue-100"
          iconColor="#2563eb"
          value={String(overview.completedCount)}
          label="Completed Jobs"
          footnote="Since joining"
        />
      </View>
    </View>
  );
}
