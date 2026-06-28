import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { api } from "../src/lib/api";
import { useAuth } from "../src/lib/auth";
import { useLanguage } from "../src/lib/i18n";

const CATEGORIES = [
  { slug: "signature_dish", label: "Signature Dish", emoji: "🍛" },
  { slug: "ambience", label: "Ambience", emoji: "🪑" },
  { slug: "exterior", label: "Exterior", emoji: "🏠" },
  { slug: "table_setting", label: "Table Setting", emoji: "🍽️" },
  { slug: "staff_uniforms", label: "Staff & Uniforms", emoji: "👔" },
  { slug: "menu_signage", label: "Menu & Signage", emoji: "📋" },
  { slug: "general", label: "General", emoji: "📷" },
];

export default function UploadScreen() {
  const { user, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [venueQuery, setVenueQuery] = useState("");
  const [venues, setVenues] = useState<Array<{ id: string; name: string; district: string }>>([]);
  const [selectedVenue, setSelectedVenue] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "code">("phone");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const t = useLanguage((state) => state.t);

  async function handleSendPhoneOtp() {
    setPhoneLoading(true);
    try {
      await sendPhoneOtp(phone);
      setPhoneStep("code");
    } catch (err) {
      Alert.alert(t("error.send_otp_failed"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyPhoneOtp() {
    setPhoneLoading(true);
    try {
      await verifyPhoneOtp(phone, phoneCode);
    } catch (err) {
      Alert.alert(t("error.invalid_otp"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("upload.permission_title"), t("upload.permission_message"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 2048 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(resized.uri);
    }
  }

  async function searchVenues(query: string) {
    setVenueQuery(query);
    if (query.length < 2) return;
    try {
      const res = await api<{ data: Array<{ id: string; name: string; district: string }> }>(
        `/venues/search?q=${encodeURIComponent(query)}`,
      );
      setVenues(res.data);
    } catch {
      // ignore
    }
  }

  async function handleUpload() {
    if (!imageUri || !category || !selectedVenue) {
      Alert.alert(t("upload.missing_fields_title"), t("upload.missing_fields"));
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", {
        uri: imageUri,
        type: "image/jpeg",
        name: "photo.jpg",
      } as unknown as Blob);
      formData.append("category", category);
      formData.append("venue_id", selectedVenue.id);
      formData.append("client_censored", "false");

      await api("/photos", { method: "POST", body: formData });
      setSuccess(true);
      setImageUri(null);
      setCategory("");
      setSelectedVenue(null);
      setVenueQuery("");
    } catch (err) {
      Alert.alert(t("upload.upload_failed"), err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.center}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>{t("upload.success_title")}</Text>
        <Text style={styles.successText}>
          {t("upload.success_message")}
        </Text>
        <Pressable style={styles.button} onPress={() => setSuccess(false)}>
          <Text style={styles.buttonText}>{t("upload.another")}</Text>
        </Pressable>
      </View>
    );
  }

  if (!user?.phone || !user.phone_verified_at) {
    return (
      <View style={styles.center}>
        <Text style={styles.successTitle}>Verify your phone to submit</Text>
        <Text style={styles.successText}>
          Playing stays free with email or social login. Submitters verify a Malaysian phone number once to reduce spam.
        </Text>
        {phoneStep === "phone" ? (
          <>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+60123456789"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
            />
            <Pressable style={styles.button} onPress={handleSendPhoneOtp} disabled={phoneLoading}>
              <Text style={styles.buttonText}>{phoneLoading ? t("login.sending") : t("login.send_otp")}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, { textAlign: "center", fontSize: 28, letterSpacing: 8 }]}
              value={phoneCode}
              onChangeText={setPhoneCode}
              placeholder="123456"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Pressable style={styles.button} onPress={handleVerifyPhoneOtp} disabled={phoneLoading}>
              <Text style={styles.buttonText}>{phoneLoading ? t("login.verifying") : t("login.verify_login")}</Text>
            </Pressable>
            <Pressable onPress={() => setPhoneStep("phone")}>
              <Text style={styles.changeText}>{t("login.change_phone")}</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Text style={styles.imagePickedText}>✓ {t("upload.photo_selected")}</Text>
        ) : (
          <>
            <Text style={styles.imagePickerEmoji}>📸</Text>
            <Text style={styles.imagePickerText}>{t("upload.tap_select")}</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.sectionLabel}>{t("upload.category")}</Text>
      <View style={styles.categoriesRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.slug}
            style={[styles.categoryChip, category === cat.slug && styles.categorySelected]}
            onPress={() => setCategory(cat.slug)}
          >
            <Text style={[styles.categoryText, category === cat.slug && styles.categoryTextSelected]}>
              {cat.emoji} {t(`category.${cat.slug}` as never)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>{t("upload.venue")}</Text>
      {selectedVenue ? (
        <View style={styles.venueSelected}>
          <Text style={styles.venueSelectedText}>{selectedVenue.name}</Text>
          <Pressable onPress={() => { setSelectedVenue(null); setVenueQuery(""); }}>
            <Text style={styles.changeText}>{t("common.change")}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={venueQuery}
            onChangeText={searchVenues}
            placeholder={t("upload.search_placeholder")}
            placeholderTextColor="#475569"
          />
          {venues.length > 0 && (
            <View style={styles.venueList}>
              {venues.map((venue) => (
                <Pressable
                  key={venue.id}
                  style={styles.venueItem}
                  onPress={() => { setSelectedVenue({ id: venue.id, name: venue.name }); setVenues([]); setVenueQuery(""); }}
                >
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueDistrict}>{venue.district}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Pressable
        style={[styles.uploadButton, (!imageUri || !category || !selectedVenue) && styles.disabled]}
        onPress={handleUpload}
        disabled={uploading || !imageUri || !category || !selectedVenue}
      >
        <Text style={styles.uploadButtonText}>
          {uploading ? t("upload.uploading") : t("upload.upload_photo")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: "#020617" },
  center: { flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  imagePicker: {
    aspectRatio: 4 / 3,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#334155",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerEmoji: { fontSize: 40 },
  imagePickerText: { color: "#64748b", fontSize: 14, marginTop: 8 },
  imagePickedText: { color: "#10b981", fontSize: 16, fontWeight: "600" },
  sectionLabel: { color: "#94a3b8", fontSize: 14, marginTop: 4 },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  categoryText: { color: "#cbd5e1", fontSize: 13 },
  categorySelected: { backgroundColor: "#10b981" },
  categoryTextSelected: { color: "#020617", fontWeight: "600" },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#ffffff",
    fontSize: 16,
  },
  venueList: { gap: 4, maxHeight: 200 },
  venueItem: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  venueName: { color: "#e2e8f0", fontSize: 15 },
  venueDistrict: { color: "#64748b", fontSize: 12, marginTop: 2 },
  venueSelected: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  venueSelectedText: { color: "#e2e8f0", fontSize: 16 },
  changeText: { color: "#64748b", fontSize: 12 },
  uploadButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  uploadButtonText: { color: "#020617", fontSize: 16, fontWeight: "bold" },
  disabled: { opacity: 0.5 },
  button: { backgroundColor: "#10b981", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: "#020617", fontWeight: "bold" },
  successEmoji: { fontSize: 48 },
  successTitle: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  successText: { color: "#94a3b8", fontSize: 14, textAlign: "center", maxWidth: 280 },
});
