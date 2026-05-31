import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import {
  IssueAssessment,
  IssueAssessmentStatus,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@inspectly/shared";

interface AssessmentCardProps {
  assessment: IssueAssessment;
  showActions?: boolean;
  onRefresh?: () => void;
}

export function AssessmentCard({ assessment, showActions = false, onRefresh }: AssessmentCardProps) {
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();

  const statusColor =
    assessment.status === IssueAssessmentStatus.ACCEPTED
      ? "bg-green-100 text-green-700"
      : assessment.status === IssueAssessmentStatus.REJECTED
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  const statusLabel = assessment.status.replace("Assessment_Status.", "");

  const handleDelete = () => {
    Alert.alert("Cancel Visit", "Are you sure you want to cancel this visit?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAssessment({
              id: Number(assessment.id),
              issue_id: assessment.issue_id,
              interaction_id: assessment.interaction_id,
              user_id: assessment.user_id,
            }).unwrap();
            onRefresh?.();
          } catch {
            Alert.alert("Error", "Failed to cancel the visit");
          }
        },
      },
    ]);
  };

  return (
    <View className="bg-white border border-border rounded-xl p-4 mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-semibold text-foreground">Issue #{assessment.issue_id}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {new Date(assessment.start_time).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {new Date(assessment.start_time).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            –{" "}
            {new Date(assessment.end_time).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded ${statusColor.split(" ")[0]}`}>
          <Text className={`text-xs font-medium ${statusColor.split(" ")[1]}`}>
            {statusLabel}
          </Text>
        </View>
      </View>
      {showActions && assessment.status === IssueAssessmentStatus.RECEIVED && (
        <TouchableOpacity
          className="mt-3 bg-destructive/10 rounded-lg py-2 items-center"
          onPress={handleDelete}
        >
          <Text className="text-destructive font-medium text-sm">Cancel Visit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
