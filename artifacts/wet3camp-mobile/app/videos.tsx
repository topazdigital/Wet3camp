import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const VIDEOS = PROFILES.slice(0, 8).map((p, i) => ({
  id: `v${i}`,
  title: `${p.name} — Private Session`,
  thumbnail: p.image,
  duration: `${4 + i}:${(12 + i * 7) % 60}`.padEnd(5, "0"),
  views: Math.floor(Math.random() * 50000) + 1000,
  author: p.name,
  badge: p.badge,
  price: p.badge === "elite" || p.badge === "vip" ? `KES ${p.price / 100}/min` : "Free",
}));

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Videos</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={VIDEOS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <View style={styles.thumbnailWrap}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
              <View style={styles.playOverlay}>
                <View style={[styles.playBtn, { backgroundColor: "rgba(139,0,0,0.85)" }]}>
                  <Feather name="play" size={18} color="#fff" />
                </View>
              </View>
              <View style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
                <Text style={[styles.durationText, { fontFamily: "Inter_500Medium" }]}>{item.duration}</Text>
              </View>
            </View>
            <View style={styles.videoInfo}>
              <Text style={[styles.videoTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.videoMeta}>
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {item.views.toLocaleString()} views
                </Text>
                <Text style={[styles.priceLabel, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
                  {item.price}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  title: { fontSize: 18 },
  list: { padding: 16, gap: 12 },
  videoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  thumbnailWrap: { position: "relative" },
  thumbnail: { width: "100%", height: 180 },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  playBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  durationBadge: { position: "absolute", bottom: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  durationText: { color: "#fff", fontSize: 11 },
  videoInfo: { padding: 12, gap: 6 },
  videoTitle: { fontSize: 14 },
  videoMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 12 },
  priceLabel: { fontSize: 12 },
});
