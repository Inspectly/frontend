import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  IssueType,
  IssueOffer,
  IssueOfferStatus,
  ISSUE_OFFER_STATUS_LABELS,
  IssueAssessment,
  useGetOffersByIssueIdQuery,
  useGetIssueAddressByIdQuery,
  useGetAssessmentsByIssueIdQuery,
  useGetVendorByVendorUserIdQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useUpdateIssueMutation,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  getIssueImageUrlsFromIssue,
  normalizeAndCapitalize,
  getSeverityConfig,
  useGetDisputesByIssueOfferIdQuery,
} from "@inspectly/shared";
import { useAuth } from "../hooks/useAuth";
import { IssueImageCarousel } from "./IssueImageCarousel";
import { DisputeTab } from "./DisputeTab";

interface IssueDetailModalProps {
  visible: boolean;
  issue: IssueType | null;
  defaultTab?: TabKey;
  onClose: () => void;
}

type TabKey = "details" | "offers" | "schedule" | "dispute";

function apiErrorMessage(error: unknown, fallback: string): string {
  const e = error as { data?: { detail?: string | { msg?: string }[]; message?: string }; message?: string };
  if (typeof e?.data?.detail === "string") return e.data.detail;
  if (Array.isArray(e?.data?.detail)) {
    return e.data.detail.map((d) => d.msg).filter(Boolean).join(", ") || fallback;
  }
  return e?.data?.message || e?.message || fallback;
}

const statusPill = (status?: string): { label: string; bg: string; fg: string } => {
  const s = (status ?? "").toLowerCase();
  if (s.includes("completed")) return { label: "Completed", bg: "#d1fae5", fg: "#047857" };
  if (s.includes("review")) return { label: "In Review", bg: "#ede9fe", fg: "#6d28d9" };
  if (s.includes("in_progress")) return { label: "In Progress", bg: "#fef3c7", fg: "#b45309" };
  return { label: "Open", bg: "#dbeafe", fg: "#1d4ed8" };
};

const offerPill = (status: IssueOfferStatus): { bg: string; fg: string } => {
  if (status === IssueOfferStatus.ACCEPTED) return { bg: "#d1fae5", fg: "#047857" };
  if (status === IssueOfferStatus.REJECTED) return { bg: "#fee2e2", fg: "#b91c1c" };
  return { bg: "#fef3c7", fg: "#b45309" };
};

export function IssueDetailModal({ visible, issue, defaultTab = "details", onClose }: IssueDetailModalProps) {
  const { user } = useAuth();
  const { data: vendor } = useGetVendorByVendorUserIdQuery(user?.id?.toString(), { skip: !user?.id });
  const { data: allOffers } = useGetOffersByIssueIdQuery(issue?.id ?? 0, { skip: !issue?.id });
  const { data: address } = useGetIssueAddressByIdQuery(issue?.id ?? 0, { skip: !issue?.id });
  const { data: assessments } = useGetAssessmentsByIssueIdQuery(issue?.id ?? 0, { skip: !issue?.id });

  const [createOffer, { isLoading: creatingOffer }] = useCreateOfferMutation();
  const [updateOffer, { isLoading: updatingOffer }] = useUpdateOfferMutation();
  const [deleteOffer] = useDeleteOfferMutation();
  const [updateIssue] = useUpdateIssueMutation();
  const [createAssessment, { isLoading: creatingAssessment }] = useCreateAssessmentMutation();
  const [updateAssessment] = useUpdateAssessmentMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();

  const [tab, setTab] = useState<TabKey>(defaultTab);
  const [price, setPrice] = useState("");
  const [comment, setComment] = useState("");
  const [offerError, setOfferError] = useState("");
  const [editingOffer, setEditingOffer] = useState<IssueOffer | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    type: "withdraw" | "accept" | null;
    offer: IssueOffer | null;
    isLoading: boolean;
  }>({ type: null, offer: null, isLoading: false });

  const images = useMemo(() => getIssueImageUrlsFromIssue(issue), [issue]);
  const severity = getSeverityConfig(issue?.severity);

  // Offers may store either user id or vendor table id depending on when they were created.
  const myOffers = useMemo(
    () =>
      (allOffers ?? []).filter(
        (o) => o.vendor_id === Number(user?.id) || (vendor?.id != null && o.vendor_id === vendor.id)
      ),
    [allOffers, user?.id, vendor?.id]
  );
  const hasAccepted = myOffers.some((o) => o.status === IssueOfferStatus.ACCEPTED);

  const primaryOffer = useMemo(() => {
    return myOffers.find((o) => o.status === IssueOfferStatus.ACCEPTED) ?? myOffers[0];
  }, [myOffers]);

  const { data: disputeList = [] } = useGetDisputesByIssueOfferIdQuery(primaryOffer?.id ?? 0, {
    skip: !primaryOffer?.id,
  });
  const hasDispute = disputeList.length > 0;

  React.useEffect(() => {
    if (visible && defaultTab === "dispute" && hasDispute) {
      setTab("dispute");
    }
  }, [visible, defaultTab, hasDispute]);

  React.useEffect(() => {
    if (visible) {
      setTab(defaultTab);
      setEditingOffer(null);
      setPrice("");
      setComment("");
      setOfferError("");
      setProposedDate("");
      setShowOfferForm(false);
      setConfirmModal({ type: null, offer: null, isLoading: false });
    }
  }, [visible, defaultTab, issue?.id]);

  React.useEffect(() => {
    if (visible && defaultTab === "offers" && myOffers.length === 0 && !hasAccepted) {
      setShowOfferForm(true);
    }
  }, [visible, defaultTab, myOffers.length, hasAccepted]);

  if (!issue) return null;

  const openCreateForm = () => {
    setEditingOffer(null);
    setPrice("");
    setComment("");
    setOfferError("");
    setShowOfferForm(true);
  };

  const openEditForm = (offer: IssueOffer) => {
    setEditingOffer(offer);
    setPrice(String(offer.price));
    setComment(offer.comment_vendor || "");
    setOfferError("");
    setShowOfferForm(true);
  };

  const submitOffer = async () => {
    const value = Number(price);
    if (!price || isNaN(value) || value <= 0) {
      setOfferError("Please enter a valid offer amount.");
      return;
    }
    if (!user) {
      setOfferError("Please log in to submit a quote.");
      return;
    }
    setOfferError("");
    try {
      if (editingOffer) {
        await updateOffer({
          id: editingOffer.id,
          issue_id: editingOffer.issue_id,
          vendor_id: editingOffer.vendor_id,
          price: value,
          status: "received",
          comment_vendor: comment || "",
          comment_client: editingOffer.comment_client || "",
        }).unwrap();
      } else {
        await createOffer({
          issue_id: issue.id,
          vendor_id: Number(user.id),
          price: value,
          status: "received",
          comment_vendor: comment || "",
          comment_client: "",
        }).unwrap();
      }
      setShowOfferForm(false);
      setEditingOffer(null);
      setPrice("");
      setComment("");
    } catch (e: unknown) {
      setOfferError(apiErrorMessage(e, "Failed to submit offer. Please try again."));
    }
  };

  const confirmWithdraw = async () => {
    if (!confirmModal.offer || !user) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteOffer({
        id: confirmModal.offer.id,
        issue_id: confirmModal.offer.issue_id,
        vendor_id: Number(user.id),
      }).unwrap();
      setConfirmModal({ type: null, offer: null, isLoading: false });
    } catch (e: unknown) {
      setOfferError(apiErrorMessage(e, "Failed to withdraw quote. Please try again."));
      setConfirmModal({ type: null, offer: null, isLoading: false });
    }
  };

  const confirmAcceptCounter = async () => {
    if (!confirmModal.offer || !user) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await updateOffer({
        id: confirmModal.offer.id,
        issue_id: confirmModal.offer.issue_id,
        vendor_id: confirmModal.offer.vendor_id,
        price: confirmModal.offer.price,
        status: "accepted",
        comment_vendor: confirmModal.offer.comment_vendor || "",
        comment_client: confirmModal.offer.comment_client || "",
      }).unwrap();
      await updateIssue({ id: issue.id, vendor_id: Number(user.id) }).unwrap();
      setConfirmModal({ type: null, offer: null, isLoading: false });
    } catch (e: unknown) {
      setOfferError(apiErrorMessage(e, "Failed to accept counter offer. Please try again."));
      setConfirmModal({ type: null, offer: null, isLoading: false });
    }
  };

  const withdrawOffer = (offer: IssueOffer) => {
    setConfirmModal({ type: "withdraw", offer, isLoading: false });
  };

  const proposeVisit = async () => {
    if (!proposedDate) {
      Alert.alert("Error", "Please enter a proposed date/time");
      return;
    }
    if (!vendor || !user) return;
    const start = new Date(proposedDate);
    if (isNaN(start.getTime())) {
      Alert.alert("Error", "Please enter a valid date (YYYY-MM-DD HH:MM)");
      return;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    try {
      await createAssessment({
        issue_id: issue.id,
        user_id: user.id,
        user_type: "vendor",
        interaction_id: `${issue.id}_${vendor.id}_${user.id}`,
        users_interaction_id: `${issue.id}_${vendor.id}_${user.id}`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "Assessment_Status.RECEIVED",
        min_assessment_time: null,
      }).unwrap();
      setProposedDate("");
      Alert.alert("Success", "Assessment date proposed!");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to propose visit");
    }
  };

  const respondToAssessment = async (a: IssueAssessment, accept: boolean) => {
    try {
      if (accept) {
        await updateAssessment({ ...a, status: "accepted" }).unwrap();
      } else {
        await deleteAssessment({
          id: Number(a.id),
          issue_id: a.issue_id,
          interaction_id: a.interaction_id,
        }).unwrap();
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to update visit");
    }
  };

  const sp = statusPill(issue.status as string);

  const TabButton = ({ id, label }: { id: TabKey; label: string }) => (
    <TouchableOpacity
      onPress={() => setTab(id)}
      className={`px-4 py-2 rounded-full ${tab === id ? "bg-foreground" : "bg-muted"}`}
    >
      <Text className={`text-sm font-medium ${tab === id ? "text-white" : "text-muted-foreground"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
            <Text className="text-lg font-bold text-foreground flex-1 mr-3" numberOfLines={1}>
              {issue.summary}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {/* Image gallery */}
            <View className="mt-4">
              <IssueImageCarousel images={images} height={220} />
            </View>

            {/* Tag row */}
            <View className="flex-row flex-wrap items-center gap-2 mt-4">
              <View className="bg-muted px-3 py-1 rounded-full flex-row items-center">
                <Ionicons name="construct-outline" size={12} color="#6B7280" />
                <Text className="text-xs text-muted-foreground ml-1">{normalizeAndCapitalize(issue.type)}</Text>
              </View>
              <View className="px-3 py-1 rounded-full flex-row items-center" style={{ backgroundColor: severity.color + "22" }}>
                <Ionicons name={severity.icon as any} size={12} color={severity.color} />
                <Text className="text-xs ml-1 capitalize" style={{ color: severity.color }}>
                  {issue.severity || "medium"}
                </Text>
              </View>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: sp.bg }}>
                <Text className="text-xs font-medium" style={{ color: sp.fg }}>
                  {sp.label}
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row gap-2 mt-4 mb-4 flex-wrap">
              <TabButton id="details" label="Details" />
              <TabButton id="offers" label={`Offers${myOffers.length ? ` (${myOffers.length})` : ""}`} />
              <TabButton id="schedule" label="Schedule" />
              {hasDispute && <TabButton id="dispute" label="Dispute" />}
            </View>

            {tab === "details" && (
              <View className="mb-6">
                <Text className="text-base font-semibold text-foreground mb-1">Description</Text>
                <Text className="text-muted-foreground leading-5">
                  {issue.description || "No description provided."}
                </Text>

                <View className="bg-muted rounded-xl p-4 mt-4">
                  <DetailRow label="Type" value={normalizeAndCapitalize(issue.type)} />
                  <DetailRow label="Severity" value={(issue.severity || "Medium").replace(/^./, (c) => c.toUpperCase())} />
                  <DetailRow label="Status" value={sp.label} />
                  {issue.cost ? <DetailRow label="Budget" value={`$${issue.cost}`} /> : null}
                  {address ? (
                    <DetailRow
                      label="Location"
                      value={[address.city, address.state].filter(Boolean).join(", ") || "—"}
                    />
                  ) : null}
                  <DetailRow
                    label="Posted"
                    value={new Date(issue.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  />
                </View>
              </View>
            )}

            {tab === "offers" && (
              <View className="mb-6">
                {/* Vendor header + Quote CTA */}
                <View className="flex-row items-center justify-between bg-muted rounded-xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white font-bold">
                        {(vendor?.company_name || vendor?.name || "V").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="ml-3">
                      <Text className="font-semibold text-foreground">
                        {vendor?.company_name || vendor?.name || "Your Company"}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={12} color="#D4A853" />
                        <Text className="text-xs text-muted-foreground ml-1">
                          {vendor?.rating ? parseFloat(vendor.rating).toFixed(1) : "5.0"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {myOffers.length === 0 && !hasAccepted && !showOfferForm && (
                    <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg flex-row items-center" onPress={openCreateForm}>
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text className="text-white font-medium ml-1">Quote</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Offer form */}
                {showOfferForm && (
                  <View className="border border-border rounded-xl p-4 mb-3">
                    <Text className="text-sm font-medium text-foreground mb-1">Price ($)</Text>
                    <TextInput
                      className="border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="Enter your bid amount"
                      placeholderTextColor="#9CA3AF"
                      value={price}
                      onChangeText={(text) => {
                        setPrice(text);
                        if (offerError) setOfferError("");
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Text className="text-sm font-medium text-foreground mb-1 mt-3">Comment (optional)</Text>
                    <TextInput
                      className="border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="Describe your approach..."
                      placeholderTextColor="#9CA3AF"
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      style={{ minHeight: 70, textAlignVertical: "top" }}
                    />
                    {offerError ? (
                      <View className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                        <Text className="text-sm text-red-600">{offerError}</Text>
                      </View>
                    ) : null}
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        className="flex-1 bg-muted rounded-xl py-3 items-center"
                        onPress={() => {
                          setShowOfferForm(false);
                          setEditingOffer(null);
                          setOfferError("");
                        }}
                      >
                        <Text className="text-muted-foreground font-semibold">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-primary rounded-xl py-3 items-center"
                        onPress={submitOffer}
                        disabled={creatingOffer || updatingOffer}
                      >
                        {creatingOffer || updatingOffer ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white font-bold">
                            {editingOffer ? "Update Quote" : "Confirm Offer"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!showOfferForm && offerError ? (
                  <View className="mb-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <Text className="text-sm text-red-600">{offerError}</Text>
                  </View>
                ) : null}

                {/* My offers list */}
                {myOffers.length === 0 && !showOfferForm ? (
                  <View className="bg-muted rounded-xl p-6 items-center">
                    <Ionicons name="pricetag-outline" size={28} color="#9CA3AF" />
                    <Text className="text-muted-foreground mt-2 text-center">
                      You haven't submitted a quote yet. Tap “Quote” above to bid on this job.
                    </Text>
                  </View>
                ) : (
                  myOffers.map((offer) => {
                    const pill = offerPill(offer.status);
                    const isCounter =
                      offer.status === IssueOfferStatus.RECEIVED &&
                      (offer.comment_client || "").toLowerCase().includes("counter");
                    return (
                      <View key={offer.id} className="border border-border rounded-xl p-4 mb-3">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-lg font-bold text-foreground">${offer.price}</Text>
                          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: pill.bg }}>
                            <Text className="text-xs font-medium" style={{ color: pill.fg }}>
                              {ISSUE_OFFER_STATUS_LABELS[offer.status]}
                            </Text>
                          </View>
                        </View>
                        {offer.comment_vendor ? (
                          <Text className="text-sm text-muted-foreground mt-2">{offer.comment_vendor}</Text>
                        ) : null}
                        {offer.comment_client ? (
                          <Text className="text-sm text-primary mt-1">Client: {offer.comment_client}</Text>
                        ) : null}

                        {offer.status === IssueOfferStatus.RECEIVED && !hasAccepted && (
                          <View className="flex-row gap-2 mt-3">
                            {isCounter ? (
                              <TouchableOpacity
                                className="flex-1 bg-primary rounded-lg py-2.5 items-center"
                                onPress={() =>
                                  setConfirmModal({ type: "accept", offer, isLoading: false })
                                }
                              >
                                <Text className="text-white font-semibold">Accept Counter</Text>
                              </TouchableOpacity>
                            ) : (
                              <>
                                <TouchableOpacity
                                  className="flex-1 bg-foreground rounded-lg py-2.5 items-center"
                                  onPress={() => openEditForm(offer)}
                                >
                                  <Text className="text-white font-semibold">Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  className="flex-1 border border-border rounded-lg py-2.5 items-center"
                                  onPress={() => withdrawOffer(offer)}
                                >
                                  <Text className="text-destructive font-semibold">Withdraw</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                {hasAccepted && (
                  <View className="bg-green-50 border border-green-100 rounded-xl p-4 mt-1">
                    <Text className="text-green-700 text-sm">
                      Offer accepted. The customer will now confirm an assessment time.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {tab === "schedule" && (
              <View className="mb-6">
                {/* Existing proposals */}
                {(assessments ?? []).length > 0 && (
                  <View className="mb-4">
                    <Text className="text-base font-semibold text-foreground mb-2">Proposed Visits</Text>
                    {(assessments ?? []).map((a) => {
                      const accepted = (a.status as string)?.toLowerCase().includes("accepted");
                      const pending = (a.status as string)?.toLowerCase().includes("received");
                      const mine = a.user_id === Number(user?.id);
                      return (
                        <View
                          key={a.id}
                          className="border border-border rounded-xl p-4 mb-2"
                          style={accepted ? { borderColor: "#10b981", backgroundColor: "#ecfdf5" } : undefined}
                        >
                          <View className="flex-row justify-between items-center">
                            <Text className="font-medium text-foreground">
                              {new Date(a.start_time).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </Text>
                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: accepted ? "#10b981" : "#fef3c7" }}
                            >
                              <Text className="text-xs font-medium" style={{ color: accepted ? "#fff" : "#b45309" }}>
                                {accepted ? "Confirmed" : mine ? "Awaiting reply" : "Action needed"}
                              </Text>
                            </View>
                          </View>
                          {pending && !mine && (
                            <View className="flex-row gap-2 mt-3">
                              <TouchableOpacity
                                className="flex-1 bg-foreground rounded-lg py-2.5 items-center"
                                onPress={() => respondToAssessment(a, true)}
                              >
                                <Text className="text-white font-semibold">Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="flex-1 border border-border rounded-lg py-2.5 items-center"
                                onPress={() => respondToAssessment(a, false)}
                              >
                                <Text className="text-destructive font-semibold">Decline</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Propose a new time */}
                <Text className="text-base font-semibold text-foreground mb-2">Propose a Visit Time</Text>
                <TextInput
                  className="border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="2026-06-15 10:00"
                  placeholderTextColor="#9CA3AF"
                  value={proposedDate}
                  onChangeText={setProposedDate}
                />
                <TouchableOpacity
                  className="bg-foreground rounded-xl py-3 items-center mt-3"
                  onPress={proposeVisit}
                  disabled={creatingAssessment}
                >
                  {creatingAssessment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">Propose Visit</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {tab === "dispute" && (
              <DisputeTab issueOfferId={primaryOffer?.id} userType="vendor" />
            )}

            <View className="h-10" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Withdraw / accept confirmation — mirrors web OffersTabVendor modal */}
        {confirmModal.type && confirmModal.offer ? (
          <View className="absolute inset-0 z-50 justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View className="bg-white rounded-xl overflow-hidden mx-auto w-full max-w-md">
              <View
                className={`px-5 py-4 ${confirmModal.type === "withdraw" ? "bg-red-50" : "bg-emerald-50"}`}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      confirmModal.type === "withdraw" ? "bg-red-100" : "bg-emerald-100"
                    }`}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={20}
                      color={confirmModal.type === "withdraw" ? "#dc2626" : "#059669"}
                    />
                  </View>
                  <Text className="text-lg font-semibold text-foreground flex-1">
                    {confirmModal.type === "withdraw" ? "Withdraw quote?" : "Accept counter offer?"}
                  </Text>
                </View>
              </View>

              <View className="px-5 py-4">
                {confirmModal.type === "withdraw" ? (
                  <>
                    <Text className="text-sm text-muted-foreground">
                      Are you sure you want to withdraw your quote of{" "}
                      <Text className="font-semibold text-foreground">${confirmModal.offer.price}</Text>?
                    </Text>
                    <View className="bg-muted rounded-lg p-3 border border-border mt-3">
                      <Text className="text-xs text-muted-foreground">
                        This action cannot be undone. You'll need to submit a new quote if you change your mind.
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="text-sm text-muted-foreground">
                      Accept the counter offer of{" "}
                      <Text className="font-semibold text-foreground">${confirmModal.offer.price}</Text>?
                    </Text>
                    <View className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 mt-3">
                      <Text className="text-xs text-emerald-700">
                        By accepting, you agree to complete this job at the counter offer price.
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <View className="px-5 py-4 bg-muted/40 border-t border-border flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 py-2.5 rounded-lg border border-border bg-white items-center"
                  disabled={confirmModal.isLoading}
                  onPress={() => setConfirmModal({ type: null, offer: null, isLoading: false })}
                >
                  <Text className="text-sm font-medium text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-2.5 rounded-lg items-center ${
                    confirmModal.type === "withdraw" ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  disabled={confirmModal.isLoading}
                  onPress={confirmModal.type === "withdraw" ? confirmWithdraw : confirmAcceptCounter}
                >
                  {confirmModal.isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-sm font-medium text-white">
                      {confirmModal.type === "withdraw" ? "Yes, Withdraw quote" : "Yes, Accept"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}
