import { Feather } from "@expo/vector-icons";
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
import { LiveCard } from "@/components/LiveCard";
import { LIVE_STREAMS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const FILTERS = ["All", "Elite", "VIP", "Most Viewed"];

export default function LiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");

  const filtered = LIVE_STREAMS.filter((s) => {
    if (filter === "Elite") return s.category === "Elite";
    if (filter === "VIP") return s.category === "VIP";
    if (filter === "Most Viewed") return s.viewers > 1000;
    return true;
  });

  const totalViewers = filtered.reduce((sum, s) => sum + s.viewers, 0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length || true}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { paddingTop: topPad + 10 }]}>
              <View style={styles.titleRow}>
                <View style={styles.liveIndicator}>
                  <View style={[styles.livePulse, { backgroundColor: colors.live }]} />
                  <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    Live Now
                  </Text>
                </View>
                <View style={[styles.viewersPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="eye" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.viewersTotal, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {totalViewers.toLocaleString()} watching
                  </Text>
                </View>
              </View>

              <View style={styles.filters}>
                {FILTERS.map((f) => (
                  <Pressable
                    key={f}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filter === f ? colors.live : colors.card,
                        borderColor: filter === f ? colors.live : colors.border,
                      },
                    ]}
                    onPress={() => setFilter(f)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: filter === f ? "#fff" : colors.mutedForeground,
                          fontFamily: "Inter_500Medium",
                        },
                      ]}
                    >
                      {f}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.streamItem}>
            <LiveCard stream={item} />
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="video-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No streams right now
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  livePulse: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 24 },
  viewersPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewersTotal: { fontSize: 12 },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13 },
  streamItem: { paddingHorizontal: 16, marginBottom: 12 },
  listContent: {},
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
