import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface LiveStream {
  id: string;
  name: string;
  image: string;
  viewers: number;
  location: string;
  age: number;
  category: string;
  price: number;
}

interface LiveCardProps {
  stream: LiveStream;
  onPress?: () => void;
}

export function LiveCard({ stream, onPress }: LiveCardProps) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    >
      <Image source={{ uri: stream.image }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={styles.topRow}>
          <View style={[styles.liveBadge, { backgroundColor: colors.live }]}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, { fontFamily: "Inter_700Bold" }]}>LIVE</Text>
          </View>
          <View style={[styles.viewersBadge, { backgroundColor: "rgba(0,0,0,0.65)" }]}>
            <Feather name="eye" size={11} color="#fff" />
            <Text style={[styles.viewersText, { fontFamily: "Inter_500Medium" }]}>
              {stream.viewers.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.bottomInfo}>
          <Text style={[styles.name, { fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
            {stream.name}
          </Text>
          <Text style={[styles.meta, { fontFamily: "Inter_400Regular" }]}>
            {stream.location} · {stream.age}y · {stream.category}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    height: 200,
  },
  image: { width: "100%", height: "100%", position: "absolute" },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 12,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: { color: "#fff", fontSize: 11, letterSpacing: 1 },
  viewersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewersText: { color: "#fff", fontSize: 11 },
  bottomInfo: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 10,
  },
  name: { color: "#fff", fontSize: 15, marginBottom: 3 },
  meta: { color: "#ddd", fontSize: 11 },
});
