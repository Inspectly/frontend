import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { RootState, logout, useGetClientByUserIdQuery } from "@inspectly/shared";

export function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: client } = useGetClientByUserIdQuery(user?.id?.toString(), { skip: !user?.id });

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      dispatch(logout());
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <Text className="text-2xl font-bold text-foreground mt-4">Settings</Text>
        <Text className="text-muted-foreground mt-1 mb-6">Manage your account</Text>

        {/* Profile Section */}
        <View className="bg-white border border-border rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground">Profile</Text>
          {client && (
            <View className="mt-3">
              <Text className="text-foreground">
                {client.first_name} {client.last_name}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">{client.email}</Text>
              <Text className="text-sm text-muted-foreground mt-1">{client.phone}</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {client.address}, {client.city}, {client.state}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 items-center"
          onPress={handleLogout}
        >
          <Text className="text-destructive font-semibold">Sign Out</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
