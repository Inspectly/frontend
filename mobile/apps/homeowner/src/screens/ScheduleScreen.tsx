import React from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  RootState,
  useGetAssessmentsByClientIdUsersInteractionIdQuery,
  IssueAssessmentStatus,
  useUpdateAssessmentMutation,
} from "@inspectly/shared";

export function ScheduleScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: assessments, refetch, isLoading } = useGetAssessmentsByClientIdUsersInteractionIdQuery(
    user?.id,
    { skip: !user?.id }
  );
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const confirmed = assessments?.filter((a) => a.status === IssueAssessmentStatus.ACCEPTED) ?? [];
  const pending = assessments?.filter((a) => a.status === IssueAssessmentStatus.RECEIVED) ?? [];

  const handleAccept = async (assessmentId: string) => {
    await updateAssessment({ id: assessmentId, status: IssueAssessmentStatus.ACCEPTED });
    refetch();
  };

  const handleReject = async (assessmentId: string) => {
    await updateAssessment({ id: assessmentId, status: IssueAssessmentStatus.REJECTED });
    refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
      >
        <Text className="text-2xl font-bold text-foreground mt-4">Schedule</Text>
        <Text className="text-muted-foreground mt-1 mb-6">Manage your assessment visits</Text>

        {/* Pending Visits */}
        {pending.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Pending Confirmation ({pending.length})
            </Text>
            {pending.map((assessment) => (
              <View key={assessment.id} className="bg-white border border-primary/30 rounded-xl p-4 mb-3">
                <Text className="font-semibold text-foreground">Visit #{assessment.issue_id}</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {new Date(assessment.start_time).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-lg py-3 items-center"
                    onPress={() => handleAccept(assessment.id)}
                  >
                    <Text className="text-primary-foreground font-semibold">Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-muted rounded-lg py-3 items-center"
                    onPress={() => handleReject(assessment.id)}
                  >
                    <Text className="text-muted-foreground font-semibold">Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Confirmed Visits */}
        <Text className="text-lg font-semibold text-foreground mt-4 mb-3">
          Confirmed Visits ({confirmed.length})
        </Text>
        {confirmed.length === 0 ? (
          <View className="bg-muted rounded-xl p-6 items-center mb-6">
            <Text className="text-muted-foreground">No confirmed visits yet</Text>
          </View>
        ) : (
          confirmed.map((assessment) => (
            <View key={assessment.id} className="bg-white border border-border rounded-xl p-4 mb-3">
              <Text className="font-semibold text-foreground">Visit #{assessment.issue_id}</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {new Date(assessment.start_time).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <Text className="text-xs text-primary font-medium mt-1">Confirmed</Text>
            </View>
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
