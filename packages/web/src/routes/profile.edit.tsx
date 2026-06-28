import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, ImageIcon, Loader2, Save } from "lucide-react";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/profile/edit")({
  component: ProfileEditComponent,
});

const defaultCoverUrl = "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&q=80&w=1200";
const defaultAvatarUrl = "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&q=80&w=400";

function ProfileEditComponent() {
  const { user, isLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [district, setDistrict] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    setUsername(user.username);
    setDistrict(user.district ?? "");
    setProfileBio(user.profile_bio ?? "");
    setAvatarUrl(user.avatar_url ?? "");
    setCoverUrl(user.cover_url ?? "");
  }, [user]);

  if (!user) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateProfile({
        username,
        district: district || undefined,
        profile_bio: profileBio || undefined,
        avatar_url: avatarUrl || undefined,
        cover_url: coverUrl || undefined,
      });
      navigate({ to: "/profile" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 bg-[#f5f7fc] px-6 pb-32 pt-24">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#061835] shadow-sm ring-1 ring-slate-200"
          aria-label="Back to profile"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black text-[#061835]">Edit Profile</h2>
          <p className="text-sm font-bold text-[#91a0b8]">Update your public foodie card</p>
        </div>
        <div className="h-11 w-11" />
      </div>

      <section className="relative mb-20 h-52 overflow-visible rounded-[2rem] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
        <img
          src={coverUrl || defaultCoverUrl}
          alt="Profile cover preview"
          className="h-40 w-full rounded-t-[2rem] object-cover"
        />
        <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md">
          <ImageIcon size={22} />
        </div>
        <div className="absolute inset-x-0 -bottom-14 flex justify-center">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_16px_30px_rgba(255,83,96,0.25)]">
            <img
              src={avatarUrl || defaultAvatarUrl}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-2 text-white">
              <Camera size={18} />
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        <Field label="Username">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-[#061835] outline-none transition focus:border-[#ff5360]"
            placeholder="FoodieHunter88"
            maxLength={50}
            required
          />
        </Field>

        <Field label="Location">
          <input
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-[#061835] outline-none transition focus:border-[#ff5360]"
            placeholder="Kuala Lumpur, MY"
            maxLength={80}
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={profileBio}
            onChange={(event) => setProfileBio(event.target.value)}
            className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-[#061835] outline-none transition focus:border-[#ff5360]"
            placeholder="Obsessed with finding hidden gems 🍜"
            maxLength={160}
          />
          <p className="mt-2 text-right text-xs font-bold text-[#91a0b8]">{profileBio.length}/160</p>
        </Field>

        <Field label="Avatar image URL">
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-[#061835] outline-none transition focus:border-[#ff5360]"
            placeholder="https://example.com/avatar.jpg"
            type="url"
          />
        </Field>

        <Field label="Cover image URL">
          <input
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-[#061835] outline-none transition focus:border-[#ff5360]"
            placeholder="https://example.com/cover.jpg"
            type="url"
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-[#ff5360] px-5 py-4 text-base font-black text-white shadow-[0_16px_30px_rgba(255,83,96,0.28)] transition active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black uppercase tracking-wide text-[#91a0b8]">{label}</span>
      {children}
    </label>
  );
}
