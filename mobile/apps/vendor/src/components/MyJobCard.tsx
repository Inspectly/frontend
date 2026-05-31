import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueOffer,
  IssueOfferStatus,
  IssueType,
  Listing,
  ProcessedVisit,
  buildVendorJobMeta,
  isIssueCompleted,
  normalizeAndCapitalize,
  getIssueImageUrlsFromIssue,
  formatRelativeTime,
} from "@inspectly/shared";
import { StepTracker } from "./StepTracker";
import { dashboardCardShadow } from "../constants/dashboardTheme";

interface MyJobCardProps {
  offer: IssueOffer;
  issue?: IssueType;
  listing?: Listing;
  visit?: ProcessedVisit;
  isDisputed: boolean;
  onPress: () => void;
}

function StatusBadge({
  offer,
  issue,
  isDisputed,
}: {
  offer: IssueOffer;
  issue?: IssueType;
  isDisputed: boolean;
}) {
  if (isDisputed) {
    return (
      <View className="flex-row items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200">
        <Ionicons name="alert-circle-outline" size={12} color="#ea580c" />
        <Text className="text-[10px] font-semibold text-orange-700 ml-1">Disputed</Text>
      </View>
    );
  }

  if (offer.status === IssueOfferStatus.REJECTED) {
    return (
      <View className="flex-row items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
        <Ionicons name="close-circle-outline" size={12} color="#dc2626" />
        <Text className="text-[10px] font-semibold text-red-700 ml-1">Rejected</Text>
      </View>
    );
  }

  if (offer.status === IssueOfferStatus.ACCEPTED) {
    if (isIssueCompleted(issue?.status)) {
      return (
        <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <Ionicons name="checkmark-circle-outline" size={12} color="#059669" />
          <Text className="text-[10px] font-semibold text-emerald-700 ml-1">Completed</Text>
        </View>
      );
    }
    if ((issue?.status ?? "").toUpperCase().includes("REVIEW")) {
      return (
        <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <Ionicons name="hourglass-outline" size={12} color="#059669" />
          <Text className="text-[10px] font-semibold text-emerald-700 ml-1">Awaiting Approval</Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
        <Ionicons name="construct-outline" size={12} color="#2563eb" />
        <Text className="text-[10px] font-semibold text-blue-700 ml-1">Work in Progress</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
      <Ionicons name="paper-plane-outline" size={12} color="#b45309" />
      <Text className="text-[10px] font-semibold text-amber-800 ml-1">Bid Sent</Text>
    </View>
  );
}

function VisitPill({ visit }: { visit: ProcessedVisit }) {
  const dateStr = visit.startTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (visit.category === "confirmed") {
    return (
      <View className="self-start flex-row items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 mt-2">
        <Ionicons name="calendar-outline" size={12} color="#059669" />
        <Text className="text-[10px] font-medium text-emerald-700 ml-1">Visit: {dateStr}</Text>
      </View>
    );
  }

  if (visit.category === "action_required") {
    return (
      <View className="self-start flex-row items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 mt-2">
        <Ionicons name="calendar-outline" size={12} color="#b45309" />
        <Text className="text-[10px] font-medium text-amber-800 ml-1">Client proposed: {dateStr}</Text>
      </View>
    );
  }

  return (
    <View className="self-start flex-row items-center px-2.5 py-1 rounded-full bg-muted border border-border mt-2">
      <Ionicons name="calendar-outline" size={12} color="#6B7280" />
      <Text className="text-[10px] font-medium text-muted-foreground ml-1">Proposed: {dateStr}</Text>
    </View>
  );
}

export function MyJobCard({ offer, issue, listing, visit, isDisputed, onPress }: MyJobCardProps) {
  const images = issue ? getIssueImageUrlsFromIssue(issue) : [];
  const thumb = images[0] || listing?.image_url;
  const meta = issue ? buildVendorJobMeta(offer, issue, listing, visit) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white border border-border/60 rounded-xl overflow-hidden mb-3 shadow-card"
      style={[dashboardCardShadow, { borderLeftWidth: 3, borderLeftColor: meta?.isOverdue ? "#f43f5e" : "#D4A853" }]}
    >
      <View className="flex-row p-3 gap-3">
        <View className="w-20 h-16 rounded-lg bg-muted overflow-hidden">
          {thumb ? (
            <Image source={{ uri: thumb }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="image-outline" size={20} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="font-semibold text-foreground text-sm flex-1" numberOfLines={2}>
              {issue?.summary || `${normalizeAndCapitalize(issue?.type || "Job")} Issue`}
            </Text>
            <Text className="text-base font-bold text-foreground">${offer.price?.toLocaleString() ?? 0}</Text>
          </View>

          <View className="flex-row items-center gap-2 mt-1 flex-wrap">
            <View className="px-2 py-0.5 rounded bg-muted border border-border">
              <Text className="text-[10px] font-medium text-muted-foreground">
                {normalizeAndCapitalize(issue?.type || "General")}
              </Text>
            </View>
            <StatusBadge offer={offer} issue={issue} isDisputed={isDisputed} />
          </View>

          {offer.status === IssueOfferStatus.ACCEPTED && listing ? (
            <Text className="text-xs text-muted-foreground mt-1.5" numberOfLines={1}>
              {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")}
            </Text>
          ) : null}

          {meta ? (
            <StepTracker
              currentStep={meta.step}
              overdue={meta.isOverdue}
              stage={meta.stage}
            />
          ) : null}

          {visit ? <VisitPill visit={visit} /> : null}

          <Text className="text-[11px] text-muted-foreground mt-2">
            Submitted {formatRelativeTime(offer.created_at)}
          </Text>
        </View>
      </View>

      {offer.status === IssueOfferStatus.REJECTED && offer.comment_client ? (
        <View className="mx-3 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-xs text-red-700">
            <Text className="font-semibold">Client feedback: </Text>
            {offer.comment_client}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
