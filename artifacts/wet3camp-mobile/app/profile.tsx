import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROFILES } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";

const PROFILE = PROFILES[0];

const SERVICES = ["Dinner Dates", "Overnight", "Travel Companion", "Video Calls", "Massage", "Events"];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const BADGE_COLORS = { elite: colors.elite, vip: colors.vip, premium: colors.premium, free: "#6c757d" };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLiked((v) => !v); }}
        >
          <Feather name="heart" size={20} color={liked ? colors.primary : "#fff"} />
        </Pressable>
      </View>

      <Image source={{ uri: PROFILE.image }} style={styles.heroImage} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 80 }]}
      >
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{PROFILE.name}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={13} color={colors.mutedForeground} />
              <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {PROFILE.location} · {PROFILE.age} years old
              </Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: BADGE_COLORS[PROFILE.badge] }]}>
            <Text style={[styles.badgeText, { fontFamily: "Inter_700Bold" }]}>{PROFILE.badge.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.metaCards}>
          {[
            { label: "Rating", value: PROFILE.rating.toFixed(1), icon: "star" as const, color: colors.secondary },
            { label: "Status", value: PROFILE.available ? "Available" : "Busy", icon: "circle" as const, color: PROFILE.available ? colors.available : colors.busy },
            { label: "Rate", value: `KES ${(PROFILE.price / 1000).toFixed(0)}k/hr`, icon: "dollar-sign" as const, color: colors.secondary },
          ].map((m) => (
            <View key={m.label} style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={m.icon} size={18} color={m.color} />
              <Text style={[styles.metaValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{m.value}</Text>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>About</Text>
          <Text style={[styles.about, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Premium elite companion available for discreet, high-quality encounters. Sophisticated, educated, and well-traveled. Specializes in making clients feel valued and at ease.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Services</Text>
          <View style={styles.services}>
            {SERVICES.map((s) => (
              <View key={s} style={[styles.serviceChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.serviceText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 16 : insets.bottom + 10 }]}>
        <Pressable style={[styles.msgBtn, { borderColor: colors.border }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Feather name="message-circle" size={20} color={colors.foreground} />
          <Text style={[styles.msgText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Message</Text>
        </Pressable>
        <Pressable style={[styles.bookBtn, { backgroundColor: colors.primary }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
          <Text style={[styles.bookText, { fontFamily: "Inter_700Bold" }]}>Book Now — KES {PROFILE.price.toLocaleString()}/hr</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, zIndex: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  heroImage: { width: "100%", height: 320 },
  scrollContent: { padding: 16, gap: 14 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  name: { fontSize: 24 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  location: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 4 },
  badgeText: { color: "#fff", fontSize: 11 },
  metaCards: { flexDirection: "row", gap: 10 },
  metaCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  metaValue: { fontSize: 15 },
  metaLabel: { fontSize: 11 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 16 },
  about: { fontSize: 14, lineHeight: 22 },
  services: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  serviceText: { fontSize: 13 },
  bottomBar: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  msgBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  msgText: { fontSize: 14 },
  bookBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12 },
  bookText: { color: "#fff", fontSize: 14 },
});
