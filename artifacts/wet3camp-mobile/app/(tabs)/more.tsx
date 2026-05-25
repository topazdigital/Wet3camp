import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = keyof typeof Feather.glyphMap;

interface MenuItem {
  icon: FeatherIconName;
  label: string;
  route: string;
  badge?: string;
  badgeColor?: string;
}

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Browse",
    items: [
      { icon: "heart", label: "My Favorites", route: "/favorites", badge: "3", badgeColor: "#8B0000" },
      { icon: "star", label: "Exclusive", route: "/exclusive", badge: "VIP", badgeColor: "#FF4500" },
      { icon: "shopping-bag", label: "Premium Shop", route: "/shop" },
      { icon: "film", label: "Videos", route: "/videos" },
    ],
  },
  {
    title: "Discover",
    items: [
      { icon: "calendar", label: "Events", route: "/events" },
      { icon: "home", label: "Rooms", route: "/rooms" },
      { icon: "map", label: "Tours", route: "/tours" },
      { icon: "radio", label: "Adverts", route: "/adverts" },
    ],
  },
  {
    title: "Community",
    items: [
      { icon: "message-square", label: "Testimonials", route: "/testimonials" },
      { icon: "star", label: "Reviews", route: "/reviews" },
      { icon: "slash", label: "Blacklist", route: "/blacklist" },
    ],
  },
  {
    title: "Info",
    items: [
      { icon: "help-circle", label: "FAQs", route: "/faqs" },
      { icon: "phone", label: "Contact Us", route: "/contact" },
      { icon: "download", label: "Install App", route: "/install" },
      { icon: "shield", label: "Admin Panel", route: "/admin" },
    ],
  },
];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const navigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 80 },
        ]}
      >
        <View style={[styles.header, { paddingTop: topPad + 10 }]}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            More
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            All sections and features
          </Text>
        </View>

        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    styles.menuItem,
                    {
                      borderBottomWidth: index < section.items.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border,
                      backgroundColor: pressed ? colors.muted : "transparent",
                    },
                  ]}
                  onPress={() => navigate(item.route)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
                    <Feather name={item.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.badgeColor ?? colors.primary }]}>
                      <Text style={[styles.badgeText, { fontFamily: "Inter_700Bold" }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 24, marginBottom: 2 },
  subtitle: { fontSize: 13 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 15 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: "#fff", fontSize: 10 },
});
