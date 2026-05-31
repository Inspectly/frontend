import React from "react";
import { View, Text } from "react-native";
import { TrackerStep, STAGE_TRACKER_LABEL, JobStage } from "@inspectly/shared";

interface StepTrackerProps {
  currentStep: TrackerStep;
  overdue?: boolean;
  labelOverride?: string;
  stage?: JobStage;
}

export function StepTracker({ currentStep, overdue = false, labelOverride, stage }: StepTrackerProps) {
  const label = labelOverride ?? (stage ? STAGE_TRACKER_LABEL[stage] : undefined) ?? "In progress";

  return (
    <View className="flex-row items-center gap-2 mt-2">
      <View className="flex-row items-center gap-1 flex-1 max-w-[140px]">
        {[1, 2, 3, 4, 5].map((step) => {
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          let bg = "#d1d5db33";
          if (isActive) bg = overdue ? "#f43f5e" : "#D4A853";
          else if (isCompleted) bg = overdue ? "#fecdd3" : "#D4A85380";
          return (
            <View key={step} style={{ height: 4, flex: 1, borderRadius: 999, backgroundColor: bg }} />
          );
        })}
      </View>
      <Text
        className="text-[10px] font-bold uppercase"
        style={{ color: overdue ? "#e11d48" : "#374151" }}
        numberOfLines={1}
      >
        {label}{" "}
        <Text style={{ color: "#9ca3af" }}>
          {currentStep}/5
        </Text>
      </Text>
    </View>
  );
}
