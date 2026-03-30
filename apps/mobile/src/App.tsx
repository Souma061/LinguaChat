import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { LanguageCode } from "./types/socket";
import { mobileConfig } from "./config/mobileConfig";

const supportedLanguages: Array<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
];

const App = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>LinguaChat Mobile</Text>
          <Text style={styles.title}>React Native workspace is ready.</Text>
          <Text style={styles.body}>
            This app is scaffolded to share the existing backend, database, and
            socket contracts while keeping mobile-specific code isolated.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend wiring</Text>
          <Text style={styles.cardLabel}>API base URL</Text>
          <Text style={styles.cardValue}>{mobileConfig.apiUrl}</Text>
          <Text style={styles.cardLabel}>Socket URL</Text>
          <Text style={styles.cardValue}>{mobileConfig.socketUrl}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shared foundations</Text>
          <Text style={styles.listItem}>Socket contracts come from `packages/shared`.</Text>
          <Text style={styles.listItem}>The backend remains the single source of truth.</Text>
          <Text style={styles.listItem}>Web and mobile can converge on common DTOs next.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supported chat languages</Text>
          <View style={styles.languageGrid}>
            {supportedLanguages.map((language) => (
              <View key={language.code} style={styles.languageChip}>
                <Text style={styles.languageCode}>{language.code.toUpperCase()}</Text>
                <Text style={styles.languageLabel}>{language.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08111f",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 18,
  },
  hero: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#101b2d",
    borderWidth: 1,
    borderColor: "#1b2a45",
  },
  kicker: {
    color: "#8cc7ff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#0d1728",
    borderWidth: 1,
    borderColor: "#1c304d",
    gap: 10,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  cardLabel: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  cardValue: {
    color: "#dbeafe",
    fontSize: 15,
    lineHeight: 22,
  },
  listItem: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 22,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  languageChip: {
    width: "47%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#14233a",
    borderWidth: 1,
    borderColor: "#253958",
    gap: 4,
  },
  languageCode: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800",
  },
  languageLabel: {
    color: "#bfdbfe",
    fontSize: 14,
  },
});

export default App;
