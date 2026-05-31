import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueOffer,
  IssueType,
  Listing,
  IssueAssessment,
  VendorJob,
  buildVendorJobs,
  ProcessedVisit,
  STAGE_PILL,
  STAGE_ACCENT,
  OVERDUE_ACCENT,
  normalizeAndCapitalize,
  getIssueTypeIonicon,
  formatRelativeTime,
  getJobActivityTime,
  useUpdateOfferMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@inspectly/shared";
import { StepTracker } from "./StepTracker";
import { DashboardSectionCard } from "./DashboardSectionCard";

type Tab = "active" | "visits";

interface VendorActiveJobsCardProps {
  vendorOffers: IssueOffer[];
  issuesMap: Record<number, IssueType>;
  listingsMap: Record<number, Listing>;
  processedVisits: ProcessedVisit[];
  onOpenIssue: (issueId: number, tab?: "details" | "offers" | "schedule" | "dispute") => void;
  onBrowseJobs: () => void;
  onViewAll: () => void;
  refetchAssessments?: () => void;
  previewLimit?: number;
}

function showToast(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function VendorActiveJobsCard({
  vendorOffers,
  issuesMap,
  listingsMap,
  processedVisits,
  onOpenIssue,
  onBrowseJobs,
  onViewAll,
  refetchAssessments,
  previewLimit = 5,
}: VendorActiveJobsCardProps) {
  const [updateOffer] = useUpdateOfferMutation();
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();
  const [pendingVisitId, setPendingVisitId] = useState<number | null>(null);

  const jobs = useMemo(
    () => buildVendorJobs(vendorOffers, issuesMap, listingsMap, processedVisits),
    [vendorOffers, issuesMap, listingsMap, processedVisits]
  );

  const counts = useMemo(() => {
    const c = { active: 0, visits: 0 };
    jobs.forEach((j) => {
      if (j.stage === "in-progress") c.active += 1;
      if (j.stage === "visit-action-required") c.visits += 1;
    });
    return c;
  }, [jobs]);

  const initialTab: Tab = counts.visits > 0 ? "visits" : "active";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (counts.visits > 0) setActiveTab("visits");
    else if (counts.active > 0) setActiveTab("active");
  }, [counts.visits, counts.active]);

  const filtered = useMemo(() => {
    if (activeTab === "active") return jobs.filter((j) => j.stage === "in-progress");
    return jobs.filter((j) => j.stage === "visit-action-required");
  }, [jobs, activeTab]);

  const acceptVisit = async (job: VendorJob) => {
    const clientProposal = job.visit?.allAssessments.find(
      (a) =>
        (a.status as string)?.toLowerCase().includes("received") &&
        a.user_type !== "vendor"
    );
    if (!clientProposal) {
      onOpenIssue(job.issue.id, "schedule");
      return;
    }
    setPendingVisitId(Number(clientProposal.id));
    try {
      await updateAssessment({ ...clientProposal, status: "accepted" }).unwrap();
      showToast("Success", "Visit confirmed");
      refetchAssessments?.();
    } catch {
      showToast("Error", "Could not accept visit");
    } finally {
      setPendingVisitId(null);
    }
  };

  const declineVisit = async (job: VendorJob) => {
    const clientProposal = job.visit?.allAssessments.find(
      (a) =>
        (a.status as string)?.toLowerCase().includes("received") &&
        a.user_type !== "vendor"
    );
    if (!clientProposal) return;
    setPendingVisitId(Number(clientProposal.id));
    try {
      await deleteAssessment({
        id: Number(clientProposal.id),
        issue_id: clientProposal.issue_id,
        interaction_id: clientProposal.users_interaction_id,
      }).unwrap();
      showToast("Success", "Counter-proposal declined");
      refetchAssessments?.();
    } catch {
      showToast("Error", "Could not decline visit");
    } finally {
      setPendingVisitId(null);
    }
  };

  const renderJob = (job: VendorJob) => {
    const pill = STAGE_PILL[job.stage];
    const accent = job.isOverdue ? OVERDUE_ACCENT : STAGE_ACCENT[job.stage];
    const icon = getIssueTypeIonicon(job.issue.type);
    const title = job.issue.summary || normalizeAndCapitalize(job.issue.type);
    const addressShort = job.listing?.address?.split(",")[0] || "Property";
    const activityIso = new Date(getJobActivityTime(job)).toISOString();
    const metaLine =
      job.stage === "visit-action-required" && job.daysWaiting != null && job.daysWaiting > 0
        ? `${addressShort} · ${job.daysWaiting}d waiting`
        : `${addressShort} · Updated ${formatRelativeTime(activityIso)}`;

    return (
      <TouchableOpacity
        key={job.offer.id}
        className="rounded-xl p-3"
        style={{ borderLeftWidth: 3, borderLeftColor: accent }}
        activeOpacity={0.85}
        onPress={() =>
          onOpenIssue(
            job.issue.id,
            job.stage.startsWith("visit") ? "schedule" : "details"
          )
        }
      >
        <View className="flex-row items-start gap-3">
          <View className="w-10 h-10 rounded-lg bg-muted items-center justify-center">
            <Ionicons name={icon as any} size={18} color="#6B7280" />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-start gap-2">
              <Text className="font-semibold text-foreground flex-1" numberOfLines={1}>
                {title}
              </Text>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: pill.bg, borderWidth: 1, borderColor: pill.border }}>
                <Text className="text-[10px] font-medium" style={{ color: pill.fg }}>
                  {pill.label}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground mt-1">
              {metaLine}
            </Text>
            {job.isVendorBlocked && (
              <View
                className="self-start mt-1 px-1.5 py-0.5 rounded"
                style={{ backgroundColor: job.isOverdue ? "#ffe4e6" : "#fef3c7" }}
              >
                <Text className="text-[9px] font-bold uppercase" style={{ color: job.isOverdue ? "#be123c" : "#b45309" }}>
                  {job.isOverdue ? "Overdue" : "Needs you"}
                </Text>
              </View>
            )}
            <StepTracker
              currentStep={job.step}
              overdue={job.isOverdue}
              stage={job.stage}
            />
          </View>
        </View>

        {job.stage === "visit-action-required" && (
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              className="flex-1 bg-foreground rounded-lg py-2.5 items-center"
              onPress={() => acceptVisit(job)}
              disabled={pendingVisitId != null}
            >
              {pendingVisitId != null ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-sm">Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 border border-border rounded-lg py-2.5 items-center"
              onPress={() => declineVisit(job)}
              disabled={pendingVisitId != null}
            >
              <Text className="text-destructive font-semibold text-sm">Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <DashboardSectionCard>
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-border/60">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center">
            <Ionicons name="briefcase" size={18} color="#D4A853" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-semibold text-foreground">Active Jobs</Text>
            <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {counts.active + counts.visits === 0
                ? "All caught up"
                : `${counts.active + counts.visits} need${counts.active + counts.visits === 1 ? "s" : ""} attention`}
            </Text>
          </View>
        </View>
        {(filtered.length > 0 || jobs.length > 0) && (
          <TouchableOpacity onPress={onViewAll} className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold text-muted-foreground">View all</Text>
            <Ionicons name="arrow-forward" size={12} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View className="p-3">
      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === "active" ? "bg-primary" : "bg-muted"}`}
          onPress={() => setActiveTab("active")}
        >
          <Text className={`text-sm font-semibold ${activeTab === "active" ? "text-white" : "text-muted-foreground"}`}>
            Active work ({counts.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === "visits" ? "bg-primary" : "bg-muted"}`}
          onPress={() => setActiveTab("visits")}
        >
          <Text className={`text-sm font-semibold ${activeTab === "visits" ? "text-white" : "text-muted-foreground"}`}>
            Visits ({counts.visits})
          </Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View className="bg-muted rounded-xl p-6 items-center">
          <Ionicons name="sparkles-outline" size={24} color="#9CA3AF" />
          <Text className="text-muted-foreground mt-2 text-center">
            {activeTab === "active" ? "No active jobs right now" : "No visits need your reply"}
          </Text>
          <TouchableOpacity className="bg-foreground rounded-lg px-4 py-2.5 mt-3" onPress={onBrowseJobs}>
            <Text className="text-white font-semibold text-sm">Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="gap-1">{filtered.slice(0, previewLimit).map(renderJob)}</View>
      )}
      </View>
    </DashboardSectionCard>
  );
}
