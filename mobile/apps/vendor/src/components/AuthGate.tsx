import React, { useEffect, ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { checkAuthState, RootState } from "@inspectly/shared";
import { auth } from "../lib/firebase";
import { usePushNotifications } from "../hooks/usePushNotifications";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const dispatch = useDispatch();
  const { loading, authenticated, user } = useSelector((state: RootState) => state.auth);

  usePushNotifications({
    userId: user?.id,
    appType: "vendor",
    enabled: authenticated,
  });

  useEffect(() => {
    dispatch(
      checkAuthState({
        onAuthStateChanged: (authInstance: any, callback: any) =>
          onAuthStateChanged(authInstance, callback),
        auth,
      }) as any
    );
  }, [dispatch]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#D4A853" />
      </View>
    );
  }

  return <>{children}</>;
}
