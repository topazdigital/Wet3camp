import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CONVERSATIONS } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const BADGE_COLORS: Record<string, string> = {
  elite: "#8B0000",
  vip: "#FF4500",
  premium: "#FFD700",
  free: "#6c757d",
};

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPad + 10 }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Messages
              </Text>
              <Pressable
                style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Feather name="edit" size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {CONVERSATIONS.filter((c) => c.unread > 0).length} unread conversations
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.convoItem,
              {
                backgroundColor: pressed ? colors.muted : colors.background,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: item.image }} style={styles.avatar} />
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: BADGE_COLORS[item.badge] ?? "#6c757d" },
                ]}
              />
            </View>
            <View style={styles.convoInfo}>
              <View style={styles.convoTop}>
                <Text
                  style={[
                    styles.convoName,
                    {
                      color: colors.foreground,
                      fontFamily: item.unread > 0 ? "Inter_700Bold" : "Inter_500Medium",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.convoTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {item.time}
                </Text>
              </View>
              <View style={styles.convoBottom}>
                <Text
                  style={[
                    styles.convoMsg,
                    {
                      color: item.unread > 0 ? colors.foreground : colors.mutedForeground,
                      fontFamily: item.unread > 0 ? "Inter_500Medium" : "Inter_400Regular",
                      flex: 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMsg}
                </Text>
                {item.unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.unreadText, { fontFamily: "Inter_700Bold" }]}>
                      {item.unread}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No messages yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
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
  listContent: {},
  convoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  badgeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#0a0a0a",
  },
  convoInfo: { flex: 1, gap: 3 },
  convoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoName: { fontSize: 15, flex: 1 },
  convoTime: { fontSize: 12 },
  convoBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  convoMsg: { fontSize: 13 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: "#fff", fontSize: 11 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
