import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export type BadgeType = "elite" | "vip" | "premium" | "free";

export interface Profile {
  id: string;
  name: string;
  location: string;
  age: number;
  rating: number;
  price: number;
  image: string;
  badge: BadgeType;
  available: boolean;
  viewers?: number;
}

interface ProfileCardProps {
  profile: Profile;
  onPress?: () => void;
  variant?: "grid" | "list";
}

const BADGE_LABELS: Record<BadgeType, string> = {
  elite: "ELITE",
  vip: "VIP",
  premium: "PREMIUM",
  free: "FREE",
};

export function ProfileCard({ profile, onPress, variant = "grid" }: ProfileCardProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(false);

  const badgeColor: Record<BadgeType, string> = {
    elite: colors.elite,
    vip: colors.vip,
    premium: colors.premium,
    free: "#6c757d",
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((v) => !v);
  };

  if (variant === "list") {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.listCard,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={onPress}
      >
        <Image source={{ uri: profile.image }} style={styles.listImage} />
        <View style={styles.listInfo}>
          <View style={styles.listHeader}>
            <Text style={[styles.listName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {profile.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: badgeColor[profile.badge] }]}>
              <Text style={styles.badgeText}>{BADGE_LABELS[profile.badge]}</Text>
            </View>
          </View>
          <Text style={[styles.listLocation, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} /> {profile.location}
          </Text>
          <View style={styles.listMeta}>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color={colors.secondary} />
              <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_500Medium" }]}>
                {profile.rating.toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.price, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
              KES {profile.price.toLocaleString()}/hr
            </Text>
          </View>
        </View>
        <View style={styles.listActions}>
          <View
            style={[
              styles.availDot,
              { backgroundColor: profile.available ? colors.available : colors.busy },
            ]}
          />
          <Pressable onPress={handleLike} hitSlop={8}>
            <Feather
              name="heart"
              size={20}
              color={liked ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.gridCard,
        { backgroundColor: colors.card, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: profile.image }} style={styles.gridImage} />
        <View style={[styles.badge, styles.badgeAbsolute, { backgroundColor: badgeColor[profile.badge] }]}>
          <Text style={styles.badgeText}>{BADGE_LABELS[profile.badge]}</Text>
        </View>
        <View
          style={[
            styles.availDotAbsolute,
            { backgroundColor: profile.available ? colors.available : colors.busy },
          ]}
        />
        <Pressable style={styles.likeBtn} onPress={handleLike} hitSlop={8}>
          <Feather name="heart" size={16} color={liked ? colors.primary : "#fff"} />
        </Pressable>
      </View>
      <View style={styles.gridInfo}>
        <Text style={[styles.gridName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
          {profile.name}
        </Text>
        <Text style={[styles.gridLocation, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
          {profile.location} · {profile.age}y
        </Text>
        <View style={styles.gridMeta}>
          <View style={styles.ratingRow}>
            <Feather name="star" size={11} color={colors.secondary} />
            <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_500Medium" }]}>
              {profile.rating.toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.gridPrice, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
            KES {(profile.price / 1000).toFixed(0)}k
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageContainer: { position: "relative" },
  gridImage: { width: "100%", aspectRatio: 3 / 4 },
  badgeAbsolute: { position: "absolute", top: 8, left: 8 },
  availDotAbsolute: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#000",
  },
  likeBtn: { position: "absolute", bottom: 8, right: 8 },
  gridInfo: { padding: 8 },
  gridName: { fontSize: 13, marginBottom: 2 },
  gridLocation: { fontSize: 11, marginBottom: 4 },
  gridMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gridPrice: { fontSize: 12 },

  listCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 10,
  },
  listImage: { width: 90, height: 110 },
  listInfo: { flex: 1, padding: 10, justifyContent: "space-between" },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  listName: { fontSize: 14, flex: 1 },
  listLocation: { fontSize: 11, marginTop: 2 },
  listMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  listActions: { padding: 10, justifyContent: "space-between", alignItems: "center" },
  availDot: { width: 8, height: 8, borderRadius: 4 },

  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 11 },
  price: { fontSize: 12 },
});
