import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Ionicons } from "@expo/vector-icons";
import { DashboardStack } from "./DashboardStack";
import { MarketplaceScreen } from "../screens/MarketplaceScreen";
import { MyJobsScreen } from "../screens/MyJobsScreen";
import { EarningsScreen } from "../screens/EarningsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ShadowTabBarButton } from "./ShadowTabBarButton";
import { FloatingTabBar, getFloatingTabBarScenePadding } from "./FloatingTabBar";
import { TabBarIcon, TabBarLabel } from "./TabBarItemParts";
import { FLOATING_TAB_BAR_HEIGHT } from "../constants/dashboardTheme";

export type MainTabsParamList = {
  Dashboard: undefined;
  Marketplace: undefined;
  MyJobs: { tab?: "active" | "completed" | "pending" | "rejected" | "disputed" | "all" } | undefined;
  Earnings: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const scenePaddingBottom = getFloatingTabBarScenePadding(insets.bottom);

  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      sceneContainerStyle={{
        backgroundColor: "#F5F5F5",
        paddingBottom: scenePaddingBottom,
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#D4A853",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabel: ({ focused, color, children }) => (
          <TabBarLabel focused={focused} color={color}>
            {typeof children === "string" ? children : ""}
          </TabBarLabel>
        ),
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 0,
          height: FLOATING_TAB_BAR_HEIGHT,
        },
        tabBarButton: (props) => <ShadowTabBarButton {...props} />,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          switch (route.name) {
            case "Dashboard":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Marketplace":
              iconName = focused ? "search" : "search-outline";
              break;
            case "MyJobs":
              iconName = focused ? "briefcase" : "briefcase-outline";
              break;
            case "Earnings":
              iconName = focused ? "wallet" : "wallet-outline";
              break;
            case "Settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
          }
          return <TabBarIcon name={iconName} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="MyJobs" component={MyJobsScreen} options={{ title: "My Jobs" }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
