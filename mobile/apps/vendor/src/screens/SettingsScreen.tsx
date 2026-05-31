import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  RootState,
  logout,
  useGetVendorByVendorUserIdQuery,
  useUpdateVendorMutation,
  useGetVendorTypesQuery,
  Vendor,
} from "@inspectly/shared";
import { SettingsHeroBand } from "../components/SettingsHeroBand";
import { DashboardSectionCard } from "../components/DashboardSectionCard";
import { DASHBOARD_PAGE_BG, dashboardCardShadow } from "../constants/dashboardTheme";
import { getFloatingTabBarScenePadding } from "../navigation/FloatingTabBar";

type Tab = "profile" | "notifications" | "verification";

const TAB_META: Record<Tab, { label: string }> = {
  profile: { label: "Profile" },
  notifications: { label: "Notifications" },
  verification: { label: "Verification" },
};

const TABS: Tab[] = ["profile", "notifications", "verification"];

function SettingsTabSwitch({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View
      className="w-full flex-row bg-white border border-border/60 rounded-full p-1.5 gap-1.5 shadow-card"
      style={dashboardCardShadow}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            className={`flex-1 items-center justify-center py-2.5 rounded-full ${
              active ? "bg-muted border border-border/60" : ""
            }`}
            onPress={() => onChange(tab)}
            activeOpacity={0.85}
          >
            <Text className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {TAB_META[tab].label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface VendorFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  serviceArea: string;
  businessType: string;
  license: string;
}

function getInitialFormData(vendor?: Vendor): VendorFormData {
  return {
    name: vendor?.name || "",
    contactName: "",
    email: vendor?.email || "",
    phone: vendor?.phone || "",
    serviceArea: [vendor?.city, vendor?.state].filter(Boolean).join(", "),
    businessType: vendor?.vendor_types || "",
    license: vendor?.license || "",
  };
}

function showToast(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const listBottomPadding = getFloatingTabBarScenePadding(insets.bottom);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: vendor, isLoading, refetch } = useGetVendorByVendorUserIdQuery(user?.id?.toString() || "", {
    skip: !user?.id,
  });
  const { data: vendorTypesList } = useGetVendorTypesQuery();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [formData, setFormData] = useState<VendorFormData>(getInitialFormData());

  useEffect(() => {
    if (vendor) setFormData(getInitialFormData(vendor));
  }, [vendor]);

  const initialData = useMemo(() => getInitialFormData(vendor), [vendor]);
  const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      dispatch(logout());
    }
  };

  const handleCancel = () => setFormData(initialData);

  const handleSave = async () => {
    if (!vendor?.id) return;
    const [city = "", state = ""] = formData.serviceArea.split(",").map((s) => s.trim());

    try {
      await updateVendor({
        id: vendor.id,
        vendor_user_id: user?.id,
        vendor_type: { vendor_type: formData.businessType },
        vendor_types: formData.businessType,
        code: vendor.code,
        license: formData.license,
        verified: vendor.verified,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: vendor.address,
        city,
        state,
        country: vendor.country,
        postal_code: vendor.postal_code,
        rating: vendor.rating,
        review: vendor.review,
      }).unwrap();
      showToast("Success", "Profile updated successfully");
      refetch();
    } catch {
      showToast("Error", "Failed to update profile");
    }
  };

  const businessType = vendor?.vendor_types || vendor?.vendor_type?.vendor_type;

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${DASHBOARD_PAGE_BG} items-center justify-center`} edges={["top"]}>
        <ActivityIndicator size="large" color="#D4A853" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${DASHBOARD_PAGE_BG}`} edges={["top"]}>
      <ScrollView
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: listBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-4">
          <SettingsHeroBand
            vendorName={formData.name || vendor?.name}
            businessType={businessType}
            verified={vendor?.verified}
          />
        </View>

        <DashboardSectionCard className="mb-4">
          <View className="px-5 pt-5 pb-4 border-b border-border/60">
            <SettingsTabSwitch activeTab={activeTab} onChange={setActiveTab} />
          </View>

          {activeTab === "profile" && (
            <View className="px-5 py-5">
              <View className="mb-5">
                <View className="h-28 w-full rounded-xl bg-muted overflow-hidden" />
                <View className="w-20 h-20 rounded-full border-4 border-white bg-muted -mt-10 ml-4 items-center justify-center">
                  <Text className="text-xs text-muted-foreground">No photo</Text>
                </View>
              </View>

              <Field label="Business Name" value={formData.name} onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))} />
              <Field
                label="Contact Name"
                value={formData.contactName}
                onChangeText={(v) => setFormData((p) => ({ ...p, contactName: v }))}
                placeholder="Enter contact name"
              />
              <Field label="Email" value={formData.email} editable={false} muted />
              <Field label="Phone" value={formData.phone} onChangeText={(v) => setFormData((p) => ({ ...p, phone: v }))} />
              <Field
                label="Service Area"
                value={formData.serviceArea}
                onChangeText={(v) => setFormData((p) => ({ ...p, serviceArea: v }))}
                placeholder="e.g. London, ON"
              />

              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  className={`flex-1 bg-primary rounded-lg py-3 items-center ${!isChanged || isUpdating ? "opacity-50" : ""}`}
                  onPress={handleSave}
                  disabled={!isChanged || isUpdating}
                >
                  <Text className="text-white font-semibold">{isUpdating ? "Saving..." : "Save Changes"}</Text>
                </TouchableOpacity>
                {isChanged && (
                  <TouchableOpacity
                    className="flex-1 border border-border rounded-lg py-3 items-center"
                    onPress={handleCancel}
                  >
                    <Text className="text-foreground font-semibold">Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {activeTab === "notifications" && (
            <View className="px-5 py-6">
              <Text className="text-sm text-muted-foreground">We are working on it!</Text>
            </View>
          )}

          {activeTab === "verification" && (
            <View className="px-5 py-5">
              <Text className="text-sm font-medium text-foreground mb-2">Status</Text>
              <View
                className={`self-start px-3 py-1 rounded-full mb-5 ${vendor?.verified ? "bg-green-100" : "bg-yellow-100"}`}
              >
                <Text className={`text-sm font-medium ${vendor?.verified ? "text-green-800" : "text-yellow-800"}`}>
                  {vendor?.verified ? "Verified" : "Pending Verification"}
                </Text>
              </View>

              <Text className="text-sm font-medium text-foreground mb-2">Business Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-grow-0">
                <View className="flex-row gap-2">
                  {(vendorTypesList ?? []).map((type) => {
                    const value = type.vendor_type;
                    const selected = formData.businessType === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => setFormData((p) => ({ ...p, businessType: value }))}
                        className={`px-3 py-2 rounded-lg border ${
                          selected ? "bg-primary/10 border-primary" : "bg-muted border-border"
                        }`}
                      >
                        <Text className={`text-xs font-medium ${selected ? "text-primary" : "text-foreground"}`}>
                          {value}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Field
                label="License Number"
                value={formData.license}
                onChangeText={(v) => setFormData((p) => ({ ...p, license: v }))}
                placeholder="Enter license number"
              />

              <TouchableOpacity
                className={`bg-primary rounded-lg py-3 items-center mt-2 ${!isChanged || isUpdating ? "opacity-50" : ""}`}
                onPress={handleSave}
                disabled={!isChanged || isUpdating}
              >
                <Text className="text-white font-semibold">{isUpdating ? "Saving..." : "Save Changes"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard className="mb-8">
          <TouchableOpacity className="px-5 py-4 items-center" onPress={handleLogout} activeOpacity={0.85}>
            <Text className="text-destructive font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </DashboardSectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  muted = false,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  editable?: boolean;
  muted?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-2">{label}</Text>
      <TextInput
        className={`border border-border rounded-lg px-4 py-2.5 text-foreground ${
          muted || !editable ? "bg-muted text-muted-foreground" : "bg-white"
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        autoCapitalize="none"
      />
    </View>
  );
}
