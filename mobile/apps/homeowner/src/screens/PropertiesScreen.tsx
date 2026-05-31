import React from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  RootState,
  useGetListingByUserIdQuery,
  useGetIssuesByListingIdQuery,
  Listing,
} from "@inspectly/shared";

function PropertyCard({ listing }: { listing: Listing }) {
  const { data: issues } = useGetIssuesByListingIdQuery(listing.id);
  const activeCount = issues?.filter(
    (i) => i.status === "Status.OPEN" || i.status === "Status.IN_PROGRESS"
  ).length ?? 0;

  return (
    <TouchableOpacity className="bg-white border border-border rounded-xl p-4 mb-3">
      <Text className="font-semibold text-foreground">{listing.address}</Text>
      <Text className="text-sm text-muted-foreground mt-1">
        {listing.city}, {listing.state} {listing.postal_code}
      </Text>
      <View className="flex-row mt-3 gap-4">
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-primary mr-2" />
          <Text className="text-xs text-muted-foreground">{activeCount} active issues</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-muted-foreground mr-2" />
          <Text className="text-xs text-muted-foreground">{issues?.length ?? 0} total</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function PropertiesScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings, refetch, isLoading } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
      >
        <Text className="text-2xl font-bold text-foreground mt-4">Properties</Text>
        <Text className="text-muted-foreground mt-1 mb-6">
          {listings?.length ?? 0} properties registered
        </Text>

        {isLoading ? (
          <View className="bg-muted rounded-xl p-6 items-center">
            <Text className="text-muted-foreground">Loading properties...</Text>
          </View>
        ) : !listings || listings.length === 0 ? (
          <View className="bg-muted rounded-xl p-6 items-center">
            <Text className="text-muted-foreground">No properties yet</Text>
            <Text className="text-sm text-muted-foreground mt-2">
              Add a property to start managing issues
            </Text>
          </View>
        ) : (
          listings.map((listing) => <PropertyCard key={listing.id} listing={listing} />)
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
