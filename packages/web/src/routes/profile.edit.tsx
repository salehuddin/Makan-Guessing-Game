import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Globe,
  ImageIcon,
  Key,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
  Bell,
} from "lucide-react";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/profile/edit")({
  component: ProfileEditComponent,
});

const defaultCoverUrl =
  "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&q=80&w=1200";
const defaultAvatarUrl =
  "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&q=80&w=400";

function ProfileEditComponent() {
  const {
    user,
    isLoading,
    updateProfile,
    updatePassword,
    updateEmail,
    updatePreferences,
    uploadImage,
    deleteAccount,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, isLoading, navigate]);

  if (!user) return null;

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
          <h2 className="text-xl font-bold text-[#061835]">Settings</h2>
          <p className="text-sm font-medium text-[#64748b]">Manage your account</p>
        </div>
        <div className="h-11 w-11" />
      </div>

      <div className="space-y-4">
        <ProfileSection user={user} updateProfile={updateProfile} uploadImage={uploadImage} />
        <AccountSection user={user} updateEmail={updateEmail} />
        <SecuritySection updatePassword={updatePassword} />
        <PreferencesSection user={user} updatePreferences={updatePreferences} />
        <DangerZoneSection deleteAccount={deleteAccount} logout={logout} />
      </div>
    </main>
  );
}

function SectionCard({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2f8] text-[#52627a]">
          {icon}
        </div>
        <span className="flex-1 text-lg font-semibold text-[#061835]">{title}</span>
        {open ? (
          <ChevronUp size={20} className="text-[#64748b]" />
        ) : (
          <ChevronDown size={20} className="text-[#64748b]" />
        )}
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-5">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
        {label}
      </span>
      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-semibold text-[#061835] outline-none transition placeholder:text-[#94a3b8] focus:border-[#ff5360]";
}

function ProfileSection({
  user,
  updateProfile,
  uploadImage,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  updateProfile: ReturnType<typeof useAuth>["updateProfile"];
  uploadImage: ReturnType<typeof useAuth>["uploadImage"];
}) {
  const [username, setUsername] = useState(user.username);
  const [district, setDistrict] = useState(user.district ?? "");
  const [profileBio, setProfileBio] = useState(user.profile_bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(user.cover_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(user.username);
    setDistrict(user.district ?? "");
    setProfileBio(user.profile_bio ?? "");
    setAvatarUrl(user.avatar_url ?? "");
    setCoverUrl(user.cover_url ?? "");
  }, [user]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateProfile({
        username,
        district: district || undefined,
        profile_bio: profileBio || undefined,
        avatar_url: avatarUrl || undefined,
        cover_url: coverUrl || undefined,
      });
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(type: "avatar" | "cover", file: File) {
    const setUploading = type === "avatar" ? setUploadingAvatar : setUploadingCover;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      await uploadImage(type, file);
      setSuccess(`${type === "avatar" ? "Avatar" : "Cover"} updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SectionCard title="Profile" icon={<User size={20} />} defaultOpen>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
          {success}
        </div>
      )}

      <div className="relative mb-16 h-40 overflow-visible">
        <img
          src={user.cover_url || defaultCoverUrl}
          alt="Cover"
          className="h-36 w-full rounded-2xl object-cover"
        />
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload("cover", file);
          }}
        />
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md disabled:opacity-50"
        >
          {uploadingCover ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
        </button>

        <div className="absolute inset-x-0 -bottom-12 flex justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_12px_24px_rgba(255,83,96,0.2)]">
            <img
              src={user.avatar_url || defaultAvatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload("avatar", file);
              }}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-1.5 text-white disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Username">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass()}
            placeholder="FoodieHunter88"
            maxLength={50}
            required
          />
        </Field>

        <Field label="Location">
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={inputClass()}
            placeholder="Kuala Lumpur, MY"
            maxLength={80}
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={profileBio}
            onChange={(e) => setProfileBio(e.target.value)}
            className={`min-h-24 resize-none ${inputClass()}`}
            placeholder="Obsessed with finding hidden gems 🍜"
            maxLength={160}
          />
          <p className="mt-2 text-right text-xs font-medium text-[#64748b]">
            {profileBio.length}/160
          </p>
        </Field>

        <Field label="Avatar image URL">
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className={inputClass()}
            placeholder="https://example.com/avatar.jpg"
            type="url"
          />
        </Field>

        <Field label="Cover image URL">
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className={inputClass()}
            placeholder="https://example.com/cover.jpg"
            type="url"
          />
        </Field>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-[#ff5360] px-5 py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(255,83,96,0.25)] transition active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </SectionCard>
  );
}

function AccountSection({
  user,
  updateEmail,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  updateEmail: ReturnType<typeof useAuth>["updateEmail"];
}) {
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setEmail(user.email ?? "");
  }, [user]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateEmail(email, password);
      setPassword("");
      setSuccess("Email updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update email");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Account" icon={<Mail size={20} />}>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <Field label="Email address">
          <div className="relative">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass()}
              placeholder="you@example.com"
              type="email"
            />
            {user.email_verified_at ? (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-emerald-600">
                Verified
              </span>
            ) : (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-amber-600">
                Unverified
              </span>
            )}
          </div>
        </Field>

        <Field label="Confirm with password">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass()}
            placeholder="Enter your password"
            type="password"
          />
        </Field>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Phone size={18} className="text-[#52627a]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#061835]">
              {user.phone ?? "No phone linked"}
            </p>
            <p className="text-xs text-[#64748b]">
              {user.phone_verified_at ? "Verified" : "Not verified"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !email || !password}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-[#ff5360] px-5 py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(255,83,96,0.25)] transition active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? "Saving..." : "Update Email"}
        </button>
      </div>
    </SectionCard>
  );
}

function SecuritySection({
  updatePassword,
}: {
  updatePassword: ReturnType<typeof useAuth>["updatePassword"];
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave() {
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Security" icon={<Shield size={20} />}>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <Field label="Current password">
          <div className="relative">
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass()}
              placeholder="Enter current password"
              type={showCurrent ? "text" : "password"}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <Field label="New password">
          <div className="relative">
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass()}
              placeholder="At least 8 characters"
              type={showNew ? "text" : "password"}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm new password">
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass()}
            placeholder="Re-enter new password"
            type="password"
            minLength={8}
          />
        </Field>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-[#061835] px-5 py-4 text-base font-bold text-white transition active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Key size={20} />}
          {saving ? "Updating..." : "Change Password"}
        </button>
      </div>
    </SectionCard>
  );
}

function PreferencesSection({
  user,
  updatePreferences,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  updatePreferences: ReturnType<typeof useAuth>["updatePreferences"];
}) {
  const [language, setLanguage] = useState(user.language ?? "en");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user.notifications_enabled ?? true,
  );
  const [profileVisibility, setProfileVisibility] = useState(
    user.profile_visibility ?? "public",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLanguage(user.language ?? "en");
    setNotificationsEnabled(user.notifications_enabled ?? true);
    setProfileVisibility(user.profile_visibility ?? "public");
  }, [user]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updatePreferences({
        language,
        notifications_enabled: notificationsEnabled,
        profile_visibility: profileVisibility,
      });
      setSuccess("Preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Preferences" icon={<Globe size={20} />}>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <Field label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputClass()}
          >
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="zh">中文</option>
          </select>
        </Field>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-[#52627a]" />
            <div>
              <p className="text-sm font-semibold text-[#061835]">Notifications</p>
              <p className="text-xs text-[#64748b]">
                Receive game and activity alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              notificationsEnabled ? "bg-[#ff5360]" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                notificationsEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <Field label="Profile visibility">
          <select
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
            className={inputClass()}
          >
            <option value="public">Public — visible to everyone</option>
            <option value="private">Private — only you</option>
          </select>
        </Field>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-[#ff5360] px-5 py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(255,83,96,0.25)] transition active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </SectionCard>
  );
}

function DangerZoneSection({
  deleteAccount,
  logout,
}: {
  deleteAccount: ReturnType<typeof useAuth>["deleteAccount"];
  logout: ReturnType<typeof useAuth>["logout"];
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);
    try {
      await deleteAccount(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete account");
      setDeleting(false);
    }
  }

  return (
    <SectionCard title="Danger Zone" icon={<Trash2 size={20} />}>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-base font-bold text-[#061835] transition active:scale-95"
        >
          <LogOut size={20} />
          Sign Out
        </button>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-base font-bold text-red-600 transition active:scale-95"
          >
            <Trash2 size={20} />
            Delete Account
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-semibold text-red-600">
              This action is permanent. All your data will be lost.
            </p>
            <Field label="Confirm with password">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass()}
                placeholder="Enter your password"
                type="password"
              />
            </Field>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setPassword("");
                  setError("");
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#061835]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !password}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
