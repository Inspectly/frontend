import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useNavigation } from "@react-navigation/native";
import { useCreateUserMutation, useCreateVendorMutation } from "@inspectly/shared";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

import { useLoginSession } from "../../hooks/useLoginSession";

type SignupNav = NativeStackNavigationProp<RootStackParamList, "Signup">;

export function SignupScreen() {
  const navigation = useNavigation<SignupNav>();
  const [createUser] = useCreateUserMutation();
  const [createVendor] = useCreateVendorMutation();
  const [loading, setLoading] = useState(false);
  const recordSession = useLoginSession();

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.name) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const firebaseId = cred.user.uid;

      const userResult = await createUser({
        firebase_id: firebaseId,
        user_type: "vendor",
      }).unwrap();

      await createVendor({
        vendor_user_id: userResult.id,
        name: form.name,
        company_name: form.companyName,
        email: form.email.trim(),
        phone: form.phone,
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
      }).unwrap();

      recordSession(cred.user, "email");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ justifyContent: "center", paddingVertical: 40 }}>
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-primary">Inspectly Pro</Text>
            <Text className="text-muted-foreground mt-2">Create your vendor account</Text>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-1">Full Name *</Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-foreground"
                value={form.name}
                onChangeText={(v) => update("name", v)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">Company Name</Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-foreground"
                value={form.companyName}
                onChangeText={(v) => update("companyName", v)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">Email *</Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-foreground"
                value={form.email}
                onChangeText={(v) => update("email", v)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">Phone</Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-foreground"
                value={form.phone}
                onChangeText={(v) => update("phone", v)}
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">Password *</Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-foreground"
                value={form.password}
                onChangeText={(v) => update("password", v)}
                secureTextEntry
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1">Confirm Password *</Text>
              <TextInput
                className="border border-border rounded-xl px-4 py-3 text-foreground"
                value={form.confirmPassword}
                onChangeText={(v) => update("confirmPassword", v)}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center mt-2"
              onPress={handleSignup}
              disabled={loading}
            >
              <Text className="text-primary-foreground font-bold text-base">
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center mt-4"
              onPress={() => navigation.navigate("Login")}
            >
              <Text className="text-muted-foreground">
                Already have an account?{" "}
                <Text className="text-primary font-semibold">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
