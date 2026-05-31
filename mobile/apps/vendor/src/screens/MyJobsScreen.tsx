import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
  RootState,
  useGetVendorByVendorUserIdQuery,
  useGetOffersByVendorIdQuery,
  useGetIssuesQuery,
  useGetListingsQuery,
  useGetAssessmentsByUserIdQuery,
  useLazyGetDisputesByIssueOfferIdQuery,
  IssueType,
  IssueOffer,
  IssueOfferStatus,
  Listing,
  buildProcessedVisits,
  computeMyJobsStats,
  filterAndSortMyJobsOffers,
  getIssueById,
  MyJobsTab,
  MyJobsSort,
} from "@inspectly/shared";
import { IssueDetailModal } from "../components/IssueDetailModal";
import { MyJobsHeroBand } from "../components/MyJobsHeroBand";
import { MyJobsFilterPanel } from "../components/MyJobsFilterPanel";
import { MyJobCard } from "../components/MyJobCard";
import { DASHBOARD_PAGE_BG, dashboardCardShadow } from "../constants/dashboardTheme";
import type { MainTabsParamList } from "../navigation/MainTabs";

type MyJobsRoute = RouteProp<MainTabsParamList, "MyJobs">;

function routeTabToStatus(tab?: string): MyJobsTab {
  if (tab === "active") return "active";
  if (tab === "completed") return "completed";
  if (tab === "pending") return "pending";
  if (tab === "rejected") return "rejected";
  if (tab === "disputed") return "disputed";
  return "all";
}

export function MyJobsScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabsParamList>>();
  const route = useRoute<MyJobsRoute>();
  const user = useSelector((state: RootState) => state.auth.user);

  useGetVendorByVendorUserIdQuery(user?.id?.toString(), { skip: !user?.id });
  const { data: offers = [], isLoading, refetch } = useGetOffersByVendorIdQuery(Number(user?.id), {
    skip: !user?.id,
  });
  const { data: issues } = useGetIssuesQuery();
  const { data: listings } = useGetListingsQuery();
  const { data: assessments } = useGetAssessmentsByUserIdQuery(Number(user?.id), { skip: !user?.id });
  const [fetchDisputesByOfferId] = useLazyGetDisputesByIssueOfferIdQuery();

  const [statusTab, setStatusTab] = useState<MyJobsTab>(() => routeTabToStatus(route.params?.tab));
  const [sortBy, setSortBy] = useState<MyJobsSort>("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [disputedOfferIds, setDisputedOfferIds] = useState<Set<number>>(new Set());

  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "offers" | "schedule" | "dispute">("details");

  useEffect(() => {
    if (route.params?.tab) setStatusTab(routeTabToStatus(route.params.tab));
  }, [route.params?.tab]);

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

  const visitsByIssueId = useMemo(() => {
    const map = new Map<number, (typeof processedVisits)[0]>();
    processedVisits.forEach((v) => map.set(v.issueId, v));
    return map;
  }, [processedVisits]);

  const offerIdsKey = useMemo(() => offers.map((o) => o.id).join(","), [offers]);

  useEffect(() => {
    let cancelled = false;
    if (offers.length === 0) {
      setDisputedOfferIds(new Set());
      return;
    }

    Promise.all(
      offers.map((o) =>
        fetchDisputesByOfferId(o.id)
          .unwrap()
          .then((disputes) => ({ id: o.id, hasDispute: disputes.length > 0 }))
          .catch(() => ({ id: o.id, hasDispute: false }))
      )
    ).then((results) => {
      if (cancelled) return;
      setDisputedOfferIds(new Set(results.filter((r) => r.hasDispute).map((r) => r.id)));
    });

    return () => {
      cancelled = true;
    };
  }, [offerIdsKey, fetchDisputesByOfferId, offers.length]);

  const stats = useMemo(
    () => computeMyJobsStats(offers, issuesMap, disputedOfferIds),
    [offers, issuesMap, disputedOfferIds]
  );

  const filteredOffers = useMemo(
    () =>
      filterAndSortMyJobsOffers({
        offers,
        issuesMap,
        disputedOfferIds,
        activeTab: statusTab,
        searchQuery,
        sortBy,
      }),
    [offers, issuesMap, disputedOfferIds, statusTab, searchQuery, sortBy]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusTab("all");
    setSortBy("date");
  };

  const openJob = async (offer: IssueOffer) => {
    let issue = issuesMap[offer.issue_id];
    if (!issue) {
      try {
        issue = await dispatch(getIssueById.initiate(offer.issue_id.toString()) as any).unwrap();
      } catch {
        return;
      }
    }
    setSelectedIssue(issue);
    if (disputedOfferIds.has(offer.id)) setModalTab("dispute");
    else if (offer.status === IssueOfferStatus.ACCEPTED) setModalTab("schedule");
    else setModalTab("offers");
    setModalVisible(true);
  };

  const ListHeader = (
    <View className="pt-4">
      <MyJobsHeroBand
        stats={stats}
        resultCount={filteredOffers.length}
        onFindJobs={() => navigation.navigate("Marketplace")}
      />

      <MyJobsFilterPanel
        searchQuery={searchQuery}
        statusTab={statusTab}
        sortBy={sortBy}
        stats={stats}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusTab}
        onSortChange={setSortBy}
        onClear={clearFilters}
      />
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${DASHBOARD_PAGE_BG}`} edges={["top"]}>
      <IssueDetailModal
        visible={modalVisible}
        issue={selectedIssue}
        defaultTab={modalTab}
        onClose={() => setModalVisible(false)}
      />

      {isLoading && offers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4A853" />
        </View>
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const issue = issuesMap[item.issue_id];
            const listing = issue ? listingsMap[issue.listing_id] : undefined;
            return (
              <MyJobCard
                offer={item}
                issue={issue}
                listing={listing}
                visit={visitsByIssueId.get(item.issue_id)}
                isDisputed={disputedOfferIds.has(item.id)}
                onPress={() => openJob(item)}
              />
            );
          }}
          ListHeaderComponent={ListHeader}
          ListHeaderComponentStyle={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />
          }
          ListEmptyComponent={
            <View
              className="bg-white border border-border/60 rounded-xl p-8 items-center shadow-card"
              style={dashboardCardShadow}
            >
              <Ionicons name="briefcase-outline" size={36} color="#D1D5DB" />
              <Text className="text-foreground font-semibold mt-3">
                {searchQuery || statusTab !== "all" ? "No jobs found" : "No jobs yet"}
              </Text>
              <Text className="text-sm text-muted-foreground text-center mt-1 mb-4">
                {searchQuery || statusTab !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start bidding on projects to see them here"}
              </Text>
              {!searchQuery && statusTab === "all" ? (
                <TouchableOpacity
                  className="bg-primary rounded-lg px-5 py-2.5"
                  onPress={() => navigation.navigate("Marketplace")}
                >
                  <Text className="text-white font-semibold text-sm">Browse Opportunities</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
