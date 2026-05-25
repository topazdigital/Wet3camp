import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  { icon: "download" as const, title: "Download Expo Go", desc: "Get the Expo Go app from the App Store (iOS) or Google Play (Android)." },
  { icon: "camera" as const, title: "Scan the QR Code", desc: "Open Expo Go and scan the QR code from the Wet3 Camp website or admin panel." },
  { icon: "smartphone" as const, title: "Launch the App", desc: "The app will load automatically. Tap 'Bookmark' or 'Add to Home Screen' for quick access." },
];

const FEATURES = [
  { icon: "zap" as const, text: "Instant bookings, no waiting" },
  { icon: "lock" as const, text: "End-to-end encrypted messages" },
  { icon: "bell" as const, text: "Push notifications for new matches" },
  { icon: "star" as const, text: "Exclusive mobile-only deals" },
];

export default function InstallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Install App</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Feather name="smartphone" size={40} color={colors.secondary} />
          <Text style={[styles.heroTitle, { fontFamily: "Inter_700Bold" }]}>Wet3 Camp Mobile</Text>
          <Text style={[styles.heroSub, { fontFamily: "Inter_400Regular" }]}>
            Take the premium experience everywhere you go
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          HOW TO INSTALL
        </Text>
        {STEPS.map((step, i) => (
          <View key={step.title} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNum, { fontFamily: "Inter_700Bold" }]}>{i + 1}</Text>
            </View>
            <View style={[styles.stepIcon, { backgroundColor: colors.background }]}>
              <Feather name={step.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{step.title}</Text>
              <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          WHY GO MOBILE
        </Text>
        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View key={f.text} style={[styles.featureRow, { borderBottomWidth: i < FEATURES.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.background }]}>
                <Feather name={f.icon} size={16} color={colors.secondary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  title: { fontSize: 18 },
  scrollContent: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 16, padding: 24, alignItems: "center", gap: 10 },
  heroTitle: { color: "#fff", fontSize: 22 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, textAlign: "center" },
  sectionTitle: { fontSize: 11, letterSpacing: 1 },
  stepCard: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 12 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  stepNum: { color: "#fff", fontSize: 12 },
  stepIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  stepInfo: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 14 },
  stepDesc: { fontSize: 12, lineHeight: 18 },
  featuresCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  featureRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  featureIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  featureText: { fontSize: 14, flex: 1 },
});
