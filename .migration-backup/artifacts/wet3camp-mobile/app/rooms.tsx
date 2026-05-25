import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ROOMS = [
  { id: "r1", name: "The Red Suite", location: "Westlands, Nairobi", price: 12000, per: "night", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80", rating: 4.9, available: true, amenities: ["AC", "WiFi", "Bar", "Jacuzzi"] },
  { id: "r2", name: "Executive Penthouse", location: "Upperhill, Nairobi", price: 25000, per: "night", image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&q=80", rating: 4.8, available: true, amenities: ["AC", "WiFi", "Kitchen", "View"] },
  { id: "r3", name: "Cozy Studio", location: "Kilimani, Nairobi", price: 6500, per: "night", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&q=80", rating: 4.6, available: false, amenities: ["AC", "WiFi", "Parking"] },
  { id: "r4", name: "Beachfront Villa", location: "Nyali, Mombasa", price: 35000, per: "night", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80", rating: 5.0, available: true, amenities: ["AC", "Pool", "Bar", "Beach"] },
];

export default function RoomsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Rooms</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={ROOMS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View
              style={[styles.availBadge, { backgroundColor: item.available ? colors.available : colors.busy }]}
            >
              <Text style={[styles.availText, { fontFamily: "Inter_600SemiBold" }]}>
                {item.available ? "Available" : "Booked"}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.roomName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{item.name}</Text>
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.locationText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.location}</Text>
              </View>
              <View style={styles.amenities}>
                {item.amenities.map((a) => (
                  <View key={a} style={[styles.amenityChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.amenityText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{a}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.footer}>
                <View>
                  <Text style={[styles.price, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>KES {item.price.toLocaleString()}</Text>
                  <Text style={[styles.per, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>per {item.per}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={13} color={colors.secondary} />
                  <Text style={[styles.rating, { color: colors.secondary, fontFamily: "Inter_600SemiBold" }]}>{item.rating}</Text>
                </View>
                <Pressable
                  style={[styles.bookBtn, { backgroundColor: item.available ? colors.primary : colors.muted }]}
                  onPress={() => item.available && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  <Text style={[styles.bookText, { fontFamily: "Inter_700Bold", color: item.available ? "#fff" : colors.mutedForeground }]}>
                    {item.available ? "Book" : "Unavail."}
                  </Text>
                </Pressable>
              </View>
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
  list: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  image: { width: "100%", height: 180 },
  availBadge: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  availText: { color: "#fff", fontSize: 11 },
  cardBody: { padding: 12, gap: 8 },
  roomName: { fontSize: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  amenityText: { fontSize: 11 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  price: { fontSize: 15 },
  per: { fontSize: 11 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 13 },
  bookBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  bookText: { fontSize: 13 },
});
