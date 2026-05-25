import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const ADVERTS = PROFILES.map((p, i) => ({
  id: `ad${i}`,
  name: p.name,
  image: p.image,
  headline: [`Available Tonight Only`, `Special Weekend Rates`, `New In Nairobi`, `VIP Experience Awaits`, `Exclusive Bookings Open`, `Limited Slots — Book Now`][i % 6],
  location: p.location,
  price: p.price,
  badge: p.badge,
  expiresIn: `${i * 2 + 1}h left`,
}));

const BADGE_COLORS: Record<string, string> = { elite: "#8B0000", vip: "#FF4500", premium: "#FFD700", free: "#6c757d" };

export default function AdvertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Adverts</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={ADVERTS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Image source={{ uri: item.image }} style={styles.avatar} />
            <View style={styles.info}>
              <View style={styles.topRow}>
                <View style={[styles.badge, { backgroundColor: BADGE_COLORS[item.badge] ?? colors.primary }]}>
                  <Text style={[styles.badgeText, { fontFamily: "Inter_700Bold" }]}>{item.badge.toUpperCase()}</Text>
                </View>
                <View style={[styles.timerBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="clock" size={10} color={colors.mutedForeground} />
                  <Text style={[styles.timerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.expiresIn}</Text>
                </View>
              </View>
              <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{item.name}</Text>
              <Text style={[styles.headline, { color: colors.secondary, fontFamily: "Inter_500Medium" }]}>{item.headline}</Text>
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.location}</Text>
                <Text style={[styles.price, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>KES {item.price.toLocaleString()}/hr</Text>
              </View>
            </View>
            <Pressable
              style={[styles.contactBtn, { backgroundColor: colors.primary }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Feather name="message-circle" size={16} color="#fff" />
            </Pressable>
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
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 12, gap: 12, alignItems: "center" },
  avatar: { width: 80, height: 90, borderRadius: 10 },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 9 },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  timerText: { fontSize: 10 },
  name: { fontSize: 14 },
  headline: { fontSize: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  location: { fontSize: 11, flex: 1 },
  price: { fontSize: 12 },
  contactBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
});
