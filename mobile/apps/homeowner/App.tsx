import "./global.css";
import React, { useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createAppStore, setBaseUrl } from "@inspectly/shared";
import { API_BASE_URL } from "./src/constants/config";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AuthGate } from "./src/components/AuthGate";

setBaseUrl(API_BASE_URL);

const store = createAppStore(AsyncStorage);
const persistor = persistStore(store);

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#D4A853" />
    </View>
  );
}

export default function App() {
  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: false,
      colors: {
        ...DefaultTheme.colors,
        primary: "#D4A853",
        background: "#FFFFFF",
        card: "#FFFFFF",
        text: "#1A1A1A",
        border: "#E5E7EB",
        notification: "#D4A853",
      },
    }),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <SafeAreaProvider>
            <NavigationContainer theme={navTheme as any}>
              <StatusBar style="dark" />
              <AuthGate>
                <RootNavigator />
              </AuthGate>
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
