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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useGoogleSignIn } from "../../hooks/useGoogleSignIn";
import { useLoginSession } from "../../hooks/useLoginSession";

type LoginNav = NativeStackNavigationProp<RootStackParamList, "Login">;

export function LoginScreen() {
  const navigation = useNavigation<LoginNav>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordSession = useLoginSession();

  const { signIn: googleSignIn, configured: googleConfigured } = useGoogleSignIn({
    onSuccess: (cred) => {
      setError(null);
      recordSession(cred.user, "gmail");
    },
    onError: (err: any) => {
      setLoading(false);
      setError(err?.message ?? "Failed to sign in with Google.");
    },
  });

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!agree) {
      setError("You must agree to the terms.");
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      recordSession(cred.user, "email");
    } catch (error: any) {
      const msg =
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
          ? "Incorrect email and/or password. Please try again."
          : error.code === "auth/too-many-requests"
          ? "Too many failed attempts. Please try again later or reset your password."
          : error.code === "auth/user-disabled"
          ? "This account has been disabled. Please contact support."
          : error.code === "auth/network-request-failed"
          ? "Network error. Please check your connection and try again."
          : error.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setError(null);
    if (!agree) {
      setError("You must agree to the terms.");
      return;
    }
    setLoading(true);
    googleSignIn();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-10">
          <View className="h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-3">
            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
          </View>
          <Text className="text-3xl font-bold text-foreground">Sign In</Text>
          <Text className="text-muted-foreground mt-2">Welcome back to Inspectly</Text>
        </View>

        <View className="gap-4">
          {error ? (
            <View className="p-3 rounded-lg bg-red-50">
              <Text className="text-red-600 text-sm font-medium text-center">{error}</Text>
            </View>
          ) : null}

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

          <View>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-medium text-foreground">Password</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword", { email })}
              >
                <Text className="text-xs font-semibold text-primary">Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center border border-border rounded-xl px-4">
              <TextInput
                className="flex-1 py-3 text-foreground"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => setAgree((a) => !a)}
          >
            <View
              className={`h-5 w-5 rounded border items-center justify-center ${
                agree ? "bg-primary border-primary" : "border-gray-400"
              }`}
            >
              {agree && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text className="text-xs text-muted-foreground ml-2 flex-1">
              I agree to the Privacy Policy and Terms & Conditions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center mt-1"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-primary-foreground font-bold text-base">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-2">
            <View className="flex-1 h-px bg-border" />
            <Text className="mx-3 text-xs text-muted-foreground uppercase">or continue with</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-3 border border-border rounded-xl py-4"
            onPress={handleGoogle}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text className="text-foreground font-semibold">Sign In with Google</Text>
          </TouchableOpacity>
          {!googleConfigured && (
            <Text className="text-[11px] text-muted-foreground text-center">
              Google sign-in needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID configured.
            </Text>
          )}

          <TouchableOpacity
            className="items-center mt-4"
            onPress={() => navigation.navigate("Signup")}
          >
            <Text className="text-muted-foreground">
              Don't have an account?{" "}
              <Text className="text-primary font-semibold">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
