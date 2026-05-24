import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedPost } from "@/components/FeedPost";
import { FEED_POSTS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

export default function FeedsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={FEED_POSTS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPad + 10 }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Feeds
              </Text>
              <Pressable style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="bell" size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Latest updates from escorts you follow
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <FeedPost post={item} />
          </View>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="rss" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No posts yet
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
    marginBottom: 4,
  },
  title: { fontSize: 24 },
  subtitle: { fontSize: 13 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postWrapper: { paddingHorizontal: 16 },
  listContent: {},
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
