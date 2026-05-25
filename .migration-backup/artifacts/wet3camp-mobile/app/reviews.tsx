import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const REVIEWS = [
  { id: "rv1", client: "John K.", escort: "Amara K.", rating: 5, text: "Excellent service! Professional and friendly. Highly recommended.", date: "2 weeks ago" },
  { id: "rv2", client: "Mike O.", escort: "Zara M.", rating: 5, text: "Amazing experience. Will definitely book again!", date: "1 month ago" },
  { id: "rv3", client: "Alex N.", escort: "Fatuma H.", rating: 4, text: "Great service. Worth every shilling. Very discreet.", date: "1 month ago" },
  { id: "rv4", client: "David M.", escort: "Nadia T.", rating: 5, text: "Absolutely stunning and very professional. 10/10 would recommend.", date: "2 months ago" },
  { id: "rv5", client: "Sam P.", escort: "Priya S.", rating: 5, text: "Top tier escort. Made the evening truly memorable.", date: "2 months ago" },
  { id: "rv6", client: "Brian W.", escort: "Mercy R.", rating: 4, text: "Very elegant and well spoken. Great companion for dinner.", date: "3 months ago" },
];

export default function ReviewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Reviews</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={REVIEWS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        ListHeaderComponent={
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.avgRating, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{avgRating}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather key={s} name="star" size={18} color={parseFloat(avgRating) >= s ? colors.secondary : colors.border} />
              ))}
            </View>
            <Text style={[styles.totalText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Based on {REVIEWS.length} verified reviews
            </Text>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.clientName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {item.client} reviewed {item.escort}
                </Text>
                <Text style={[styles.date, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.date}</Text>
              </View>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Feather key={s} name="star" size={13} color={item.rating >= s ? colors.secondary : colors.border} />
                ))}
              </View>
            </View>
            <Text style={[styles.reviewText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{item.text}</Text>
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
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8, marginBottom: 4 },
  avgRating: { fontSize: 48 },
  stars: { flexDirection: "row", gap: 4 },
  totalText: { fontSize: 13 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  clientName: { fontSize: 14 },
  date: { fontSize: 11, marginTop: 2 },
  ratingRow: { flexDirection: "row", gap: 2 },
  reviewText: { fontSize: 13, lineHeight: 20 },
});
