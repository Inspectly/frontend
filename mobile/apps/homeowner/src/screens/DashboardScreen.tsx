import React from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  RootState,
  useGetIssuesQuery,
  useGetListingByUserIdQuery,
  useGetAssessmentsByClientIdUsersInteractionIdQuery,
} from "@inspectly/shared";

export function DashboardScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings, refetch: refetchListings } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: issues, refetch: refetchIssues } = useGetIssuesQuery();
  const { data: assessments, refetch: refetchAssessments } = useGetAssessmentsByClientIdUsersInteractionIdQuery(
    user?.id,
    { skip: !user?.id }
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchListings(), refetchIssues(), refetchAssessments()]);
    setRefreshing(false);
  }, [refetchListings, refetchIssues, refetchAssessments]);

  const myIssues = React.useMemo(
    () => issues?.filter((i) => listings?.some((l) => l.id === i.listing_id)) ?? [],
    [issues, listings]
  );

  const activeIssues = myIssues.filter(
    (i) => i.status === "Status.OPEN" || i.status === "Status.IN_PROGRESS"
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
      >
        <Text className="text-2xl font-bold text-foreground mt-4">Dashboard</Text>
        <Text className="text-muted-foreground mt-1 mb-6">Welcome back!</Text>

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-primary/10 rounded-xl p-4">
            <Text className="text-3xl font-bold text-primary">{listings?.length ?? 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">Properties</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-4">
            <Text className="text-3xl font-bold text-primary">{activeIssues.length}</Text>
            <Text className="text-sm text-muted-foreground mt-1">Active Issues</Text>
          </View>
          <View className="flex-1 bg-primary/10 rounded-xl p-4">
            <Text className="text-3xl font-bold text-primary">{assessments?.length ?? 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">Visits</Text>
          </View>
        </View>

        {/* Active Projects */}
        <Text className="text-lg font-semibold text-foreground mb-3">Active Projects</Text>
        {activeIssues.length === 0 ? (
          <View className="bg-muted rounded-xl p-6 items-center mb-6">
            <Text className="text-muted-foreground">No active projects</Text>
          </View>
        ) : (
          activeIssues.slice(0, 5).map((issue) => (
            <View key={issue.id} className="bg-white border border-border rounded-xl p-4 mb-3">
              <Text className="font-semibold text-foreground">{issue.summary}</Text>
              <Text className="text-sm text-muted-foreground mt-1">{issue.type}</Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-primary font-medium">
                  {issue.status === "Status.OPEN" ? "Open" : "In Progress"}
                </Text>
                {issue.cost && (
                  <Text className="text-xs text-muted-foreground">${issue.cost}</Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* Upcoming Visits */}
        <Text className="text-lg font-semibold text-foreground mt-4 mb-3">Upcoming Visits</Text>
        {!assessments || assessments.length === 0 ? (
          <View className="bg-muted rounded-xl p-6 items-center mb-6">
            <Text className="text-muted-foreground">No scheduled visits</Text>
          </View>
        ) : (
          assessments.slice(0, 3).map((assessment) => (
            <View key={assessment.id} className="bg-white border border-border rounded-xl p-4 mb-3">
              <Text className="font-semibold text-foreground">
                Visit #{assessment.issue_id}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {new Date(assessment.start_time).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <Text className="text-xs text-primary font-medium mt-1">
                {assessment.status.replace("Assessment_Status.", "")}
              </Text>
            </View>
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
