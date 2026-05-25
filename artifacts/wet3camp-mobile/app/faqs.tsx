import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const FAQS = [
  { id: "f1", q: "How do I book an escort?", a: "Browse profiles, select a provider, and tap the Book button. You'll be connected via the Messages tab to confirm details and payment." },
  { id: "f2", q: "Are all profiles verified?", a: "Yes. All escorts on Wet3 Camp go through a manual identity verification process before their profiles go live." },
  { id: "f3", q: "How is payment handled?", a: "Payments are made directly to the escort via M-Pesa or card. The platform does not hold any funds." },
  { id: "f4", q: "Is my information private?", a: "Absolutely. All personal data is encrypted and we never share your details with third parties or other users." },
  { id: "f5", q: "What does the tier system mean?", a: "Elite > VIP > Premium > Free. Higher tiers indicate more verified reviews, higher demand, and premium service levels." },
  { id: "f6", q: "Can I cancel a booking?", a: "Cancellations depend on the escort's policy. Contact them at least 2 hours in advance to avoid a cancellation fee." },
  { id: "f7", q: "How do I report a bad experience?", a: "Use the Contact page or tap the flag icon on any profile. Verified reports may result in blacklisting." },
  { id: "f8", q: "Is this service legal in Kenya?", a: "We operate within the bounds of Kenyan law. We provide a platform for companionship services and do not facilitate illegal activities." },
];

export default function FAQsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>FAQs</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={FAQS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => toggle(item.id)}
          >
            <View style={styles.question}>
              <Text style={[styles.qText, { color: colors.foreground, fontFamily: "Inter_600SemiBold", flex: 1 }]}>{item.q}</Text>
              <Feather
                name={expanded === item.id ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.mutedForeground}
              />
            </View>
            {expanded === item.id && (
              <Text style={[styles.aText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.a}</Text>
            )}
          </Pressable>
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
  list: { padding: 16, gap: 8 },
  faqCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  question: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  qText: { fontSize: 14, lineHeight: 20 },
  aText: { fontSize: 13, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 14 },
});
