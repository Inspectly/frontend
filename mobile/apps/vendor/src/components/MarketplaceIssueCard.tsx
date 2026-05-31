import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueType,
  IssueAddress,
  formatRelativeTime,
  getIssueImageUrlsFromIssue,
  normalizeAndCapitalize,
  getSeverityConfig,
} from "@inspectly/shared";
import { IssueImageCarousel } from "./IssueImageCarousel";
import { dashboardFloatingCardShadow } from "../constants/dashboardTheme";

interface MarketplaceIssueCardProps {
  issue: IssueType;
  address?: IssueAddress;
  onPress: () => void;
  onQuote: () => void;
  /** When true, renders inside a section card without its own outer shell. */
  embedded?: boolean;
}

export function MarketplaceIssueCard({
  issue,
  address,
  onPress,
  onQuote,
  embedded = false,
}: MarketplaceIssueCardProps) {
  const images = getIssueImageUrlsFromIssue(issue);
  const severity = getSeverityConfig(issue.severity);

  const shellClassName =
    "bg-white border border-border/60 rounded-xl overflow-hidden shadow-card-float";
  const shellStyle = dashboardFloatingCardShadow;

  return (
    <View
      className={embedded ? shellClassName : `${shellClassName} mb-4`}
      style={shellStyle}
    >
      <View>
        <IssueImageCarousel images={images} height={180} rounded={false} />
        <View className="absolute bottom-3 left-3 bg-gray-900/90 px-3 py-1.5 rounded-lg">
          <Text className="text-xs font-semibold text-white">{normalizeAndCapitalize(issue.type)}</Text>
        </View>
      </View>

      <TouchableOpacity className="px-4 pt-3 pb-3" activeOpacity={0.9} onPress={onPress}>
        <View className="flex-row items-start justify-between">
          <Text className="font-semibold text-foreground text-sm flex-1 pr-3" numberOfLines={2}>
            {issue.summary}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text className="text-xs text-muted-foreground ml-1">{formatRelativeTime(issue.created_at)}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text className="text-xs text-muted-foreground ml-1">{address?.city || "—"}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name={severity.icon as any} size={13} color={severity.color} />
              <Text className="text-xs text-muted-foreground ml-1 capitalize">{issue.severity || "medium"}</Text>
            </View>
          </View>
          {issue.cost ? (
            <View className="bg-primary/10 rounded-lg px-2.5 py-1">
              <Text className="text-primary font-bold text-xs">${issue.cost}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View className="px-4 pb-3">
        <TouchableOpacity className="bg-foreground rounded-lg py-2.5 items-center" onPress={onQuote}>
          <Text className="text-white font-semibold text-sm">Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
