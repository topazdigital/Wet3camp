import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const EVENTS = [
  { id: "e1", title: "VIP Gala Night", date: "Sat Jun 7", time: "8:00 PM", location: "Westlands, Nairobi", price: "KES 5,000", category: "Exclusive", attending: 48 },
  { id: "e2", title: "Mombasa Beach Party", date: "Sun Jun 8", time: "4:00 PM", location: "Nyali, Mombasa", price: "KES 2,500", category: "Social", attending: 120 },
  { id: "e3", title: "Elite Private Mixer", date: "Fri Jun 13", time: "7:00 PM", location: "Karen, Nairobi", price: "KES 8,000", category: "Exclusive", attending: 24 },
  { id: "e4", title: "Rooftop Sundowner", date: "Sat Jun 14", time: "5:00 PM", location: "CBD, Nairobi", price: "KES 1,500", category: "Social", attending: 85 },
  { id: "e5", title: "Luxury Spa Day", date: "Sun Jun 15", time: "10:00 AM", location: "Lavington, Nairobi", price: "KES 4,000", category: "Wellness", attending: 16 },
];

const CAT_COLORS: Record<string, string> = { Exclusive: "#8B0000", Social: "#2196F3", Wellness: "#28a745" };

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Events</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={EVENTS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[item.category] ?? colors.primary }]}>
                <Text style={[styles.catText, { fontFamily: "Inter_700Bold" }]}>{item.category}</Text>
              </View>
              <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{item.title}</Text>
              <View style={styles.infoRow}>
                <Feather name="calendar" size={12} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.date} · {item.time}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="users" size={12} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.attending} attending</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.price, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{item.price}</Text>
              <Pressable
                style={[styles.joinBtn, { backgroundColor: colors.primary }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Text style={[styles.joinText, { fontFamily: "Inter_700Bold" }]}>RSVP</Text>
              </Pressable>
            </View>
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
  list: { padding: 16, gap: 12 },
  card: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  cardLeft: { flex: 1, gap: 6 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  catText: { color: "#fff", fontSize: 9 },
  eventTitle: { fontSize: 15 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 12 },
  cardRight: { alignItems: "flex-end", justifyContent: "space-between" },
  price: { fontSize: 13 },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  joinText: { color: "#fff", fontSize: 12 },
});
