import { useState } from "react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LanguageToggle } from "../src/components/LanguageToggle";
import { useAuth } from "../src/lib/auth";
import { useLanguage } from "../src/lib/i18n";

const SOCIAL_PROVIDERS = ["google", "facebook", "apple", "tiktok"] as const;

export default function LoginScreen() {
  const { loginWithEmail, registerWithEmail, loginWithSocial } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useLanguage((state) => state.t);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password, "mobile-app");
      } else {
        await registerWithEmail(username, email, password, "mobile-app");
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: (typeof SOCIAL_PROVIDERS)[number]) {
    setError("");
    setLoading(true);
    try {
      await loginWithSocial(provider, `mock:${provider}@guesseat.test`, "mobile-app");
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.languageToggle}>
        <LanguageToggle />
      </View>
      <View style={styles.content}>
        <Text style={styles.logo}>GuessEat</Text>
        <Text style={styles.tagline}>{t("app.tagline")}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, mode === "login" && styles.tabActive]} onPress={() => setMode("login")}>
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Login</Text>
          </Pressable>
          <Pressable style={[styles.tab, mode === "register" && styles.tabActive]} onPress={() => setMode("register")}>
            <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Sign up</Text>
          </Pressable>
        </View>

        {mode === "register" ? (
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#475569"
            autoCapitalize="none"
          />
        ) : null}
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#475569"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#475569"
          secureTextEntry
        />

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{mode === "login" ? "Login" : "Create account"}</Text>
        </Pressable>

        <Text style={styles.divider}>or continue with</Text>
        <View style={styles.socialGrid}>
          {SOCIAL_PROVIDERS.map((provider) => (
            <Pressable key={provider} style={styles.socialButton} onPress={() => handleSocial(provider)} disabled={loading}>
              <Text style={styles.socialText}>{provider}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>Phone verification is only required for submitters.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  languageToggle: { position: "absolute", right: 16, top: 16, zIndex: 10 },
  content: { flex: 1, justifyContent: "center", padding: 24, gap: 10 },
  logo: { fontSize: 36, fontWeight: "bold", color: "#10b981", textAlign: "center" },
  tagline: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 22 },
  error: { color: "#ef4444", fontSize: 14, backgroundColor: "#1a0000", padding: 12, borderRadius: 8 },
  tabs: { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 9 },
  tabActive: { backgroundColor: "#10b981" },
  tabText: { color: "#94a3b8", fontWeight: "600" },
  tabTextActive: { color: "#020617" },
  input: { backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#ffffff", fontSize: 16 },
  button: { backgroundColor: "#10b981", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#020617", fontSize: 16, fontWeight: "bold" },
  divider: { color: "#64748b", textAlign: "center", marginVertical: 6, fontSize: 12 },
  socialGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  socialButton: { width: "48%", backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  socialText: { color: "#e2e8f0", textTransform: "capitalize", fontWeight: "600" },
  hint: { color: "#475569", fontSize: 12, textAlign: "center", marginTop: 4 },
});
