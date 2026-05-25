import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface TabConfig {
  name: string;
  label: string;
  icon: FeatherName;
  iconActive: FeatherName;
  isCenter?: boolean;
}

const TABS: TabConfig[] = [
  { name: "index",    label: "Discover",  icon: "home",           iconActive: "home"           },
  { name: "feeds",    label: "Feeds",     icon: "rss",            iconActive: "rss"            },
  { name: "live",     label: "Live",      icon: "video",          iconActive: "video",         isCenter: true },
  { name: "messages", label: "Inbox",     icon: "message-circle", iconActive: "message-circle" },
  { name: "more",     label: "More",      icon: "grid",           iconActive: "grid"           },
];

function TabItem({
  tab,
  isFocused,
  onPress,
  onLongPress,
  colors,
}: {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.05 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 18,
    }).start();
  }, [isFocused]);

  // Pulse animation for live center button
  useEffect(() => {
    if (!tab.isCenter) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  if (tab.isCenter) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
        style={styles.centerWrapper}
      >
        <Animated.View
          style={[
            styles.centerButton,
            { transform: [{ scale: pulseAnim }] },
            isFocused && styles.centerButtonActive,
          ]}
        >
          {/* Pulse ring */}
          <View style={styles.centerRing} />
          <Feather
            name="video"
            size={22}
            color="#ffffff"
          />
          {/* LIVE dot */}
          <View style={styles.liveDot} />
        </Animated.View>
        <Text style={[styles.centerLabel, isFocused && styles.centerLabelActive]}>
          Live
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabIconWrap,
          isFocused && { backgroundColor: "#8B000025" },
          { transform: [{ scale }] },
        ]}
      >
        <Feather
          name={tab.icon}
          size={20}
          color={isFocused ? colors.primary : colors.mutedForeground}
        />
        {isFocused && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.primary : colors.mutedForeground,
            fontWeight: isFocused ? "700" : "500",
          },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isIOS = Platform.OS === "ios";

  const bottomPadding = insets.bottom + (Platform.OS === "web" ? 8 : 4);

  const routeNames = state.routes.map((r) => r.name);

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: bottomPadding },
      ]}
      pointerEvents="box-none"
    >
      {/* Floating pill */}
      <View style={styles.pillContainer}>
        {isIOS ? (
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
        )}

        {/* Gold accent top border */}
        <View style={styles.topAccent} />

        {/* Tab items */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const routeIndex = routeNames.indexOf(tab.name);
            const isFocused = state.index === routeIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: state.routes[routeIndex]?.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            };
            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: state.routes[routeIndex]?.key,
              });
            };

            return (
              <TabItem
                key={tab.name}
                tab={tab}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                colors={colors}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const PILL_H = 68;
const CENTER_BTN = 56;

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  pillContainer: {
    height: PILL_H,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: "20%",
    right: "20%",
    height: 1.5,
    backgroundColor: "#FFD700",
    opacity: 0.5,
    borderRadius: 1,
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 0,
  },
  tabIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    top: -4,
    width: 20,
    height: 2.5,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 1,
    letterSpacing: 0.2,
  },

  // Center LIVE button
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: -6,
  },
  centerButton: {
    width: CENTER_BTN,
    height: CENTER_BTN,
    borderRadius: CENTER_BTN / 2,
    backgroundColor: "#8B0000",
    alignItems: "center",
    justifyContent: "center",
    // Gradient simulation via shadow
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 12,
    // Inner gradient via border
    borderWidth: 2,
    borderColor: "#E91E63",
    position: "relative",
    overflow: "hidden",
  },
  centerButtonActive: {
    backgroundColor: "#E91E63",
    borderColor: "#ff4499",
    shadowColor: "#E91E63",
    shadowOpacity: 0.9,
  },
  centerRing: {
    position: "absolute",
    width: CENTER_BTN + 12,
    height: CENTER_BTN + 12,
    borderRadius: (CENTER_BTN + 12) / 2,
    borderWidth: 1.5,
    borderColor: "rgba(233,30,99,0.3)",
    top: -6,
    left: -6,
  },
  liveDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#28a745",
    borderWidth: 1.5,
    borderColor: "#8B0000",
  },
  centerLabel: {
    fontSize: 10,
    color: "#E91E63",
    fontWeight: "700",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  centerLabelActive: {
    color: "#ff4499",
  },
});
