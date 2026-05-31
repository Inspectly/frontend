import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { PlatformPressable } from "@react-navigation/elements";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

/** Footer tab button — PlatformPressable keeps web tab navigation from full-page reloads. */
export function ShadowTabBarButton({ style, ...rest }: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...rest}
      pressOpacity={0.88}
      style={[
        StyleSheet.flatten(style as StyleProp<ViewStyle>),
        {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    />
  );
}
