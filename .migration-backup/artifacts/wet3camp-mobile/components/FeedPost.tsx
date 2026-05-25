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

export interface Post {
  id: string;
  author: string;
  authorImage: string;
  location: string;
  time: string;
  text: string;
  image?: string;
  likes: number;
  comments: number;
  badge: "elite" | "vip" | "premium" | "free";
}

interface FeedPostProps {
  post: Post;
}

export function FeedPost({ post }: FeedPostProps) {
  const colors = useColors();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const badgeColor: Record<string, string> = {
    elite: colors.elite,
    vip: colors.vip,
    premium: colors.premium,
    free: "#6c757d",
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((v) => {
      setLikeCount((c) => (v ? c - 1 : c + 1));
      return !v;
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: post.authorImage }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.author, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {post.author}
            </Text>
            <View style={[styles.badge, { backgroundColor: badgeColor[post.badge] }]}>
              <Text style={styles.badgeText}>{post.badge.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} /> {post.location} · {post.time}
          </Text>
        </View>
        <Pressable hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {post.text ? (
        <Text style={[styles.body, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
          {post.text}
        </Text>
      ) : null}

      {post.image ? (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={handleLike}>
          <Feather name="heart" size={20} color={liked ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            {likeCount}
          </Text>
        </Pressable>
        <Pressable style={styles.action}>
          <Feather name="message-circle" size={20} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            {post.comments}
          </Text>
        </Pressable>
        <Pressable style={styles.action}>
          <Feather name="share-2" size={20} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={[styles.bookBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.bookText, { fontFamily: "Inter_700Bold" }]}>Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  author: { fontSize: 14 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  meta: { fontSize: 11, marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, paddingHorizontal: 12, paddingBottom: 10 },
  postImage: { width: "100%", height: 220 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 16,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13 },
  bookBtn: {
    marginLeft: "auto",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookText: { color: "#fff", fontSize: 13 },
});
