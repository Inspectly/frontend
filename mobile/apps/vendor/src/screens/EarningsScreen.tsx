import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import {
  RootState,
  useGetVendorByVendorUserIdQuery,
  useGetOffersByVendorIdQuery,
  useGetIssuesQuery,
  IssueOfferStatus,
  IssueType,
  EarningsRangeKey,
  computeVendorEarningsMetrics,
  computeVendorEarningsOverview,
  formatMoneyFull,
  formatMoneyShort,
  normalizeAndCapitalize,
  getIssueTypeIonicon,
} from "@inspectly/shared";
import { EarningsAreaChart } from "../components/EarningsAreaChart";
import { EarningsHeroBand } from "../components/EarningsHeroBand";
import { EarningsStatCards } from "../components/EarningsStatCards";
import { EarningsRangeSelect } from "../components/EarningsRangeSelect";
import { DashboardSectionCard } from "../components/DashboardSectionCard";
import { DASHBOARD_PAGE_BG } from "../constants/dashboardTheme";

const isCompleted = (status?: string) =>
  !!status && status.toLowerCase().includes("completed");

export function EarningsScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  useGetVendorByVendorUserIdQuery(user?.id?.toString(), { skip: !user?.id });
  const { data: offers, refetch } = useGetOffersByVendorIdQuery(Number(user?.id), { skip: !user?.id });
  const { data: issues } = useGetIssuesQuery();
  const [refreshing, setRefreshing] = React.useState(false);
  const [range, setRange] = useState<EarningsRangeKey>("12mo");

  const issuesMap = useMemo(() => {
    const map: Record<number, IssueType> = {};
    (issues ?? []).forEach((i) => {
      map[i.id] = i;
    });
    return map;
  }, [issues]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const metrics = useMemo(
    () => computeVendorEarningsMetrics(offers ?? [], issuesMap, range),
    [offers, issuesMap, range]
  );

  const overview = useMemo(
    () => computeVendorEarningsOverview(offers ?? [], issuesMap),
    [offers, issuesMap]
  );

  const acceptedOffers = useMemo(
    () => (offers ?? []).filter((o) => o.status === IssueOfferStatus.ACCEPTED),
    [offers]
  );
  const completedOffers = useMemo(
    () => acceptedOffers.filter((o) => isCompleted(issuesMap[o.issue_id]?.status)),
    [acceptedOffers, issuesMap]
  );

  const recent = useMemo(
    () =>
      [...acceptedOffers]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        )
        .slice(0, 10),
    [acceptedOffers]
  );

  const hasChart = metrics.chartData.some((d) => d.spend > 0);

  return (
    <SafeAreaView className={`flex-1 ${DASHBOARD_PAGE_BG}`} edges={["top"]}>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
      >
        <View className="pt-4">
          <EarningsHeroBand
            pendingTotal={metrics.pendingTotal}
            pendingCount={metrics.pendingCount}
            completedCount={completedOffers.length}
          />
        </View>

        <EarningsStatCards overview={overview} />

        {/* Confirmed Payouts */}
        <DashboardSectionCard className="mb-4">
          <View className="px-5 pt-5 pb-4 border-b border-border/60">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <View className="w-9 h-9 rounded-lg bg-emerald-100 items-center justify-center">
                  <Ionicons name="trending-up" size={18} color="#059669" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold text-foreground">Confirmed Payouts</Text>
                  <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Payment history
                  </Text>
                </View>
              </View>
              <EarningsRangeSelect value={range} onChange={setRange} />
            </View>
          </View>

          <View className="px-5 py-5">
            <Text className="text-3xl font-bold text-foreground">{formatMoneyFull(metrics.confirmedEarnings)}</Text>
            <Text className="text-xs text-muted-foreground mt-1.5">
              Total earned
              {metrics.pendingCount > 0 && (
                <>
                  {" · "}
                  <Text className="font-semibold text-foreground">{formatMoneyShort(metrics.pendingTotal)}</Text>
                  {` pending across ${metrics.pendingCount} quote${metrics.pendingCount !== 1 ? "s" : ""}`}
                </>
              )}
            </Text>

            {hasChart ? (
              <View className="mt-4 -mx-1">
                <EarningsAreaChart data={metrics.chartData} />
              </View>
            ) : (
              <View className="mt-4 border border-dashed border-border rounded-xl px-4 py-6 items-center">
                <Text className="text-xs text-muted-foreground">No earnings yet in this period</Text>
              </View>
            )}
          </View>
        </DashboardSectionCard>

        {/* Top categories */}
        {metrics.topCategories.length > 0 && (
          <DashboardSectionCard className="mb-4">
            <View className="px-5 pt-5 pb-4 border-b border-border/60">
              <Text className="text-base font-semibold text-foreground">Top Categories</Text>
              <Text className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                By earnings share
              </Text>
            </View>
            <View className="px-5 py-4">
              {metrics.topCategories.map(({ type, amount, pct }, index) => (
                <View
                  key={type}
                  className={`flex-row items-center gap-3 ${index < metrics.topCategories.length - 1 ? "mb-3" : ""}`}
                >
                  <View className="w-7 h-7 rounded-lg bg-primary/10 items-center justify-center">
                    <Ionicons name={getIssueTypeIonicon(type) as any} size={14} color="#D4A853" />
                  </View>
                  <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>
                    {normalizeAndCapitalize(type)}
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">{formatMoneyFull(amount)}</Text>
                  <Text className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </DashboardSectionCard>
        )}

        {/* Recent Payments */}
        <DashboardSectionCard>
          <View className="px-5 pt-5 pb-4 border-b border-border/60">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-primary/15 items-center justify-center">
                <Ionicons name="wallet-outline" size={18} color="#D4A853" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-base font-semibold text-foreground">Recent Payments</Text>
                <Text className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Latest accepted quotes
                </Text>
              </View>
            </View>
          </View>

          {recent.length === 0 ? (
            <View className="mx-5 my-5 border border-dashed border-border rounded-xl px-4 py-8 items-center">
              <Ionicons name="receipt-outline" size={28} color="#9CA3AF" />
              <Text className="text-sm font-semibold text-foreground mt-3">No payments yet</Text>
              <Text className="text-xs text-muted-foreground mt-1 text-center">
                Completed and pending payments will show up here
              </Text>
            </View>
          ) : (
            <View className="px-5 py-2">
              {recent.map((offer, index) => {
                const completed = isCompleted(issuesMap[offer.issue_id]?.status);
                return (
                  <View
                    key={offer.id}
                    className={`flex-row justify-between items-center py-3.5 ${
                      index < recent.length - 1 ? "border-b border-border/60" : ""
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="font-medium text-foreground" numberOfLines={1}>
                        {issuesMap[offer.issue_id]?.summary ?? `Issue #${offer.issue_id}`}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {new Date(offer.updated_at || offer.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {"  •  "}
                        {completed ? "Received" : "Pending"}
                      </Text>
                    </View>
                    <Text className={`font-bold ${completed ? "text-primary" : "text-muted-foreground"}`}>
                      +${offer.price}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </DashboardSectionCard>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
