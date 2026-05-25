import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PRODUCTS = [
  { id: "1", name: "Luxury Collection Set", price: 8500, category: "Premium", image: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=300&h=400&fit=crop", rating: 4.8 },
  { id: "2", name: "Beginners Bundle", price: 3200, category: "Starter", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=400&fit=crop", rating: 4.6 },
  { id: "3", name: "Professional Grade", price: 12000, category: "Premium", image: "https://images.unsplash.com/photo-1551431009-381d36ac3a4b?w=300&h=400&fit=crop", rating: 4.9 },
  { id: "4", name: "Discreet Travel Kit", price: 4500, category: "Travel", image: "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=400&fit=crop", rating: 4.7 },
  { id: "5", name: "Couples Bundle", price: 15000, category: "Premium", image: "https://images.unsplash.com/photo-1576091160550-112173faf00e?w=300&h=400&fit=crop", rating: 4.8 },
  { id: "6", name: "Solo Pleasure Pro", price: 6800, category: "Popular", image: "https://images.unsplash.com/photo-1549887534-f2cb8a4e6d1a?w=300&h=400&fit=crop", rating: 4.9 },
];

const TAGS = ["All", "Premium", "Starter", "Popular", "Travel"];

const CATEGORY_COLORS: Record<string, string> = {
  Premium: "#8B0000",
  Starter: "#28a745",
  Popular: "#FF9800",
  Travel: "#2196F3",
};

export default function ShopScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTag, setActiveTag] = useState("All");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = activeTag === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeTag);

  const pairs: Array<[typeof PRODUCTS[0], typeof PRODUCTS[0] | null]> = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push([filtered[i], filtered[i + 1] ?? null]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Premium Shop
        </Text>
        <Pressable style={styles.cartBtn}>
          <Feather name="shopping-cart" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tagsBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tags}
      >
        {TAGS.map((tag) => (
          <Pressable
            key={tag}
            style={[
              styles.tagChip,
              { backgroundColor: activeTag === tag ? colors.primary : colors.card, borderColor: activeTag === tag ? colors.primary : colors.border },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTag(tag);
            }}
          >
            <Text style={[styles.tagText, { color: activeTag === tag ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {tag}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={pairs}
        keyExtractor={(_, i) => `shop-row-${i}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        renderItem={({ item: [a, b] }) => (
          <View style={styles.row}>
            {[a, b].map((product, idx) =>
              product ? (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    styles.productCard,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[product.category] ?? colors.primary }]}>
                    <Text style={[styles.catText, { fontFamily: "Inter_700Bold" }]}>{product.category}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <View style={styles.productMeta}>
                      <View style={styles.ratingRow}>
                        <Feather name="star" size={11} color={colors.secondary} />
                        <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_500Medium" }]}>
                          {product.rating}
                        </Text>
                      </View>
                      <Text style={[styles.productPrice, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
                        KES {product.price.toLocaleString()}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.addBtn, { backgroundColor: colors.primary }]}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    >
                      <Feather name="shopping-cart" size={13} color="#fff" />
                      <Text style={[styles.addText, { fontFamily: "Inter_600SemiBold" }]}>Add</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ) : (
                <View key={`empty-${idx}`} style={{ flex: 1 }} />
              )
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  cartBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "flex-end" },
  title: { fontSize: 18 },
  tagsBar: { borderBottomWidth: StyleSheet.hairlineWidth, maxHeight: 52 },
  tags: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 13 },
  grid: { padding: 12, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  productCard: { flex: 1, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  productImage: { width: "100%", aspectRatio: 3 / 4 },
  catBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  catText: { color: "#fff", fontSize: 9 },
  productInfo: { padding: 8, gap: 6 },
  productName: { fontSize: 12 },
  productMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 11 },
  productPrice: { fontSize: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 7, borderRadius: 8, gap: 5 },
  addText: { color: "#fff", fontSize: 12 },
});
