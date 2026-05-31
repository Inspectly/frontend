import React, { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  RootState,
  useGetAssessmentsByUserIdQuery,
  useGetIssuesQuery,
  useGetListingsQuery,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  IssueType,
  Listing,
  ScheduleEvent,
  buildScheduleEvents,
} from "@inspectly/shared";
import { ScheduleCard } from "../components/ScheduleCard";
import { IssueDetailModal } from "../components/IssueDetailModal";

export function ScheduleScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: assessments, refetch } = useGetAssessmentsByUserIdQuery(Number(user?.id), {
    skip: !user?.id,
  });
  const { data: issues } = useGetIssuesQuery();
  const { data: listings } = useGetListingsQuery();
  const [updateAssessment, { isLoading: isUpdatingAssessment }] = useUpdateAssessmentMutation();
  const [deleteAssessment, { isLoading: isDeletingAssessment }] = useDeleteAssessmentMutation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const issuesMap = useMemo(() => {
    const map: Record<number, IssueType> = {};
    (issues ?? []).forEach((i) => {
      map[i.id] = i;
    });
    return map;
  }, [issues]);

  const listingsMap = useMemo(() => {
    const map: Record<number, Listing> = {};
    (listings ?? []).forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [listings]);

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(assessments ?? [], issuesMap, listingsMap),
    [assessments, issuesMap, listingsMap]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const showToast = (title: string, message: string) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleAcceptScheduleEvent = async (event: ScheduleEvent) => {
    try {
      await updateAssessment({
        id: event.id,
        issue_id: event.issue_id,
        user_id: event.user_id,
        user_type: event.user_type,
        interaction_id: event.users_interaction_id,
        users_interaction_id: event.users_interaction_id,
        start_time: event.start_time,
        end_time: event.end_time,
        status: "accepted",
        min_assessment_time: event.min_assessment_time,
        user_last_viewed: new Date().toISOString(),
      }).unwrap();
      showToast("Success", "Visit accepted");
      await refetch();
    } catch {
      showToast("Error", "Failed to accept the visit. Please try again.");
    }
  };

  const handleCancelScheduleProposal = async (event: ScheduleEvent) => {
    try {
      await deleteAssessment({
        id: Number(event.id),
        issue_id: event.issue_id,
        interaction_id: event.users_interaction_id,
      }).unwrap();
      showToast("Success", "Proposal cancelled");
      await refetch();
    } catch {
      showToast("Error", "Failed to cancel proposal. Please try again.");
    }
  };

  const handleProposeScheduleTime = (event: ScheduleEvent) => {
    const issue = issuesMap[event.issue_id];
    if (!issue) return;
    setSelectedIssue(issue);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <IssueDetailModal
        visible={modalVisible}
        issue={selectedIssue}
        defaultTab="schedule"
        onClose={() => setModalVisible(false)}
      />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
      >
        <ScheduleCard
          events={scheduleEvents}
          currentUserId={Number(user?.id)}
          isUpdatingAssessment={isUpdatingAssessment}
          isDeletingAssessment={isDeletingAssessment}
          onAccept={handleAcceptScheduleEvent}
          onProposeTime={handleProposeScheduleTime}
          onCancelProposal={handleCancelScheduleProposal}
          expanded
        />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
