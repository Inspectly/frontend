import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IssueImageCarouselProps {
  images: string[];
  height?: number;
  rounded?: boolean;
}

/**
 * Horizontal paging image carousel with dot indicators, page counter, and
 * prev/next arrows (important on web where swipe inside ScrollView is unreliable).
 */
export function IssueImageCarousel({ images, height = 220, rounded = true }: IssueImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [images.join("|")]);

  const hasImages = images.length > 0;
  const canPage = images.length > 1 && width > 0;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  return (
    <View
      style={{ height, borderRadius: rounded ? 12 : 0, overflow: "hidden", backgroundColor: "#E5E7EB" }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {hasImages && width > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ width, height }}
          contentContainerStyle={{ width: width * images.length, height }}
        >
          {images.map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              style={{ width, height }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          <Text style={{ color: "#9CA3AF", marginTop: 6, fontSize: 12 }}>No photos</Text>
        </View>
      )}

      {/* Prev / next arrows */}
      {canPage && (
        <>
          <TouchableOpacity
            onPress={() => goTo(index - 1)}
            disabled={index === 0}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              marginTop: -18,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
              opacity: index === 0 ? 0.35 : 1,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => goTo(index + 1)}
            disabled={index === images.length - 1}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              marginTop: -18,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
              opacity: index === images.length - 1 ? 0.35 : 1,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Page counter */}
      {canPage && (
        <View
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(0,0,0,0.6)",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
            {index + 1} / {images.length}
          </Text>
        </View>
      )}

      {/* Dot indicators */}
      {canPage && (
        <View
          style={{
            position: "absolute",
            bottom: Platform.OS === "web" ? 14 : 10,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {images.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
