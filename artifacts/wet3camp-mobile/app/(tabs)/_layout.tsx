import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Discover</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feeds">
        <Icon sf={{ default: "newspaper", selected: "newspaper.fill" }} />
        <Label>Feeds</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="live">
        <Icon sf={{ default: "video", selected: "video.fill" }} />
        <Label>Live</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "dark"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: "Feeds",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="newspaper" tintColor={color} size={24} />
            ) : (
              <Feather name="rss" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "Live",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="video" tintColor={color} size={24} />
            ) : (
              <Feather name="video" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="message" tintColor={color} size={24} />
            ) : (
              <Feather name="message-circle" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
