import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { ProfileCard } from "@/components/ProfileCard";
import { FEATURED_PROFILES, PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["All", "Elite", "VIP", "Premium", "Available", "Nairobi", "Mombasa"];

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = PROFILES.filter((p) => {
    const matchSearch =
      search.length === 0 ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === "All" ||
      (activeCategory === "Elite" && p.badge === "elite") ||
      (activeCategory === "VIP" && p.badge === "vip") ||
      (activeCategory === "Premium" && p.badge === "premium") ||
      (activeCategory === "Available" && p.available) ||
      (activeCategory === "Nairobi" && p.location.toLowerCase().includes("nairobi")) ||
      (activeCategory === "Mombasa" && p.location.toLowerCase().includes("mombasa"));
    return matchSearch && matchCat;
  });

  const gridPairs: Array<[typeof PROFILES[0], typeof PROFILES[0] | null]> = [];
  for (let i = 0; i < filtered.length; i += 2) {
    gridPairs.push([filtered[i], filtered[i + 1] ?? null]);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const ListHeader = (
    <View>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Wet3 <Text style={{ color: colors.primary }}>Camp</Text>
          </Text>
          <View style={styles.headerActions}>
            <Pressable style={[styles.iconBtn, { borderColor: colors.border }]}>
              <Feather name="bell" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable style={[styles.iconBtn, { borderColor: colors.border }]}>
              <Feather name="sliders" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            placeholder="Search escorts, locations..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.catChip,
                {
                  backgroundColor:
                    activeCategory === cat ? colors.primary : colors.card,
                  borderColor:
                    activeCategory === cat ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.catText,
                  {
                    color:
                      activeCategory === cat ? "#fff" : colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Featured
        </Text>
        <FeaturedCarousel profiles={FEATURED_PROFILES} />
      </View>

      <View style={styles.gridHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Browse ({filtered.length})
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={gridPairs}
        keyExtractor={(_, i) => `row-${i}`}
        ListHeaderComponent={ListHeader}
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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length || true}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No results found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 26 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  categories: { gap: 8, paddingBottom: 4 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: { fontSize: 13 },
  section: { paddingTop: 16 },
  sectionTitle: { fontSize: 18, paddingHorizontal: 16, marginBottom: 12 },
  gridHeader: { paddingTop: 8 },
  row: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  listContent: { paddingTop: 0 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
