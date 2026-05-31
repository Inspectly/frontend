import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { dashboardHeroShadow, dashboardMetricShadow } from "../constants/dashboardTheme";
import { BrowseJobsCta } from "./BrowseJobsCta";

export interface DashboardPulseProps {
  vendorName?: string;
  companyName?: string;
  summary: string;
  pendingBids: number;
  activeJobs: number;
  visitsNeedReply: number;
  confirmedVisits: number;
  avgRating: number;
  pendingEarnings: number;
  onBrowseJobs: () => void;
  onPendingBids: () => void;
  onActiveJobs: () => void;
  onVisits: () => void;
  onEarnings: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatMoneyShort(n: number): string {
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

interface MetricCardProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: string | number;
  subtext: string;
  subtextClass?: string;
  onPress: () => void;
}

function MetricCard({
  label,
  icon,
  iconBg,
  iconColor,
  value,
  subtext,
  subtextClass = "text-muted-foreground",
  onPress,
}: MetricCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-1 bg-white rounded-2xl border border-border/60 px-4 py-3.5 shadow-card"
      style={dashboardMetricShadow}
    >
      <View className="flex-row items-start justify-between gap-2 mb-2">
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          {label}
        </Text>
        <View className={`w-7 h-7 rounded-lg items-center justify-center ${iconBg}`}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
      </View>
      <Text className="text-[26px] font-bold text-foreground leading-none">{value}</Text>
      <Text className={`text-[11px] mt-1.5 ${subtextClass}`} numberOfLines={2}>
        {subtext}
      </Text>
    </TouchableOpacity>
  );
}

export function DashboardPulse({
  vendorName,
  summary,
  pendingBids,
  activeJobs,
  visitsNeedReply,
  confirmedVisits,
  avgRating,
  pendingEarnings,
  onBrowseJobs,
  onPendingBids,
  onActiveJobs,
  onVisits,
  onEarnings,
}: DashboardPulseProps) {
  const firstName = useMemo(() => vendorName?.split(/\s+/)[0] ?? "", [vendorName]);
  const greeting = useMemo(() => getGreeting(), []);
  const isQuiet = visitsNeedReply === 0 && pendingBids === 0 && activeJobs === 0;

  const quotesSubtext =
    pendingBids === 0
      ? "No quotes pending"
      : `${formatMoneyShort(pendingEarnings)} pipeline value`;

  const activeSubtext =
    activeJobs === 0 ? "Nothing in flight" : visitsNeedReply > 0 ? `${visitsNeedReply} need visit reply` : "In flight";

  const visitsSubtext =
    visitsNeedReply > 0
      ? "Reply needed"
      : confirmedVisits > 0
      ? `${confirmedVisits} confirmed upcoming`
      : "Schedule clear";

  const earningsSubtext =
    pendingEarnings > 0
      ? "Pending quote value"
      : avgRating > 0
      ? "Average rating"
      : "No reviews yet";

  return (
    <View className="mb-5">
      <View
        className="rounded-2xl border border-border/60 bg-white px-5 py-5 mb-3 shadow-hero overflow-visible"
        style={dashboardHeroShadow}
      >
        <View className="flex-row items-center gap-3 overflow-visible">
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-2 mb-1.5 flex-wrap">
              <Text className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {greeting}
                {firstName ? `, ${firstName}` : ""}
              </Text>
              {isQuiet && (
                <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
                  <Ionicons name="sparkles" size={10} color="#6B7280" />
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    All caught up
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xl font-bold text-foreground leading-snug tracking-tight">{summary}</Text>
          </View>

          <BrowseJobsCta onPress={onBrowseJobs} />
        </View>
      </View>

      {/* KPI grid — mirrors web VendorSummaryCards (2×2 on mobile) */}
      <View className="gap-3">
        <View className="flex-row gap-3">
          <MetricCard
            label="Active Jobs"
            icon="briefcase-outline"
            iconBg="bg-amber-100"
            iconColor="#D97706"
            value={activeJobs}
            subtext={activeSubtext}
            subtextClass={activeJobs > 0 && visitsNeedReply > 0 ? "text-emerald-600 font-semibold" : "text-muted-foreground"}
            onPress={onActiveJobs}
          />
          <MetricCard
            label="Quotes Out"
            icon="document-text-outline"
            iconBg="bg-primary/15"
            iconColor="#D4A853"
            value={pendingBids}
            subtext={quotesSubtext}
            onPress={onPendingBids}
          />
        </View>
        <View className="flex-row gap-3">
          <MetricCard
            label="Visits"
            icon="calendar-outline"
            iconBg="bg-emerald-100"
            iconColor="#059669"
            value={visitsNeedReply > 0 ? visitsNeedReply : confirmedVisits}
            subtext={visitsSubtext}
            subtextClass={visitsNeedReply > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}
            onPress={onVisits}
          />
          <MetricCard
            label={pendingEarnings > 0 ? "Pipeline $" : "Avg Rating"}
            icon={pendingEarnings > 0 ? "cash-outline" : "star-outline"}
            iconBg="bg-orange-100"
            iconColor="#EA580C"
            value={pendingEarnings > 0 ? formatMoneyShort(pendingEarnings) : avgRating > 0 ? avgRating.toFixed(1) : "—"}
            subtext={earningsSubtext}
            onPress={onEarnings}
          />
        </View>
      </View>
    </View>
  );
}

export function buildDashboardSummary(input: {
  visitsNeedReply: number;
  visitsToday: number;
  pendingBids: number;
  activeJobs: number;
  newOpportunities: number;
}): string {
  const parts: string[] = [];
  if (input.visitsNeedReply > 0) {
    parts.push(
      `${input.visitsNeedReply} visit${input.visitsNeedReply === 1 ? "" : "s"} need${input.visitsNeedReply === 1 ? "s" : ""} your reply`
    );
  }
  if (input.visitsToday > 0) {
    parts.push(`${input.visitsToday} visit${input.visitsToday === 1 ? "" : "s"} today`);
  }
  if (input.pendingBids > 0) {
    parts.push(`${input.pendingBids} quote${input.pendingBids === 1 ? "" : "s"} awaiting client`);
  }
  if (parts.length === 0 && input.newOpportunities > 0) {
    parts.push(
      `${input.newOpportunities} new job${input.newOpportunities === 1 ? "" : "s"} matching your trade`
    );
  }
  if (parts.length === 0) {
    if (input.activeJobs > 0) {
      return `${input.activeJobs} project${input.activeJobs === 1 ? "" : "s"} in progress — keep up the great work.`;
    }
    return "Your plate is clear. Browse new jobs to keep the pipeline flowing.";
  }
  return parts.slice(0, 2).join(" · ") + ".";
}
