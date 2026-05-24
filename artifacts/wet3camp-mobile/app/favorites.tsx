import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileCard } from "@/components/ProfileCard";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const INITIAL_FAVORITES = [PROFILES[0], PROFILES[3], PROFILES[6]];

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES);

  const remove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFavorites((prev) => prev.filter((p) => p.id !== id));
  };

  const pairs: Array<[typeof PROFILES[0], typeof PROFILES[0] | null]> = [];
  for (let i = 0; i < favorites.length; i += 2) {
    pairs.push([favorites[i], favorites[i + 1] ?? null]);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          My Favorites
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={pairs}
        keyExtractor={(_, i) => `fav-row-${i}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="heart" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              No favorites yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Tap the heart icon on any profile to save it here
            </Text>
          </View>
        }
        renderItem={({ item: [a, b] }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ProfileCard profile={a} variant="grid" />
            </View>
            {b ? (
              <View style={{ flex: 1 }}>
                <ProfileCard profile={b} variant="grid" />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  title: { fontSize: 18 },
  listContent: { padding: 16, gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
