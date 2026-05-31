import React, { useMemo } from "react";
import { ScrollView, RefreshControl, Platform, Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  RootState,
  useGetVendorByVendorUserIdQuery,
  useGetOffersByVendorIdQuery,
  useGetAssessmentsByUserIdQuery,
  useGetIssuesQuery,
  useGetListingsQuery,
  useGetVendorReviewsByVendorUserIdQuery,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  IssueOfferStatus,
  IssueType,
  Listing,
  ScheduleEvent,
  buildProcessedVisits,
  buildScheduleEvents,
  buildVendorJobs,
  buildMarketplaceOpportunities,
} from "@inspectly/shared";
import { IssueDetailModal } from "../components/IssueDetailModal";
import { DashboardPulse, buildDashboardSummary } from "../components/DashboardPulse";
import { NewJobOpportunitiesCard } from "../components/NewJobOpportunitiesCard";
import { VendorActiveJobsCard } from "../components/VendorActiveJobsCard";
import { ScheduleCard } from "../components/ScheduleCard";
import { DashboardStackParamList } from "../navigation/DashboardStack";
import { DASHBOARD_PAGE_BG } from "../constants/dashboardTheme";

const isCompleted = (status?: string) => !!status && status.toLowerCase().includes("completed");

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: vendor } = useGetVendorByVendorUserIdQuery(user?.id?.toString(), { skip: !user?.id });
  const { data: offers, refetch: refetchOffers } = useGetOffersByVendorIdQuery(Number(user?.id), {
    skip: !user?.id,
  });
  const { data: assessments, refetch: refetchAssessments } = useGetAssessmentsByUserIdQuery(Number(user?.id), {
    skip: !user?.id,
  });
  const { data: issues } = useGetIssuesQuery();
  const { data: listings } = useGetListingsQuery();
  const { data: reviews } = useGetVendorReviewsByVendorUserIdQuery(Number(user?.id), { skip: !user?.id });
  const [updateAssessment, { isLoading: isUpdatingAssessment }] = useUpdateAssessmentMutation();
  const [deleteAssessment, { isLoading: isDeletingAssessment }] = useDeleteAssessmentMutation();
  const [refreshing, setRefreshing] = React.useState(false);

  const [selectedIssue, setSelectedIssue] = React.useState<IssueType | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalTab, setModalTab] = React.useState<"details" | "offers" | "schedule" | "dispute">("details");

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

  const processedVisits = useMemo(
    () => buildProcessedVisits(assessments ?? [], issuesMap, listingsMap, Number(user?.id)),
    [assessments, issuesMap, listingsMap, user?.id]
  );

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(assessments ?? [], issuesMap, listingsMap),
    [assessments, issuesMap, listingsMap]
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchOffers(), refetchAssessments()]);
    setRefreshing(false);
  }, [refetchOffers, refetchAssessments]);

  const pendingBids = useMemo(() => offers?.filter((o) => o.status === IssueOfferStatus.RECEIVED) ?? [], [offers]);
  const acceptedOffers = useMemo(() => offers?.filter((o) => o.status === IssueOfferStatus.ACCEPTED) ?? [], [offers]);
  const activeJobs = useMemo(
    () => acceptedOffers.filter((o) => !isCompleted(issuesMap[o.issue_id]?.status)),
    [acceptedOffers, issuesMap]
  );

  const outstanding = pendingBids.reduce((sum, o) => sum + (o.price || 0), 0);

  const avgRating = useMemo(() => {
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0);
      return sum / reviews.length;
    }
    return vendor?.rating ? parseFloat(vendor.rating) : 0;
  }, [reviews, vendor?.rating]);

  const vendorJobs = useMemo(
    () => buildVendorJobs(offers ?? [], issuesMap, listingsMap, processedVisits),
    [offers, issuesMap, listingsMap, processedVisits]
  );

  const visitsNeedReply = useMemo(
    () => vendorJobs.filter((j) => j.stage === "visit-action-required").length,
    [vendorJobs]
  );

  const activeInProgress = useMemo(
    () => vendorJobs.filter((j) => j.stage === "in-progress").length,
    [vendorJobs]
  );

  const confirmedVisitsCount = useMemo(
    () => processedVisits.filter((v) => v.category === "confirmed").length,
    [processedVisits]
  );

  const visitsToday = useMemo(() => {
    const today = new Date();
    return scheduleEvents.filter((e) => isSameDay(e.start, today)).length;
  }, [scheduleEvents]);

  const newOpportunities = useMemo(
    () => buildMarketplaceOpportunities(issues ?? [], listingsMap, vendor, offers ?? []).length,
    [issues, listingsMap, vendor, offers]
  );

  const summary = useMemo(
    () =>
      buildDashboardSummary({
        visitsNeedReply,
        visitsToday,
        pendingBids: pendingBids.length,
        activeJobs: activeJobs.length,
        newOpportunities,
      }),
    [visitsNeedReply, visitsToday, pendingBids.length, activeJobs.length, newOpportunities]
  );

  const hasActionQueue = visitsNeedReply > 0 || activeInProgress > 0;

  const openIssue = (issueId: number, tab: "details" | "offers" | "schedule" | "dispute" = "details") => {
    const issue = issuesMap[issueId];
    if (!issue) return;
    setSelectedIssue(issue);
    setModalTab(tab);
    setModalVisible(true);
  };

  const goToMarketplace = () => navigation.getParent()?.navigate("Marketplace");
  const goToMyJobs = () => navigation.getParent()?.navigate("MyJobs", { tab: "active" });
  const goToEarnings = () => navigation.getParent()?.navigate("Earnings");
  const goToSchedule = () => navigation.navigate("Schedule");

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
      await refetchAssessments();
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
      await refetchAssessments();
    } catch {
      showToast("Error", "Failed to cancel proposal. Please try again.");
    }
  };

  const handleProposeScheduleTime = (event: ScheduleEvent) => {
    openIssue(event.issue_id, "schedule");
  };

  const activeJobsCard = (
    <VendorActiveJobsCard
      key="active-jobs"
      vendorOffers={offers ?? []}
      issuesMap={issuesMap}
      listingsMap={listingsMap}
      processedVisits={processedVisits}
      onOpenIssue={openIssue}
      onBrowseJobs={goToMarketplace}
      onViewAll={goToMyJobs}
      refetchAssessments={refetchAssessments}
      previewLimit={3}
    />
  );

  const scheduleCard = (
    <ScheduleCard
      key="schedule"
      events={scheduleEvents}
      currentUserId={Number(user?.id)}
      isUpdatingAssessment={isUpdatingAssessment}
      isDeletingAssessment={isDeletingAssessment}
      onAccept={handleAcceptScheduleEvent}
      onProposeTime={handleProposeScheduleTime}
      onCancelProposal={handleCancelScheduleProposal}
      onViewAll={goToSchedule}
    />
  );

  const opportunitiesCard = (
    <NewJobOpportunitiesCard
      key="opportunities"
      issues={issues ?? []}
      listingsMap={listingsMap}
      vendor={vendor}
      vendorOffers={offers ?? []}
      onOpenIssue={openIssue}
      onViewAll={goToMarketplace}
      previewLimit={3}
    />
  );

  const mainSections = hasActionQueue
    ? [activeJobsCard, scheduleCard, opportunitiesCard]
    : [opportunitiesCard, activeJobsCard, scheduleCard];

  return (
    <SafeAreaView className={`flex-1 ${DASHBOARD_PAGE_BG}`} edges={["top"]}>
      <IssueDetailModal
        visible={modalVisible}
        issue={selectedIssue}
        defaultTab={modalTab}
        onClose={() => setModalVisible(false)}
      />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
      >
        <DashboardPulse
          vendorName={vendor?.name}
          companyName={vendor?.company_name}
          summary={summary}
          pendingBids={pendingBids.length}
          activeJobs={activeJobs.length}
          visitsNeedReply={visitsNeedReply}
          confirmedVisits={confirmedVisitsCount}
          avgRating={avgRating}
          pendingEarnings={outstanding}
          onBrowseJobs={goToMarketplace}
          onPendingBids={goToMyJobs}
          onActiveJobs={goToMyJobs}
          onVisits={goToSchedule}
          onEarnings={goToEarnings}
        />

        {mainSections}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
