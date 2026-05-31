import React, { useEffect } from "react";
import { Text, TouchableOpacity, Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface BrowseJobsCtaProps {
  onPress: () => void;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function BrowseJobsCta({ onPress, label = "Find Jobs", icon = "add" }: BrowseJobsCtaProps) {
  const sweepProgress = useSharedValue(0);
  const haloProgress = useSharedValue(0);

  useEffect(() => {
    sweepProgress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      false
    );

    haloProgress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [sweepProgress, haloProgress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweepProgress.value, [0, 1], [-72, 220]) }],
    opacity: interpolate(sweepProgress.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(haloProgress.value, [0, 1], [0.55, 0.95]),
    transform: [{ scale: interpolate(haloProgress.value, [0, 1], [1, 1.04]) }],
  }));

  const isWeb = Platform.OS === "web";

  return (
    <View className="relative shrink-0 p-1.5">
      {isWeb ? (
        <View
          pointerEvents="none"
          className="absolute -inset-1.5 rounded-2xl bg-primary/40 blur-md animate-cta-halo"
        />
      ) : (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -6,
              left: -6,
              right: -6,
              bottom: -6,
              borderRadius: 16,
              backgroundColor: "rgba(212, 168, 83, 0.4)",
            },
            haloStyle,
          ]}
        />
      )}

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        className="browse-jobs-cta relative flex-row items-center gap-2 px-4 py-2.5 rounded-xl bg-primary overflow-hidden hover:ring-2 hover:ring-primary/80 hover:shadow-gold-glow transition-all"
        style={
          Platform.OS === "ios"
            ? {
                shadowColor: "#140F05",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }
            : undefined
        }
      >
        {isWeb ? (
          <View
            pointerEvents="none"
            className="absolute top-0 -left-1/3 h-full w-1/3 animate-cta-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        ) : (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                width: "33%",
                height: "100%",
                backgroundColor: "rgba(255,255,255,0.35)",
              },
              sweepStyle,
            ]}
          />
        )}

        <Ionicons name={icon} size={14} color="#FFFFFF" style={{ zIndex: 1 }} />
        <Text className="text-white font-bold text-sm" style={{ zIndex: 1 }}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
