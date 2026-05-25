import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const BLACKLIST = [
  { id: "bl1", name: "Anonymous User #4821", reason: "Non-payment after service", date: "May 2026", reports: 3 },
  { id: "bl2", name: "Anonymous User #2293", reason: "Harassment and abusive behavior", date: "Apr 2026", reports: 7 },
  { id: "bl3", name: "Anonymous User #6610", reason: "Fake identity / impersonation", date: "Apr 2026", reports: 2 },
  { id: "bl4", name: "Anonymous User #3374", reason: "No-show on confirmed bookings", date: "Mar 2026", reports: 5 },
  { id: "bl5", name: "Anonymous User #9985", reason: "Scam attempts on escorts", date: "Mar 2026", reports: 8 },
];

export default function BlacklistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Blacklist</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.warningBanner, { backgroundColor: "#3a1a1a", borderColor: colors.destructive }]}>
        <Feather name="alert-triangle" size={16} color={colors.destructive} />
        <Text style={[styles.warningText, { color: "#ff8080", fontFamily: "Inter_500Medium" }]}>
          These users have been reported by verified escorts. Exercise caution.
        </Text>
      </View>

      <FlatList
        data={BLACKLIST}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#3a1a1a" }]}>
            <View style={[styles.iconWrap, { backgroundColor: "#3a1a1a" }]}>
              <Feather name="user-x" size={20} color={colors.destructive} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.name}</Text>
              <Text style={[styles.reason, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.reason}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.date, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.date}</Text>
                <View style={[styles.reportsBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={[styles.reportsText, { fontFamily: "Inter_700Bold" }]}>{item.reports} reports</Text>
                </View>
              </View>
            </View>
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
  warningBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, margin: 16, borderRadius: 10, borderWidth: 1 },
  warningText: { fontSize: 13, flex: 1, lineHeight: 18 },
  list: { paddingHorizontal: 16, gap: 10 },
  card: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 12, gap: 12, alignItems: "center" },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14 },
  reason: { fontSize: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  date: { fontSize: 11 },
  reportsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  reportsText: { color: "#fff", fontSize: 10 },
});
