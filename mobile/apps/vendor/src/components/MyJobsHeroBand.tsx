import React from "react";
import { View, Text } from "react-native";
import { MyJobsStats } from "@inspectly/shared";
import { BrowseJobsCta } from "./BrowseJobsCta";
import { dashboardHeroShadow } from "../constants/dashboardTheme";

interface MyJobsHeroBandProps {
  stats: MyJobsStats;
  resultCount: number;
  onFindJobs: () => void;
}

export function MyJobsHeroBand({ stats, resultCount, onFindJobs }: MyJobsHeroBandProps) {
  const summary = resultCount === 1 ? "1 job shown" : `${resultCount} jobs shown`;

  return (
    <View
      className="rounded-2xl border border-border/60 bg-white px-5 py-5 mb-3 shadow-hero overflow-visible"
      style={dashboardHeroShadow}
    >
      <View className="flex-row items-center justify-between gap-3 overflow-visible">
        <View className="flex-1 min-w-0">
          <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            My Jobs
          </Text>
          <Text className="text-xl font-bold text-foreground leading-snug tracking-tight">{summary}</Text>
          <Text className="text-sm text-muted-foreground mt-1.5">
            {stats.activeCount} active · {stats.pendingCount} pending · {stats.completedCount} completed
          </Text>
        </View>

        <BrowseJobsCta onPress={onFindJobs} />
      </View>
    </View>
  );
}
