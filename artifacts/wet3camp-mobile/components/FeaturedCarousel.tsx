import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Profile } from "./ProfileCard";

interface FeaturedCarouselProps {
  profiles: Profile[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

export function FeaturedCarousel({ profiles }: FeaturedCarouselProps) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleBook = (profile: Profile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12));
          setActiveIndex(idx);
        }}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { width: CARD_WIDTH, opacity: pressed ? 0.95 : 1 },
            ]}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.overlay}>
              <View style={styles.topRow}>
                <View style={[styles.liveTag, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.liveTagText, { fontFamily: "Inter_700Bold" }]}>FEATURED</Text>
                </View>
                <View
                  style={[
                    styles.availPill,
                    { backgroundColor: item.available ? colors.available : colors.busy },
                  ]}
                >
                  <Text style={styles.availText}>{item.available ? "Available" : "Busy"}</Text>
                </View>
              </View>
              <View style={styles.bottomInfo}>
                <Text style={[styles.name, { fontFamily: "Inter_700Bold" }]}>{item.name}</Text>
                <Text style={[styles.location, { fontFamily: "Inter_400Regular" }]}>
                  <Feather name="map-pin" size={11} color="#ddd" /> {item.location} · {item.age}y
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.ratingRow}>
                    <Feather name="star" size={13} color={colors.secondary} />
                    <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_600SemiBold" }]}>
                      {item.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={[styles.price, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
                    KES {item.price.toLocaleString()}/hr
                  </Text>
                  <Pressable
                    style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleBook(item)}
                  >
                    <Text style={[styles.bookText, { fontFamily: "Inter_700Bold" }]}>Book</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
      <View style={styles.dots}>
        {profiles.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? colors.primary : colors.border,
                width: i === activeIndex ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  card: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "transparent",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagText: { color: "#fff", fontSize: 10, letterSpacing: 1 },
  availPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  availText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  bottomInfo: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    padding: 12,
  },
  name: { color: "#fff", fontSize: 20, marginBottom: 2 },
  location: { color: "#ddd", fontSize: 12, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13 },
  price: { fontSize: 13, flex: 1 },
  bookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookText: { color: "#fff", fontSize: 13 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 12 },
  dot: { height: 6, borderRadius: 3 },
});
