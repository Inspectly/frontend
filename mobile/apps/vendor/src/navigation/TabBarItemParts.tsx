import React from "react";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TabBarLabelProps {
  focused: boolean;
  color: string;
  children: string;
}

export function TabBarLabel({ focused, color, children }: TabBarLabelProps) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? "600" : "500",
        lineHeight: 12,
        color,
        marginTop: 1,
      }}
    >
      {children}
    </Text>
  );
}

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function TabBarIcon({ name, color }: TabBarIconProps) {
  return <Ionicons name={name} size={22} color={color} />;
}
