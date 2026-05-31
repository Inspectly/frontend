import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import {
  useGetDisputesByIssueOfferIdQuery,
  useGetDisputeDetailsByIssueOfferIdQuery,
  useCreateDisputeMutation,
  useCreateDisputeMessageMutation,
  DisputeDetailItem,
} from "@inspectly/shared";

interface DisputeTabProps {
  issueOfferId?: number;
  userType?: string;
}

function normalizeStatusLabel(status?: string) {
  if (!status) return "Unknown";
  const cleaned = status
    .toLowerCase()
    .replace("dispute_status.", "")
    .replace("status.", "")
    .replace(/_/g, " ")
    .trim();
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusColors(status?: string) {
  const cleaned = (status ?? "").toLowerCase().replace("dispute_status.", "");
  if (cleaned === "open") return { bg: "#d1fae5", fg: "#047857" };
  if (cleaned === "pending") return { bg: "#fef3c7", fg: "#b45309" };
  if (cleaned === "resolved" || cleaned === "closed") return { bg: "#d1fae5", fg: "#047857" };
  if (cleaned === "rejected" || cleaned === "denied") return { bg: "#fee2e2", fg: "#b91c1c" };
  return { bg: "#f3f4f6", fg: "#374151" };
}

function formatDate(iso: string) {
  const d = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatUserType(userType?: string) {
  if (!userType) return "User";
  return userType.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function DisputeTab({ issueOfferId, userType = "vendor" }: DisputeTabProps) {
  const [message, setMessage] = useState("");
  const [createdDisputeId, setCreatedDisputeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: disputes = [], isLoading: disputesLoading } = useGetDisputesByIssueOfferIdQuery(
    issueOfferId ?? 0,
    { skip: !issueOfferId }
  );

  const activeDispute = useMemo(() => {
    if (disputes.length === 0) return null;
    return [...disputes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }, [disputes]);

  const disputeId = createdDisputeId ?? activeDispute?.id ?? null;

  const { data: disputeDetails, isLoading: detailsLoading } = useGetDisputeDetailsByIssueOfferIdQuery(
    issueOfferId ?? 0,
    { skip: !issueOfferId || !disputeId }
  );

  const [createDispute] = useCreateDisputeMutation();
  const [createDisputeMessage] = useCreateDisputeMessageMutation();

  const items = useMemo(() => {
    const raw = disputeDetails?.items ?? [];
    return [...raw].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [disputeDetails?.items]);

  const submitMessage = async () => {
    if (!message.trim() || !issueOfferId) return;
    setSubmitting(true);
    try {
      let id = disputeId;
      if (!id) {
        const created = await createDispute({ issueOfferId, statusMessage: message.trim() }).unwrap();
        id = created.id;
        setCreatedDisputeId(id);
      } else {
        await createDisputeMessage({
          issueDisputeId: id,
          issueOfferId,
          message: message.trim(),
          userType,
        }).unwrap();
      }
      setMessage("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!issueOfferId) {
    return (
      <View className="bg-muted rounded-xl p-6 items-center">
        <Text className="text-muted-foreground text-center">No offer linked to this issue yet.</Text>
      </View>
    );
  }

  if (disputesLoading || detailsLoading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator color="#D4A853" />
      </View>
    );
  }

  const status = disputeDetails?.status ?? activeDispute?.status;
  const sc = statusColors(status);

  return (
    <View className="mb-6">
      {disputeId ? (
        <View className="bg-muted rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-foreground">Dispute #{disputeId}</Text>
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: sc.bg }}>
              <Text className="text-xs font-medium" style={{ color: sc.fg }}>
                {normalizeStatusLabel(status)}
              </Text>
            </View>
          </View>
          {disputeDetails?.status_message ? (
            <Text className="text-sm text-muted-foreground mt-2">{disputeDetails.status_message}</Text>
          ) : null}
        </View>
      ) : (
        <View className="bg-muted rounded-xl p-4 mb-4">
          <Text className="text-sm text-muted-foreground">
            No dispute yet. Send a message below to open one with the homeowner.
          </Text>
        </View>
      )}

      <ScrollView className="max-h-64 mb-4" nestedScrollEnabled>
        {items.length === 0 ? (
          <Text className="text-sm text-muted-foreground text-center py-4">No messages yet.</Text>
        ) : (
          items.map((item: DisputeDetailItem, idx) => (
            <View key={idx} className="mb-3 pb-3 border-b border-border">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs font-semibold text-foreground">{formatUserType(item.user_type)}</Text>
                <Text className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</Text>
              </View>
              {item.type === "message" ? (
                <Text className="text-sm text-foreground">{item.message}</Text>
              ) : (
                <Text className="text-sm text-primary">{item.attachment_url}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TextInput
        className="border border-border rounded-xl px-4 py-3 text-foreground mb-3"
        placeholder="Write a message..."
        placeholderTextColor="#9CA3AF"
        value={message}
        onChangeText={setMessage}
        multiline
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />
      <TouchableOpacity
        className="bg-primary rounded-xl py-3 items-center"
        onPress={submitMessage}
        disabled={submitting || !message.trim()}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">{disputeId ? "Send Message" : "Open Dispute"}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
