import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueType,
  useGetOffersByIssueIdQuery,
  useGetAssessmentsByIssueIdQuery,
  IssueOfferStatus,
  IssueAssessmentStatus,
  formatRelativeTime,
} from "@inspectly/shared";

interface IssueDetailProps {
  issue: IssueType;
  onClose: () => void;
}

export function IssueDetail({ issue, onClose }: IssueDetailProps) {
  const { data: offers } = useGetOffersByIssueIdQuery(issue.id);
  const { data: assessments } = useGetAssessmentsByIssueIdQuery(issue.id);

  const statusLabel = issue.status.replace("Status.", "").replace("_", " ");
  const pendingOffers = offers?.filter((o) => o.status === IssueOfferStatus.RECEIVED) ?? [];
  const acceptedOffer = offers?.find((o) => o.status === IssueOfferStatus.ACCEPTED);
  const upcomingAssessments = assessments?.filter(
    (a) => a.status !== IssueAssessmentStatus.REJECTED
  ) ?? [];

  return (
    <ScrollView className="flex-1 bg-background px-4">
      {/* Header */}
      <View className="flex-row justify-between items-center py-4">
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View className={`px-3 py-1 rounded-full ${
          issue.status === "Status.OPEN" ? "bg-primary/10" :
          issue.status === "Status.IN_PROGRESS" ? "bg-blue-100" :
          issue.status === "Status.REVIEW" ? "bg-yellow-100" : "bg-green-100"
        }`}>
          <Text className={`text-xs font-medium capitalize ${
            issue.status === "Status.OPEN" ? "text-primary" :
            issue.status === "Status.IN_PROGRESS" ? "text-blue-700" :
            issue.status === "Status.REVIEW" ? "text-yellow-700" : "text-green-700"
          }`}>{statusLabel}</Text>
        </View>
      </View>

      {/* Issue Summary */}
      <Text className="text-2xl font-bold text-foreground">{issue.summary}</Text>
      <View className="flex-row gap-2 mt-2">
        <View className="bg-muted px-3 py-1 rounded-full">
          <Text className="text-xs text-muted-foreground">{issue.type}</Text>
        </View>
        <View className="bg-muted px-3 py-1 rounded-full">
          <Text className="text-xs text-muted-foreground">{issue.severity}</Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-foreground mt-4 leading-6">{issue.description}</Text>

      {/* Images */}
      {issue.image_urls && issue.image_urls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
          {issue.image_urls.map((url, i) => (
            <Image
              key={i}
              source={{ uri: url }}
              className="w-48 h-36 rounded-xl mr-3"
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Budget */}
      {issue.cost && (
        <View className="bg-primary/10 rounded-xl p-4 mt-4">
          <Text className="text-sm text-muted-foreground">Budget</Text>
          <Text className="text-2xl font-bold text-primary">${issue.cost}</Text>
        </View>
      )}

      {/* Offers Section */}
      <View className="mt-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          Offers ({(pendingOffers.length + (acceptedOffer ? 1 : 0))})
        </Text>
        {acceptedOffer && (
          <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-green-700 font-medium">Accepted Offer</Text>
              <Text className="text-green-700 font-bold text-lg">${acceptedOffer.price}</Text>
            </View>
          </View>
        )}
        {pendingOffers.map((offer) => (
          <View key={offer.id} className="bg-white border border-border rounded-xl p-4 mb-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-foreground font-medium">Vendor #{offer.vendor_id}</Text>
              <Text className="text-primary font-bold">${offer.price}</Text>
            </View>
            {offer.comment_vendor && (
              <Text className="text-sm text-muted-foreground mt-1">{offer.comment_vendor}</Text>
            )}
            <Text className="text-xs text-muted-foreground mt-2">
              {formatRelativeTime(offer.created_at)}
            </Text>
          </View>
        ))}
        {pendingOffers.length === 0 && !acceptedOffer && (
          <View className="bg-muted rounded-xl p-4 items-center">
            <Text className="text-muted-foreground">No offers yet</Text>
          </View>
        )}
      </View>

      {/* Assessments Section */}
      <View className="mt-6 mb-8">
        <Text className="text-lg font-semibold text-foreground mb-3">
          Scheduled Visits ({upcomingAssessments.length})
        </Text>
        {upcomingAssessments.length === 0 ? (
          <View className="bg-muted rounded-xl p-4 items-center">
            <Text className="text-muted-foreground">No visits scheduled</Text>
          </View>
        ) : (
          upcomingAssessments.map((assessment) => (
            <View key={assessment.id} className="bg-white border border-border rounded-xl p-4 mb-2">
              <Text className="text-sm text-foreground font-medium">
                {new Date(assessment.start_time).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <Text className={`text-xs mt-1 font-medium ${
                assessment.status === IssueAssessmentStatus.ACCEPTED ? "text-green-600" : "text-yellow-600"
              }`}>
                {assessment.status.replace("Assessment_Status.", "")}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
