import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileCard } from "@/components/ProfileCard";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const EXCLUSIVE = PROFILES.filter((p) => p.badge === "elite");

export default function ExclusiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pairs: Array<[typeof PROFILES[0], typeof PROFILES[0] | null]> = [];
  for (let i = 0; i < EXCLUSIVE.length; i += 2) {
    pairs.push([EXCLUSIVE[i], EXCLUSIVE[i + 1] ?? null]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Exclusive
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.banner, { backgroundColor: colors.primary }]}>
        <Feather name="star" size={16} color={colors.secondary} />
        <Text style={[styles.bannerText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
          Top-tier elite providers — verified & premium only
        </Text>
      </View>

      <FlatList
        data={pairs}
        keyExtractor={(_, i) => `excl-row-${i}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        renderItem={({ item: [a, b] }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}><ProfileCard profile={a} variant="grid" /></View>
            {b ? <View style={{ flex: 1 }}><ProfileCard profile={b} variant="grid" /></View> : <View style={{ flex: 1 }} />}
          </View>
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
  banner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  bannerText: { fontSize: 13, flex: 1 },
  grid: { padding: 12, gap: 10 },
  row: { flexDirection: "row", gap: 10 },
});
