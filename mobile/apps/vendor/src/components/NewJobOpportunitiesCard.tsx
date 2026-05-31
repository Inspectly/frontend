import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueOffer,
  IssueType,
  Listing,
  Vendor,
  buildMarketplaceOpportunities,
  formatRelativeTime,
  normalizeAndCapitalize,
  getIssueImageUrlsFromIssue,
  getOffersByIssueId,
} from "@inspectly/shared";
import { useDispatch } from "react-redux";
import { DashboardSectionCard } from "./DashboardSectionCard";

interface NewJobOpportunitiesCardProps {
  issues: IssueType[];
  listingsMap: Record<number, Listing>;
  vendor?: Vendor | null;
  vendorOffers: IssueOffer[];
  onOpenIssue: (issueId: number, tab?: "details" | "offers") => void;
  onViewAll: () => void;
  previewLimit?: number;
}

export function NewJobOpportunitiesCard({
  issues,
  listingsMap,
  vendor,
  vendorOffers,
  onOpenIssue,
  onViewAll,
  previewLimit = 3,
}: NewJobOpportunitiesCardProps) {
  const dispatch = useDispatch();
  const [bidCounts, setBidCounts] = useState<Record<number, number>>({});

  const opportunities = useMemo(
    () => buildMarketplaceOpportunities(issues, listingsMap, vendor, vendorOffers, bidCounts),
    [issues, listingsMap, vendor, vendorOffers, bidCounts]
  );

  const preview = opportunities.slice(0, previewLimit);
  const previewIds = useMemo(() => preview.map((p) => p.issue.id).join(","), [preview]);

  useEffect(() => {
    if (!previewIds) return;
    let cancelled = false;
    preview.forEach(({ issue }) => {
      dispatch(getOffersByIssueId.initiate(issue.id, { forceRefetch: false }) as any)
        .then((result: any) => {
          if (cancelled) return;
          const count = result?.data?.length ?? 0;
          setBidCounts((prev) => (prev[issue.id] === count ? prev : { ...prev, [issue.id]: count }));
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, previewIds, preview]);

  return (
    <DashboardSectionCard>
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-border/60">
        <View className="flex-row items-center gap-3 flex-1 min-w-0">
          <View className="w-9 h-9 rounded-lg bg-primary/20 items-center justify-center">
            <Ionicons name="flash" size={18} color="#D4A853" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-semibold text-foreground">New Job Opportunities</Text>
            <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {opportunities.length === 0
                ? "Nothing new right now"
                : `${opportunities.length} matching job${opportunities.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onViewAll} className="flex-row items-center gap-1">
          <Text className="text-xs font-semibold text-muted-foreground">View all</Text>
          <Ionicons name="arrow-forward" size={12} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {preview.length === 0 ? (
        <View className="py-8 px-5 items-center">
          <Text className="text-foreground font-medium mb-1">No matching jobs right now</Text>
          <Text className="text-sm text-muted-foreground text-center mb-4">
            Browse the marketplace to find opportunities near you
          </Text>
          <TouchableOpacity className="bg-primary rounded-lg px-5 py-2.5 flex-row items-center gap-2" onPress={onViewAll}>
            <Ionicons name="search" size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {preview.map(({ issue, listing, bidCount }, index) => {
            const images = getIssueImageUrlsFromIssue(issue);
            const thumb = images[0] || listing?.image_url;
            return (
              <TouchableOpacity
                key={issue.id}
                className={`flex-row items-center gap-3 px-4 py-3.5 ${index > 0 ? "border-t border-border" : ""}`}
                activeOpacity={0.85}
                onPress={() => onOpenIssue(issue.id, "details")}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} className="w-12 h-12 rounded-lg bg-muted" />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-muted items-center justify-center">
                    <Ionicons name="image-outline" size={18} color="#9CA3AF" />
                  </View>
                )}

                <View className="flex-1 min-w-0">
                  <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                    {issue.summary || `${normalizeAndCapitalize(issue.type)} Issue`}
                  </Text>
                  <View className="flex-row items-center mt-0.5 gap-1">
                    {listing?.city ? (
                      <>
                        <Ionicons name="location-outline" size={11} color="#9CA3AF" />
                        <Text className="text-xs text-muted-foreground flex-1" numberOfLines={1}>
                          {listing.city}
                          {issue.created_at ? ` · Posted ${formatRelativeTime(issue.created_at)}` : ""}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {issue.created_at ? `Posted ${formatRelativeTime(issue.created_at)}` : "Location TBD"}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  className={`px-3 py-1.5 rounded-lg min-w-[72px] items-center ${
                    bidCount === 0 ? "bg-primary" : "bg-foreground"
                  }`}
                  onPress={() => onOpenIssue(issue.id, "offers")}
                >
                  <Text className="text-xs font-semibold text-white">
                    {bidCount === 0 ? "Be first!" : "Quote"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </DashboardSectionCard>
  );
}
