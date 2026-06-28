import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../src/lib/api";
import { useAuth } from "../src/lib/auth";
import { CATEGORY_EMOJIS, CATEGORY_LABELS, type SubmittedPhoto } from "../src/lib/types";

type MeTab = "activity" | "photos";

const BADGES = [
  { title: "First Bite", text: "Started guessing", icon: "G" },
  { title: "Sharp Palate", text: "Correct answers", icon: "P" },
  { title: "Scout", text: "Photo submitter", icon: "S" },
  { title: "Trusted", text: "Quality contributor", icon: "T" },
];

export default function MeScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MeTab>("activity");
  const [photos, setPhotos] = useState<SubmittedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    api<{ data: SubmittedPhoto[] }>("/photos")
      .then((data) => setPhotos(data.data))
      .catch((err) => setPhotoError(err.message))
      .finally(() => setLoadingPhotos(false));
  }, []);

  if (!user) {
    return null;
  }

  const guessesPlayed = user.guesses_played_count ?? 0;
  const correctGuesses = user.correct_guesses_count ?? 0;
  const wrongGuesses = Math.max(guessesPlayed - correctGuesses, 0);
  const submittedCount = photos.length || user.approved_count || 0;
  const initials = user.username.slice(0, 2).toUpperCase();
  const trustTier = user.trust_tier.replace(/_/g, " ");
  const completionRate = guessesPlayed > 0 ? Math.round((correctGuesses / guessesPlayed) * 100) : 0;
  const earnedBadges = BADGES.filter((badge) => {
    if (badge.title === "Sharp Palate") return correctGuesses > 0;
    if (badge.title === "Scout") return submittedCount > 0;
    if (badge.title === "Trusted") return ["verified", "trusted", "curator"].includes(user.trust_tier);
    return true;
  });
  const activities = [
    { title: "Rank XP updated", detail: `You have ${user.xp_total.toLocaleString()} total XP`, accent: "+XP" },
    { title: "Guess record", detail: `${correctGuesses} right and ${wrongGuesses} wrong`, accent: `${completionRate}%` },
    { title: "Photo submissions", detail: `${submittedCount} photos submitted for GuessEat`, accent: `${submittedCount}` },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.handle}>@{user.username.toLowerCase()}</Text>
        <Text style={styles.bio}>{user.district ? `${user.district} food hunter` : "Malaysian restaurant guesser"}</Text>

        <View style={styles.profileMetaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaValue}>{trustTier}</Text>
            <Text style={styles.metaLabel}>Trust tier</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaValue}>{user.guesser_streak ?? 0}</Text>
            <Text style={styles.metaLabel}>Current streak</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard value={user.xp_total.toLocaleString()} label="Rank XP" />
        <StatCard value={correctGuesses.toLocaleString()} label="Guesses Right" />
        <StatCard value={wrongGuesses.toLocaleString()} label="Guesses Wrong" />
        <StatCard value={submittedCount.toLocaleString()} label="Photos Submitted" />
      </View>

      <View style={styles.tabRow}>
        <TabButton active={activeTab === "activity"} label="Profile" onPress={() => setActiveTab("activity")} />
        <TabButton active={activeTab === "photos"} label="Submitted photos" onPress={() => setActiveTab("photos")} />
      </View>

      {activeTab === "activity" ? (
        <View style={styles.sectionStack}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {earnedBadges.map((badge) => (
              <View key={badge.title} style={styles.badgeCard}>
                <View style={styles.badgeIcon}>
                  <Text style={styles.badgeIconText}>{badge.icon}</Text>
                </View>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeText}>{badge.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.activityList}>
            {activities.map((activity) => (
              <View key={activity.title} style={styles.activityItem}>
                <View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDetail}>{activity.detail}</Text>
                </View>
                <Text style={styles.activityAccent}>{activity.accent}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.sectionStack}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Submitted Photos</Text>
            <Text style={styles.sectionCount}>{photos.length}</Text>
          </View>
          {loadingPhotos ? (
            <View style={styles.photoState}>
              <ActivityIndicator color="#10b981" />
              <Text style={styles.photoStateText}>Loading photos...</Text>
            </View>
          ) : photoError ? (
            <View style={styles.photoState}>
              <Text style={styles.photoStateText}>{photoError}</Text>
            </View>
          ) : photos.length === 0 ? (
            <View style={styles.photoState}>
              <Text style={styles.photoStateIcon}>P</Text>
              <Text style={styles.photoStateTitle}>No submissions yet</Text>
              <Text style={styles.photoStateText}>Submit restaurant clues and they will appear here.</Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  {photo.thumbnail_url || photo.censored_url ? (
                    <Image
                      source={{ uri: photo.thumbnail_url ?? photo.censored_url ?? "" }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoEmoji}>{CATEGORY_EMOJIS[photo.category] ?? "P"}</Text>
                    </View>
                  )}
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoVenue} numberOfLines={1}>{photo.venue?.name ?? "Restaurant photo"}</Text>
                    <Text style={styles.photoCategory} numberOfLines={1}>{CATEGORY_LABELS[photo.category] ?? photo.category}</Text>
                    <View style={styles.photoStatsRow}>
                      <Text style={styles.photoStatus}>{photo.status}</Text>
                      <Text style={styles.photoGuesses}>{photo.total_guesses} guesses</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: "#020617" },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 28,
    padding: 22,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#064e3b",
    borderWidth: 3,
    borderColor: "#10b981",
  },
  avatarText: { color: "#ecfdf5", fontSize: 26, fontWeight: "900" },
  name: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 12 },
  handle: { color: "#64748b", fontSize: 13, marginTop: 2 },
  bio: { color: "#cbd5e1", fontSize: 14, marginTop: 12, textAlign: "center" },
  profileMetaRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  metaPill: {
    minWidth: 118,
    alignItems: "center",
    backgroundColor: "#020617",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaValue: { color: "#10b981", fontSize: 15, fontWeight: "800", textTransform: "capitalize" },
  metaLabel: { color: "#64748b", fontSize: 11, marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48.5%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 18,
    padding: 16,
  },
  statValue: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#64748b", fontSize: 12, marginTop: 4 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 12 },
  tabButtonActive: { backgroundColor: "#10b981" },
  tabText: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: "#020617" },
  sectionStack: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#e2e8f0", fontSize: 17, fontWeight: "800" },
  sectionCount: { color: "#64748b", fontSize: 13 },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "48.5%",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 18,
    padding: 14,
  },
  badgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.14)",
  },
  badgeIconText: { color: "#10b981", fontSize: 16, fontWeight: "900" },
  badgeTitle: { color: "#ffffff", fontSize: 14, fontWeight: "800", marginTop: 10 },
  badgeText: { color: "#64748b", fontSize: 12, marginTop: 3 },
  activityList: { gap: 8 },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
    padding: 14,
  },
  activityTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: "700" },
  activityDetail: { color: "#64748b", fontSize: 12, marginTop: 3 },
  activityAccent: { color: "#10b981", fontSize: 14, fontWeight: "900" },
  photoState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  photoStateIcon: { color: "#10b981", fontSize: 34, fontWeight: "900" },
  photoStateTitle: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  photoStateText: { color: "#64748b", fontSize: 13, textAlign: "center" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoCard: {
    width: "48.5%",
    overflow: "hidden",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 18,
  },
  photoImage: { width: "100%", aspectRatio: 1 },
  photoPlaceholder: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
  },
  photoEmoji: { color: "#10b981", fontSize: 28, fontWeight: "900" },
  photoInfo: { padding: 10 },
  photoVenue: { color: "#e2e8f0", fontSize: 13, fontWeight: "800" },
  photoCategory: { color: "#64748b", fontSize: 11, marginTop: 2 },
  photoStatsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 9 },
  photoStatus: { color: "#10b981", fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  photoGuesses: { color: "#64748b", fontSize: 11 },
});
