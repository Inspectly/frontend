import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueAddress,
  IssueType,
  formatRelativeTime,
  getIssueImageUrlsFromIssue,
  getSeverityConfig,
  normalizeAndCapitalize,
} from "@inspectly/shared";
import { IssueImageCarousel } from "./IssueImageCarousel";
import { dashboardFloatingCardShadow } from "../constants/dashboardTheme";

interface AddressGroupCardProps {
  address: IssueAddress;
  issues: IssueType[];
  onOpenIssue: (issue: IssueType, tab: "details" | "offers") => void;
  embedded?: boolean;
}

export function AddressGroupCard({ address, issues, onOpenIssue, embedded = false }: AddressGroupCardProps) {
  const [index, setIndex] = useState(0);
  const current = issues[index];
  const images = getIssueImageUrlsFromIssue(current);
  const severity = getSeverityConfig(current.severity);
  const uniqueTypes = [...new Set(issues.map((i) => i.type))];
  const typeLabel = uniqueTypes.length > 1 ? "Mixed Types" : normalizeAndCapitalize(current.type);

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : issues.length - 1));
  const next = () => setIndex((i) => (i < issues.length - 1 ? i + 1 : 0));

  const shellClassName =
    "bg-white border border-border/60 rounded-xl overflow-hidden shadow-card-float";
  const shellStyle = dashboardFloatingCardShadow;

  return (
    <View
      className={embedded ? shellClassName : `${shellClassName} mb-4`}
      style={shellStyle}
    >
      <View className="relative">
        <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenIssue(current, "details")}>
          <IssueImageCarousel images={images} height={220} rounded={false} />
        </TouchableOpacity>

        <View className="absolute bottom-3 left-3 flex-row items-center gap-2 pointer-events-none">
          <View className="bg-gray-900/90 px-3 py-1.5 rounded-lg">
            <Text className="text-xs font-semibold text-white">{typeLabel}</Text>
          </View>
          <View className="bg-primary/90 px-3 py-1.5 rounded-lg">
            <Text className="text-xs font-semibold text-white">
              {issues.length} Issue{issues.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {issues.length > 1 ? (
          <>
            <View className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                {index + 1} of {issues.length}
              </Text>
            </View>
            <View className="absolute inset-0 flex-row items-center justify-between px-3">
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/60 items-center justify-center"
                onPress={prev}
              >
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/60 items-center justify-center"
                onPress={next}
              >
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>

      <TouchableOpacity className="p-4" activeOpacity={0.9} onPress={() => onOpenIssue(current, "details")}>
          <View className="flex-row items-start justify-between mb-2">
            <Text className="font-medium text-foreground text-sm flex-1 pr-3" numberOfLines={2}>
              {current.summary}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text className="text-xs text-muted-foreground ml-1">{formatRelativeTime(current.created_at)}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text className="text-xs text-muted-foreground ml-1">{address.city}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name={severity.icon as any} size={13} color={severity.color} />
              <Text className="text-xs text-muted-foreground ml-1 capitalize">{current.severity || "medium"}</Text>
            </View>
          </View>
      </TouchableOpacity>

      <View className="px-4 pb-3">
        <TouchableOpacity
          className="bg-foreground rounded-lg py-2.5 items-center"
          onPress={() => onOpenIssue(current, "offers")}
        >
          <Text className="text-white font-semibold text-sm">Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
