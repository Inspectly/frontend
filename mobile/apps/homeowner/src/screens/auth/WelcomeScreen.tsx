import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type WelcomeNav = NativeStackNavigationProp<RootStackParamList, "Welcome">;

const FEATURES = [
  { icon: "home-outline", label: "Manage your properties" },
  { icon: "people-outline", label: "Connect with trusted vendors" },
  { icon: "shield-checkmark-outline", label: "Track inspections & repairs" },
] as const;

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNav>();

  return (
    <View className="flex-1 bg-foreground">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 justify-between py-8">
          <View className="mt-8">
            <View className="flex-row items-center gap-2">
              <View className="h-12 w-12 rounded-2xl bg-primary items-center justify-center">
                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-extrabold text-white">Inspectly</Text>
            </View>

            <Text className="text-white text-4xl font-extrabold mt-12 leading-tight">
              Your home,{"\n"}expertly cared for.
            </Text>
            <Text className="text-gray-300 text-base mt-4 leading-relaxed">
              Manage properties, get vendor offers, and track every inspection and
              repair — all in one place.
            </Text>

            <View className="mt-10 gap-4">
              {FEATURES.map((f) => (
                <View key={f.label} className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-full bg-primary/20 items-center justify-center">
                    <Ionicons name={f.icon} size={20} color="#D4A853" />
                  </View>
                  <Text className="text-gray-200 text-base">{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              onPress={() => navigation.navigate("Signup")}
            >
              <Text className="text-primary-foreground font-bold text-base">Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border border-gray-600 rounded-xl py-4 items-center"
              onPress={() => navigation.navigate("Login")}
            >
              <Text className="text-white font-bold text-base">I already have an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
