import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TESTIMONIALS = [
  { id: "t1", name: "James M.", role: "Regular Client", text: "Wet3 Camp completely changed how I find quality companionship. The platform is discreet and the profiles are genuinely verified.", rating: 5 },
  { id: "t2", name: "Peter K.", role: "VIP Member", text: "I've tried other platforms but none match the quality here. The elite escorts are truly top-tier professionals.", rating: 5 },
  { id: "t3", name: "Samuel O.", role: "Verified Client", text: "The booking process is seamless and the ladies are exactly as advertised. No surprises — just excellence.", rating: 5 },
  { id: "t4", name: "Mark N.", role: "Premium Member", text: "Best platform in Nairobi. Fast bookings, real profiles, and outstanding service every time.", rating: 4 },
  { id: "t5", name: "Daniel W.", role: "Regular Client", text: "Discreet, professional, and reliable. The Wet3 Camp team really knows what clients want.", rating: 5 },
];

export default function TestimonialsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Testimonials</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={TESTIMONIALS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="message-square" size={20} color={colors.primary} style={styles.quoteIcon} />
            <Text style={[styles.text, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>"{item.text}"</Text>
            <View style={styles.footer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{item.name[0]}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.name}</Text>
                <Text style={[styles.authorRole, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.role}</Text>
              </View>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Feather key={s} name="star" size={12} color={item.rating >= s ? colors.secondary : colors.border} />
                ))}
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
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  quoteIcon: { marginBottom: -4 },
  text: { fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  footer: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 14 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 13 },
  authorRole: { fontSize: 11 },
  stars: { flexDirection: "row", gap: 2 },
});
