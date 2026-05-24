import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const STATS = [
  { label: "Total Escorts", value: "248", icon: "users" as const, color: "#8B0000" },
  { label: "Active Today", value: "89", icon: "activity" as const, color: "#28a745" },
  { label: "Bookings Today", value: "34", icon: "calendar" as const, color: "#2196F3" },
  { label: "Revenue (KES)", value: "182K", icon: "trending-up" as const, color: "#FFD700" },
];

const TABS = ["Profiles", "Reports", "Settings"];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("Profiles");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Admin Panel</Text>
        <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.adminBadgeText, { fontFamily: "Inter_700Bold" }]}>MOD</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}>
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "22" }]}>
                <Feather name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, { borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: colors.primary }]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground, fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "Profiles" && (
          <View style={styles.profileList}>
            {PROFILES.map((p) => (
              <View key={p.id} style={[styles.profileRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.profileName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{p.name}</Text>
                  <Text style={[styles.profileMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{p.location} · {p.badge.toUpperCase()}</Text>
                </View>
                <View style={styles.profileActions}>
                  <View style={[styles.statusDot, { backgroundColor: p.available ? colors.available : colors.busy }]} />
                  <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                    <Feather name="edit-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                  <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "Reports" && (
          <View style={styles.emptyTab}>
            <Feather name="flag" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No pending reports</Text>
          </View>
        )}

        {activeTab === "Settings" && (
          <View style={styles.profileList}>
            {["Allow New Registrations", "Require ID Verification", "Enable Live Streams", "Maintenance Mode"].map((setting) => (
              <View key={setting} style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.settingText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{setting}</Text>
                <View style={[styles.toggle, { backgroundColor: colors.primary }]}>
                  <View style={styles.toggleThumb} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  title: { fontSize: 18 },
  adminBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  adminBadgeText: { color: "#fff", fontSize: 11 },
  scrollContent: { padding: 16, gap: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { flex: 1, minWidth: "45%", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "flex-start", gap: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 12 },
  tabsRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14 },
  profileList: { gap: 8 },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 12 },
  profileName: { fontSize: 14 },
  profileMeta: { fontSize: 11, marginTop: 2 },
  profileActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyTab: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 15 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 14 },
  settingText: { fontSize: 14, flex: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, alignItems: "flex-end" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
});
