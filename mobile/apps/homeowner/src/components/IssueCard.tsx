import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IssueType, formatRelativeTime } from "@inspectly/shared";

interface IssueCardProps {
  issue: IssueType;
  onPress: () => void;
}

export function IssueCard({ issue, onPress }: IssueCardProps) {
  const statusLabel = issue.status.replace("Status.", "").replace("_", " ");

  return (
    <TouchableOpacity
      className="bg-white border border-border rounded-xl p-4 mb-3"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="font-semibold text-foreground" numberOfLines={1}>
            {issue.summary}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
            {issue.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
      <View className="flex-row justify-between items-center mt-3">
        <View className="flex-row items-center gap-2">
          <View className="bg-muted px-2 py-1 rounded">
            <Text className="text-xs text-muted-foreground">{issue.type}</Text>
          </View>
          <View className={`px-2 py-1 rounded ${
            issue.status === "Status.OPEN" ? "bg-primary/10" : "bg-blue-100"
          }`}>
            <Text className={`text-xs font-medium capitalize ${
              issue.status === "Status.OPEN" ? "text-primary" : "text-blue-700"
            }`}>{statusLabel}</Text>
          </View>
        </View>
        {issue.cost && (
          <Text className="text-xs font-medium text-primary">${issue.cost}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
