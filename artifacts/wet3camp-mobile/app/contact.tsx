import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CONTACT_METHODS = [
  { icon: "mail" as const, label: "Email", value: "support@wet3camp.co.ke" },
  { icon: "phone" as const, label: "Phone", value: "+254 700 000 000" },
  { icon: "message-circle" as const, label: "WhatsApp", value: "+254 700 000 001" },
  { icon: "map-pin" as const, label: "Location", value: "Nairobi, Kenya" },
];

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const send = () => {
    if (!name || !email || !message) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Contact Us</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
      >
        <View style={styles.contactCards}>
          {CONTACT_METHODS.map((m) => (
            <View key={m.label} style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.contactIcon, { backgroundColor: colors.background }]}>
                <Feather name={m.icon} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{m.label}</Text>
                <Text style={[styles.contactValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{m.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Send a Message</Text>

          {sent ? (
            <View style={styles.successBox}>
              <Feather name="check-circle" size={40} color={colors.available} />
              <Text style={[styles.successText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Message Sent!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>We'll get back to you within 24 hours.</Text>
            </View>
          ) : (
            <>
              {[
                { label: "Your Name", value: name, set: setName, placeholder: "Enter your name" },
                { label: "Email Address", value: email, set: setEmail, placeholder: "your@email.com" },
              ].map((field) => (
                <View key={field.label} style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={field.value}
                    onChangeText={field.set}
                  />
                </View>
              ))}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Message</Text>
                <TextInput
                  style={[styles.textarea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  placeholder="Your message..."
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>
              <Pressable
                style={({ pressed }) => [styles.sendBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                onPress={send}
              >
                <Feather name="send" size={16} color="#fff" />
                <Text style={[styles.sendText, { fontFamily: "Inter_700Bold" }]}>Send Message</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  title: { fontSize: 18 },
  scrollContent: { padding: 16, gap: 16 },
  contactCards: { gap: 10 },
  contactCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  contactIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  contactLabel: { fontSize: 11 },
  contactValue: { fontSize: 14, marginTop: 1 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  formTitle: { fontSize: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 100 },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  sendText: { color: "#fff", fontSize: 15 },
  successBox: { alignItems: "center", paddingVertical: 20, gap: 8 },
  successText: { fontSize: 18 },
  successSub: { fontSize: 14, textAlign: "center" },
});
