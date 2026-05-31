import React from "react";
import { Platform, View } from "react-native";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  dashboardFloatingCardShadow,
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_H_MARGIN,
} from "../constants/dashboardTheme";

export function getFloatingTabBarBottomInset(insetsBottom: number): number {
  return Math.max(insetsBottom, Platform.OS === "ios" ? 10 : 12);
}

/** Bottom inset reserved for content so lists clear the floating tab bar. */
export function getFloatingTabBarScenePadding(insetsBottom: number): number {
  return FLOATING_TAB_BAR_HEIGHT + getFloatingTabBarBottomInset(insetsBottom) + 12;
}

export function FloatingTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = getFloatingTabBarBottomInset(insets.bottom);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: FLOATING_TAB_BAR_H_MARGIN,
        paddingBottom: bottom,
      }}
    >
      <View
        className="rounded-[22px] bg-white border border-border/60 shadow-card-float"
        style={dashboardFloatingCardShadow}
      >
        <BottomTabBar
          {...props}
          insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
          style={{
            height: FLOATING_TAB_BAR_HEIGHT,
            minHeight: FLOATING_TAB_BAR_HEIGHT,
            paddingTop: 0,
            paddingBottom: 0,
            paddingHorizontal: 6,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            shadowColor: "transparent",
            shadowOpacity: 0,
          }}
        />
      </View>
    </View>
  );
}
