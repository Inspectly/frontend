import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  RootState,
  useGetIssuesQuery,
  useGetListingByUserIdQuery,
  useGetOffersByIssueIdQuery,
  useUpdateOfferMutation,
  IssueOffer,
  IssueOfferStatus,
  IssueType,
} from "@inspectly/shared";
import { PaymentSheet } from "../components/PaymentSheet";

function OfferItem({
  offer,
  onAccept,
  onReject,
  clientId,
}: {
  offer: IssueOffer;
  onAccept: () => void;
  onReject: () => void;
  clientId: number;
}) {
  if (offer.status === IssueOfferStatus.ACCEPTED) {
    return (
      <View className="border-t border-border pt-3 mt-2">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-green-700 font-medium">Accepted - ${offer.price}</Text>
        </View>
        <PaymentSheet offer={offer} clientId={clientId} onSuccess={() => {}} />
      </View>
    );
  }

  return (
    <View className="flex-row justify-between items-center py-3 border-t border-border">
      <View>
        <Text className="text-foreground font-bold">${offer.price}</Text>
        {offer.comment_vendor && (
          <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
            {offer.comment_vendor}
          </Text>
        )}
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg" onPress={onAccept}>
          <Text className="text-primary-foreground text-sm font-medium">Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-muted px-4 py-2 rounded-lg" onPress={onReject}>
          <Text className="text-muted-foreground text-sm font-medium">Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function IssueOffersCard({ issue, clientId }: { issue: IssueType; clientId: number }) {
  const { data: offers, refetch } = useGetOffersByIssueIdQuery(issue.id);
  const [updateOffer] = useUpdateOfferMutation();

  const activeOffers = offers?.filter((o) => o.status !== IssueOfferStatus.REJECTED) ?? [];
  if (activeOffers.length === 0) return null;

  const handleAccept = async (offer: IssueOffer) => {
    Alert.alert("Accept Offer", `Accept this $${offer.price} offer?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: async () => {
          try {
            await updateOffer({
              id: offer.id,
              issue_id: offer.issue_id,
              vendor_id: offer.vendor_id,
              price: offer.price,
              status: IssueOfferStatus.ACCEPTED,
              comment_vendor: offer.comment_vendor,
              comment_client: offer.comment_client,
            }).unwrap();
            refetch();
          } catch {
            Alert.alert("Error", "Failed to accept offer");
          }
        },
      },
    ]);
  };

  const handleReject = async (offer: IssueOffer) => {
    try {
      await updateOffer({
        id: offer.id,
        issue_id: offer.issue_id,
        vendor_id: offer.vendor_id,
        price: offer.price,
        status: IssueOfferStatus.REJECTED,
        comment_vendor: offer.comment_vendor,
        comment_client: offer.comment_client,
      }).unwrap();
      refetch();
    } catch {
      Alert.alert("Error", "Failed to decline offer");
    }
  };

  return (
    <View className="bg-white border border-border rounded-xl p-4 mb-3">
      <Text className="font-semibold text-foreground">{issue.summary}</Text>
      <Text className="text-xs text-muted-foreground mt-1">{issue.type}</Text>
      {activeOffers.map((offer) => (
        <OfferItem
          key={offer.id}
          offer={offer}
          clientId={clientId}
          onAccept={() => handleAccept(offer)}
          onReject={() => handleReject(offer)}
        />
      ))}
    </View>
  );
}

export function OffersScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: listings } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: issues, refetch, isLoading } = useGetIssuesQuery();
  const [refreshing, setRefreshing] = useState(false);

  const myIssues = React.useMemo(
    () => issues?.filter((i) => listings?.some((l) => l.id === i.listing_id)) ?? [],
    [issues, listings]
  );

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
        <Text className="text-2xl font-bold text-foreground mt-4">Offers</Text>
        <Text className="text-muted-foreground mt-1 mb-6">
          Review and manage vendor offers
        </Text>

        {isLoading ? (
          <View className="bg-muted rounded-xl p-6 items-center">
            <Text className="text-muted-foreground">Loading offers...</Text>
          </View>
        ) : myIssues.length === 0 ? (
          <View className="bg-muted rounded-xl p-6 items-center">
            <Text className="text-muted-foreground">No issues with offers yet</Text>
          </View>
        ) : (
          myIssues.map((issue) => (
            <IssueOffersCard key={issue.id} issue={issue} clientId={user?.id ?? 0} />
          ))
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
