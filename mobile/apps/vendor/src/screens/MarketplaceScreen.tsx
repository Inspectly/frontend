import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import {
  useGetPaginatedIssuesQuery,
  useGetAddressesByIssueIdsMutation,
  useGetListingsQuery,
  useGetVendorByVendorUserIdQuery,
  RootState,
  IssueType,
  IssueAddress,
  applyMarketplaceFilters,
  filterOpenUnassigned,
  getUniqueCities,
  getUniqueStates,
  getVendorSpecialtyAsIssueType,
  groupIssuesByAddress,
  normalizeAndCapitalize,
  MarketplaceFilterMode,
} from "@inspectly/shared";
import { IssueDetailModal } from "../components/IssueDetailModal";
import { MarketplaceFilterPanel } from "../components/MarketplaceFilterPanel";
import { MarketplaceHeroBand } from "../components/MarketplaceHeroBand";
import { MarketplaceIssueCard } from "../components/MarketplaceIssueCard";
import { AddressGroupCard } from "../components/AddressGroupCard";
import { DashboardSectionCard } from "../components/DashboardSectionCard";
import { DASHBOARD_PAGE_BG } from "../constants/dashboardTheme";
import { getFloatingTabBarScenePadding } from "../navigation/FloatingTabBar";

const ITEMS_PER_PAGE = 12;
const MAX_FETCH = 100;

function FilterFallbackBanner({
  mode,
  selectedType,
  selectedCity,
}: {
  mode: MarketplaceFilterMode;
  selectedType: string;
  selectedCity: string;
}) {
  if (mode !== "type_only" && mode !== "city_only") return null;

  return (
    <View className="mb-4 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 flex-row items-start gap-3">
      <Ionicons
        name={mode === "type_only" ? "location-outline" : "construct-outline"}
        size={18}
        color="#D4A853"
        style={{ marginTop: 2 }}
      />
      <View className="flex-1">
        <Text className="font-medium text-foreground">
          {mode === "type_only"
            ? `No ${normalizeAndCapitalize(selectedType)} jobs found in ${selectedCity}`
            : `No ${normalizeAndCapitalize(selectedType)} jobs available`}
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          {mode === "type_only"
            ? `Showing ${normalizeAndCapitalize(selectedType)} opportunities in other areas. Consider expanding your service area.`
            : `Showing other job types in ${selectedCity}. Consider adding more specialties to your profile.`}
        </Text>
      </View>
    </View>
  );
}

export function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const listBottomPadding = getFloatingTabBarScenePadding(insets.bottom);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: vendor } = useGetVendorByVendorUserIdQuery(user?.id?.toString() || "", {
    skip: !user?.id,
  });

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [groupByAddress, setGroupByAddress] = useState(false);
  const [hasAutoApplied, setHasAutoApplied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addressMap, setAddressMap] = useState<Record<number, IssueAddress>>({});

  const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState<"details" | "offers">("details");

  const { data: allListings, isLoading: isLoadingListings } = useGetListingsQuery();
  const [fetchAddresses] = useGetAddressesByIssueIdsMutation();

  const needsClientFetch = groupByAddress || !!selectedType;

  const apiParams = useMemo(
    () => ({
      page: needsClientFetch ? 1 : page,
      size: needsClientFetch ? MAX_FETCH : ITEMS_PER_PAGE,
      search: debouncedSearch.trim(),
      type: "",
      city: selectedCity,
      state: selectedState,
      vendor_assigned: false as const,
    }),
    [needsClientFetch, page, debouncedSearch, selectedCity, selectedState]
  );

  const { data, isLoading, refetch } = useGetPaginatedIssuesQuery(apiParams);

  const { data: allUnassignedData } = useGetPaginatedIssuesQuery({
    page: 1,
    size: MAX_FETCH,
    search: "",
    type: "",
    city: "",
    state: "",
    vendor_assigned: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (hasAutoApplied || !vendor) return;
    const specialty = getVendorSpecialtyAsIssueType(vendor);
    if (specialty) setSelectedType(specialty);
    if (vendor.city) setSelectedCity(vendor.city);
    setHasAutoApplied(true);
  }, [vendor, hasAutoApplied]);

  useEffect(() => {
    const items = allUnassignedData?.items ?? [];
    if (items.length === 0) return;
    const ids = items.map((i) => i.id);
    fetchAddresses(ids)
      .unwrap()
      .then((addrs) => {
        setAddressMap((prev) => {
          const next = { ...prev };
          addrs.forEach((a) => {
            next[a.issue_id] = a;
          });
          return next;
        });
      })
      .catch(() => {});
  }, [allUnassignedData?.items, fetchAddresses]);

  useEffect(() => {
    const items = data?.items ?? [];
    const missing = items.map((i) => i.id).filter((id) => !addressMap[id]);
    if (missing.length === 0) return;
    fetchAddresses(missing)
      .unwrap()
      .then((addrs) => {
        setAddressMap((prev) => {
          const next = { ...prev };
          addrs.forEach((a) => {
            next[a.issue_id] = a;
          });
          return next;
        });
      })
      .catch(() => {});
  }, [data?.items, fetchAddresses, addressMap]);

  const uniqueStates = useMemo(() => getUniqueStates(allListings ?? []), [allListings]);
  const uniqueCities = useMemo(
    () => getUniqueCities(allListings ?? [], selectedState || undefined),
    [allListings, selectedState]
  );

  const rawIssues = useMemo(
    () => filterOpenUnassigned(data?.items ?? []),
    [data?.items]
  );

  const { filteredIssues, currentFilterMode } = useMemo(
    () => applyMarketplaceFilters(rawIssues, selectedType, selectedCity, addressMap),
    [rawIssues, selectedType, selectedCity, addressMap]
  );

  const groupedIssues = useMemo(
    () => (groupByAddress ? groupIssuesByAddress(filteredIssues, addressMap) : []),
    [groupByAddress, filteredIssues, addressMap]
  );

  const totalItems = selectedType ? filteredIssues.length : data?.total ?? filteredIssues.length;
  const totalPages = groupByAddress
    ? Math.ceil(groupedIssues.length / ITEMS_PER_PAGE)
    : Math.ceil(totalItems / ITEMS_PER_PAGE);

  const visibleIssues = useMemo(() => {
    if (groupByAddress) return [];
    if (needsClientFetch) {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return filteredIssues.slice(start, start + ITEMS_PER_PAGE);
    }
    return filteredIssues;
  }, [groupByAddress, needsClientFetch, page, filteredIssues]);

  const visibleGroups = useMemo(() => {
    if (!groupByAddress) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return groupedIssues.slice(start, start + ITEMS_PER_PAGE);
  }, [groupByAddress, page, groupedIssues]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openIssue = (issue: IssueType, tab: "details" | "offers") => {
    setSelectedIssue(issue);
    setModalTab(tab);
    setModalVisible(true);
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    if (selectedCity && state && allListings) {
      const citiesInState = getUniqueCities(allListings, state);
      if (!citiesInState.includes(selectedCity)) {
        setSelectedCity("");
      }
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedType("");
    setSelectedCity("");
    setSelectedState("");
    setPage(1);
  };

  const listData = groupByAddress ? visibleGroups : visibleIssues;

  const renderIssueItem = (
    item: IssueType | (typeof visibleGroups)[0],
    index: number
  ) => {
    if (groupByAddress) {
      const group = item as (typeof visibleGroups)[0];
      return (
        <AddressGroupCard
          key={`${group.address.address}_${index}`}
          embedded
          address={group.address}
          issues={group.issues}
          onOpenIssue={openIssue}
        />
      );
    }

    const issue = item as IssueType;
    return (
      <MarketplaceIssueCard
        key={issue.id.toString()}
        embedded
        issue={issue}
        address={addressMap[issue.id]}
        onPress={() => openIssue(issue, "details")}
        onQuote={() => openIssue(issue, "offers")}
      />
    );
  };

  const paginationControls =
    totalPages > 1 ? (
      <View className="flex-row justify-center items-center gap-3 px-4 py-4 border-t border-border/60">
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg border border-border/60 ${
            page > 1 ? "bg-white" : "bg-muted"
          }`}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          <Text className={page > 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
            Previous
          </Text>
        </TouchableOpacity>
        <Text className="text-muted-foreground text-sm">
          Page {page} of {totalPages}
        </Text>
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg border border-border/60 ${
            page < totalPages ? "bg-foreground" : "bg-muted"
          }`}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          <Text className={page < totalPages ? "text-white font-medium" : "text-muted-foreground"}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const issuesSection = (
    <DashboardSectionCard className="mb-3" floatingChildren>
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border/60">
        <Text className="text-base font-semibold text-foreground">
          {groupByAddress ? "Grouped Issues" : "All Issues"}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {groupByAddress
            ? `${groupedIssues.length} address groups`
            : `${totalItems} issues found`}
        </Text>
      </View>

      {listData.length === 0 ? (
        <View className="px-4 py-10 items-center">
          <Ionicons name="search-outline" size={32} color="#9CA3AF" />
          <Text className="text-muted-foreground mt-2 font-medium">No issues found</Text>
          <Text className="text-xs text-muted-foreground mt-1 text-center">
            Try adjusting your filters or clearing them to see more jobs
          </Text>
        </View>
      ) : (
        <View className="px-3 pt-4 pb-3 gap-5">
          {listData.map((item, index) => renderIssueItem(item, index))}
        </View>
      )}

      {paginationControls}
    </DashboardSectionCard>
  );

  return (
    <SafeAreaView className={`flex-1 ${DASHBOARD_PAGE_BG}`} edges={["top"]}>
      <IssueDetailModal
        visible={modalVisible}
        issue={selectedIssue}
        defaultTab={modalTab}
        onClose={() => setModalVisible(false)}
      />

      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4A853" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: listBottomPadding }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-4">
            <MarketplaceHeroBand totalJobs={totalItems} />

            <MarketplaceFilterPanel
              searchTerm={searchTerm}
              selectedType={selectedType}
              selectedCity={selectedCity}
              selectedState={selectedState}
              groupByAddress={groupByAddress}
              stateOptions={uniqueStates}
              cityOptions={uniqueCities}
              isLoadingLocations={isLoadingListings}
              onSearchTermChange={setSearchTerm}
              onTypeChange={(value) => {
                setSelectedType(value);
                setPage(1);
              }}
              onCityChange={(value) => {
                setSelectedCity(value);
                setPage(1);
              }}
              onStateChange={handleStateChange}
              onGroupByAddressChange={(value) => {
                setGroupByAddress(value);
                setPage(1);
              }}
              onSearch={() => setPage(1)}
              onClear={clearFilters}
            />

            {(selectedType || selectedCity) &&
            currentFilterMode !== "all" &&
            currentFilterMode !== "exact" ? (
              <FilterFallbackBanner
                mode={currentFilterMode}
                selectedType={selectedType}
                selectedCity={selectedCity}
              />
            ) : null}
          </View>

          {issuesSection}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
