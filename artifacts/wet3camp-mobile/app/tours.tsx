import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const TOURS = PROFILES.slice(0, 6).map((p, i) => ({
  id: `t${i}`,
  escort: p.name,
  image: p.image,
  destination: ["Nairobi City", "Maasai Mara", "Diani Beach", "Amboseli", "Lamu Island", "Nakuru"][i],
  duration: ["2 days", "3 days", "4 days", "2 days", "5 days", "3 days"][i],
  price: p.price * 2,
  rating: p.rating,
  badge: p.badge,
}));

export default function ToursScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Tours</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={TOURS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.cardBody}>
              <Text style={[styles.destination, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{item.destination}</Text>
              <Text style={[styles.escort, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                with {item.escort} · {item.duration}
              </Text>
              <View style={styles.footer}>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={12} color={colors.secondary} />
                  <Text style={[styles.rating, { color: colors.secondary, fontFamily: "Inter_600SemiBold" }]}>{item.rating}</Text>
                </View>
                <Text style={[styles.price, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
                  KES {item.price.toLocaleString()}
                </Text>
                <Pressable
                  style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  <Text style={[styles.bookText, { fontFamily: "Inter_700Bold" }]}>Book</Text>
                </Pressable>
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
  list: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  image: { width: 110, height: 120 },
  cardBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  destination: { fontSize: 15 },
  escort: { fontSize: 12, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 12 },
  price: { fontSize: 13, flex: 1 },
  bookBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  bookText: { color: "#fff", fontSize: 12 },
});
