import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EarningsRangeKey, EARNINGS_RANGE_LABEL } from "@inspectly/shared";
import { dashboardCardShadow } from "../constants/dashboardTheme";

interface EarningsRangeSelectProps {
  value: EarningsRangeKey;
  onChange: (value: EarningsRangeKey) => void;
}

const RANGE_OPTIONS = Object.keys(EARNINGS_RANGE_LABEL) as EarningsRangeKey[];

/** Compact range picker — in-flow menu avoids overlapping card content below. */
export function EarningsRangeSelect({ value, onChange }: EarningsRangeSelectProps) {
  const [open, setOpen] = useState(false);

  const select = (key: EarningsRangeKey) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <View className="items-end self-start">
      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-white"
      >
        <Text className="text-xs font-semibold text-foreground">{EARNINGS_RANGE_LABEL[value]}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={12} color="#374151" />
      </TouchableOpacity>

      {open && (
        <View
          className="mt-1 w-40 bg-white rounded-lg border border-border overflow-hidden"
          style={[dashboardCardShadow, Platform.OS === "android" ? { elevation: 8 } : undefined]}
        >
          {RANGE_OPTIONS.map((key) => {
            const active = key === value;
            return (
              <TouchableOpacity
                key={key}
                className="px-3 py-2.5"
                onPress={() => select(key)}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs leading-4 ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {EARNINGS_RANGE_LABEL[key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
