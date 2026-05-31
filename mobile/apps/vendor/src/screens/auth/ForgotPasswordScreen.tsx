import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const initialEmail = (route.params as { email?: string } | undefined)?.email ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSend = async () => {
    setStatus(null);
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Generic message regardless, to avoid revealing whether the email exists
    } finally {
      setStatus("If an account exists for that email, a reset link has been sent.");
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-6 justify-center"
      >
        <TouchableOpacity
          className="absolute top-4 left-4 h-10 w-10 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-3xl font-extrabold text-foreground">Reset password</Text>
          <Text className="text-muted-foreground mt-2">
            We'll email you a link to reset your password.
          </Text>
        </View>

        {status && (
          <View className="mb-4 p-3 rounded-lg bg-green-50">
            <Text className="text-green-700 text-sm font-medium">{status}</Text>
          </View>
        )}

        <View>
          <Text className="text-sm font-medium text-foreground mb-1">Email</Text>
          <TextInput
            className="border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="you@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mt-4"
          onPress={handleSend}
          disabled={sending}
        >
          <Text className="text-primary-foreground font-bold text-base">
            {sending ? "Sending..." : "Send reset link"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center mt-4" onPress={() => navigation.goBack()}>
          <Text className="text-muted-foreground">Back to sign in</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
