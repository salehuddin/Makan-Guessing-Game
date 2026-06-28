import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Clock3, ImageIcon, MapPin, Settings, Trophy, XCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { CATEGORY_EMOJIS, type SubmittedPhoto } from "../lib/types";

export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

type ProfileTab = "activity" | "photos" | "achievements";

const defaultCoverUrl = "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&q=80&w=1200";
const defaultAvatarUrl = "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&q=80&w=400";

function ProfileComponent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>("activity");
  const [photos, setPhotos] = useState<SubmittedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    api<{ data: SubmittedPhoto[] }>("/photos")
      .then((data) => setPhotos(data.data))
      .catch((err) => setPhotoError(err.message))
      .finally(() => setLoadingPhotos(false));
  }, [user]);

  if (!user) return null;

  const guessesPlayed = user.guesses_played_count ?? 0;
  const correctGuesses = user.correct_guesses_count ?? 0;
  const accuracy = guessesPlayed > 0 ? Math.round((correctGuesses / guessesPlayed) * 100) : 0;
  const streak = user.guesser_streak ?? user.best_guess_streak ?? 0;
  const currentRank = getRank(user.xp_total);
  const nextRank = getNextRank(user.xp_total);
  const rankStart = currentRank.minXp;
  const rankTarget = nextRank?.minXp ?? currentRank.minXp + 1000;
  const rankProgress = Math.min(Math.max(((user.xp_total - rankStart) / (rankTarget - rankStart)) * 100, 0), 100);
  const activities = [
    { title: "Village Park Nasi Lemak", time: "2h ago", correct: true },
    { title: "Heun Kee Claypot Chicken", time: "5h ago", correct: false },
    { title: "Restoran Sri Nirwana Maju", time: "1d ago", correct: true },
  ];

  return (
    <main className="flex-1 bg-[#f5f7fc] pb-32">
      <section className="relative h-60">
        <img
          src={user.cover_url || defaultCoverUrl}
          alt="Food cover"
          className="h-44 w-full object-cover"
        />
        <button
          type="button"
          onClick={() => navigate({ to: "/profile/edit" })}
          className="absolute right-5 top-7 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-[#6f625d] text-white shadow-lg transition-transform active:scale-95"
          aria-label="Edit profile"
        >
          <Settings size={23} />
        </button>
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <div className="h-32 w-32 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_16px_30px_rgba(255,85,85,0.22)]">
            <img
              src={user.avatar_url || defaultAvatarUrl}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-6 text-center">
        <h2 className="text-[1.65rem] font-black leading-tight text-[#061835]">{user.username}</h2>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-[#4f6078]">
          <MapPin size={17} className="text-[#ff5360]" />
          <span>{user.district || "Kuala Lumpur, MY"}</span>
        </div>
        <p className="mt-3 text-[0.95rem] font-medium leading-relaxed text-[#26364d]">
          {user.profile_bio || "Obsessed with finding hidden gems 🍜"}
        </p>
      </section>

      <section className="mx-6 mt-7 rounded-[1.75rem] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff7cf] text-[#f4c400]">
            <Trophy size={29} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[0.72rem] font-black uppercase tracking-wide text-[#53657f]">Current Rank</p>
            <h3 className="text-base font-black text-[#061835]">{currentRank.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-[#061835]">
              {user.xp_total.toLocaleString()} / {rankTarget.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-bold text-[#53657f]">XP to {nextRank?.shortName ?? "Legend"}</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf1f7]">
          <div className="h-full rounded-full bg-[#ffcf00]" style={{ width: `${rankProgress}%` }} />
        </div>
      </section>

      <section className="mx-6 mt-6 grid grid-cols-3 rounded-[1.75rem] bg-white px-3 py-6 shadow-[0_4px_14px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/80">
        <ProfileStat label="Guesses" value={guessesPlayed.toLocaleString()} />
        <ProfileStat label="Correct" value={`${accuracy}%`} separated />
        <ProfileStat label="Streak" value={`🔥 ${streak}`} separated />
      </section>

      <section className="mt-7 px-6">
        <div className="grid grid-cols-3 border-b border-[#d7dfeb]">
          <TabButton active={activeTab === "activity"} label="Activity" onClick={() => setActiveTab("activity")} />
          <TabButton active={activeTab === "photos"} label="Photos" onClick={() => setActiveTab("photos")} />
          <TabButton active={activeTab === "achievements"} label="Awards" onClick={() => setActiveTab("achievements")} />
        </div>

        {activeTab === "activity" && (
          <div className="mt-6 space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.title} className="flex items-center gap-3 rounded-[1.4rem] bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f8fafc] ring-1 ring-slate-200">
                  {photos[index]?.thumbnail_url || photos[index]?.censored_url ? (
                    <img src={photos[index].thumbnail_url ?? photos[index].censored_url ?? ""} alt="Activity" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-[#52627a]" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="truncate text-sm font-black text-[#061835]">{activity.title}</h4>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#53657f]">
                    <Clock3 size={14} />
                    {activity.time}
                  </p>
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[0.68rem] font-black uppercase ${activity.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {activity.correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {activity.correct ? "Correct" : "Wrong"}
                </div>
                <ChevronRight size={18} className="text-[#94a3b8]" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "photos" && (
          <div className="mt-6">
            {loadingPhotos ? (
              <EmptyPanel icon={<ImageIcon size={34} />} title="Loading photos..." />
            ) : photoError ? (
              <EmptyPanel icon={<ImageIcon size={34} />} title="Could not load photos" text={photoError} />
            ) : photos.length === 0 ? (
              <EmptyPanel icon={<ImageIcon size={34} />} title="No submitted photos" text="Submit restaurant clues and they will appear here." />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.10)]">
                    {photo.thumbnail_url || photo.censored_url ? (
                      <img src={photo.thumbnail_url ?? photo.censored_url ?? ""} alt={photo.venue?.name ?? "Submitted restaurant"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#eef2f8] text-3xl">
                        {CATEGORY_EMOJIS[photo.category] ?? "📷"}
                      </div>
                    )}
                    <span className={`absolute right-2 top-2 rounded-full px-2.5 py-1.5 text-[0.65rem] font-black uppercase text-white shadow-lg ${photo.status === "approved" ? "bg-emerald-600" : "bg-amber-600"}`}>
                      {photo.status === "approved" ? "Approved" : "Review"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "achievements" && (
          <EmptyPanel
            icon={<Trophy size={40} />}
            title="Elite Achievements"
            text="Unlock special badges by guessing hidden gems around Malaysia."
          />
        )}
      </section>
    </main>
  );
}

function getRank(xp: number) {
  const ranks = [
    { name: "Bronze Bite", shortName: "Silver", minXp: 0 },
    { name: "Silver Spoon", shortName: "Gold", minXp: 500 },
    { name: "Gold Palate", shortName: "Platinum", minXp: 1000 },
    { name: "Platinum Hunter", shortName: "Legend", minXp: 2000 },
  ];

  return ranks.reduce((current, rank) => (xp >= rank.minXp ? rank : current), ranks[0]);
}

function getNextRank(xp: number) {
  return [
    { name: "Silver Spoon", shortName: "Silver", minXp: 500 },
    { name: "Gold Palate", shortName: "Gold", minXp: 1000 },
    { name: "Platinum Hunter", shortName: "Platinum", minXp: 2000 },
    { name: "Legendary Foodie", shortName: "Legend", minXp: 5000 },
  ].find((rank) => xp < rank.minXp);
}

function ProfileStat({ label, value, separated = false }: { label: string; value: string; separated?: boolean }) {
  return (
    <div className={`text-center ${separated ? "border-l border-[#dfe7f1]" : ""}`}>
      <p className="text-xl font-black text-[#061835]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#4f6078]">{label}</p>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-[3px] px-1 pb-3 text-center text-sm font-black transition-colors ${
        active ? "border-[#ff5360] text-[#ff5360]" : "border-transparent text-[#52627a]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyPanel({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#eef2f8] text-[#52627a]">
        {icon}
      </div>
      <h3 className="text-lg font-black text-[#061835]">{title}</h3>
      {text && <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-[#53657f]">{text}</p>}
    </div>
  );
}
