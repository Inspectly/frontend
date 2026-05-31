import React from "react";
import { View, Text } from "react-native";
import { EarningsChartPoint, formatMoneyShort } from "@inspectly/shared";

interface EarningsAreaChartProps {
  data: EarningsChartPoint[];
  height?: number;
}

/** Area-style earnings chart using native Views (no Recharts dependency). */
export function EarningsAreaChart({ data, height = 160 }: EarningsAreaChartProps) {
  const max = Math.max(...data.map((d) => d.spend), 1);

  return (
    <View style={{ height }}>
      <View className="flex-row items-end justify-between flex-1 px-1">
        {data.map((point) => {
          const barHeight = Math.max(4, (point.spend / max) * (height - 36));
          return (
            <View key={point.key} className="flex-1 items-center mx-0.5">
              <Text className="text-[9px] text-muted-foreground mb-1" numberOfLines={1}>
                {point.spend > 0 ? formatMoneyShort(point.spend) : ""}
              </Text>
              <View
                style={{
                  height: barHeight,
                  width: "72%",
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: "#D4A853",
                  opacity: point.spend > 0 ? 1 : 0.25,
                }}
              />
              <Text className="text-[10px] text-muted-foreground mt-1">{point.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
