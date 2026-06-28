import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Camera, MapPin } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useUploadPhoto, useVenueSearch } from "../lib/hooks";
import { useTranslation } from "../lib/i18n";
import { Button, CategoryChips, EmptyState } from "../components/ui";

export const Route = createFileRoute("/upload")({
  component: UploadComponent,
});

const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.8;

async function resizeImage(file: File): Promise<File> {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);

  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

function UploadComponent() {
  const { user, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const uploadMutation = useUploadPhoto();
  const { t } = useTranslation();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [venueQuery, setVenueQuery] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "code">("phone");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const { data: venues } = useVenueSearch(venueQuery);

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setPreview(URL.createObjectURL(selected));
      resizeImage(selected).then((resized) => {
        setFile(resized);
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file || !category || !selectedVenueId) {
      setError(t("upload.missing_fields"));
      return;
    }

    uploadMutation.mutate(
      {
        photo: file,
        category,
        venue_id: selectedVenueId,
        client_censored: false,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setFile(null);
          setPreview(null);
          setCategory("");
          setVenueQuery("");
          setSelectedVenueId(null);
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : t("upload.upload_failed")),
      },
    );
  }

  if (!user) return null;

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhoneLoading(true);
    try {
      await sendPhoneOtp(phone);
      setPhoneStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.send_otp_failed"));
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhoneLoading(true);
    try {
      await verifyPhoneOtp(phone, phoneCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.invalid_otp"));
    } finally {
      setPhoneLoading(false);
    }
  }

  if (!user.phone || !user.phone_verified_at) {
    return (
      <div className="flex-1 px-6 pb-32 pt-24">
        <div className="mb-8 space-y-2">
          <h2 className="text-xl font-black text-cream">Contribute</h2>
          <p className="text-sm font-medium text-slate-600">Share your food adventures and help the community grow.</p>
        </div>

        <div className="rounded-[2rem] border border-border-soft bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-cream">Verify your phone to submit</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Playing stays free with email or social login. Submitters verify a Malaysian phone number once to reduce spam.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-danger/10 border border-danger/30 px-4 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          {phoneStep === "phone" ? (
            <form onSubmit={handleSendPhoneOtp} className="mt-5 space-y-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60123456789"
                className="w-full rounded-2xl border-none bg-white px-4 py-4 text-cream shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-chili transition-all placeholder:text-slate-400"
                required
              />
              <Button type="submit" loading={phoneLoading}>{phoneLoading ? t("login.sending") : t("login.send_otp")}</Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="mt-5 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-2xl border-none bg-white px-4 py-4 text-center text-xl tracking-widest text-cream shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-chili transition-all placeholder:text-slate-400"
                required
              />
              <Button type="submit" loading={phoneLoading}>{phoneLoading ? t("login.verifying") : t("login.verify_login")}</Button>
              <button type="button" onClick={() => setPhoneStep("phone")} className="w-full text-sm font-bold text-slate-500 hover:text-cream">
                {t("login.change_phone")}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <EmptyState
        icon="✅"
        title={t("upload.success_title")}
        message={t("upload.success_message")}
        action={
          <Button onClick={() => setSuccess(false)} size="md" leftIcon="📸">
            {t("upload.another")}
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 space-y-6 px-6 pb-32 pt-24">
      <div className="space-y-2">
        <h2 className="text-xl font-black text-cream">Contribute</h2>
        <p className="text-sm font-medium text-slate-600">Share your food adventures and help the community grow.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div>
        {preview ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border-2 border-white bg-white shadow-sm">
            <img src={preview} alt={t("upload.preview_alt")} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-cream backdrop-blur-sm"
            >
              {t("common.remove")}
            </button>
          </div>
        ) : (
          <label className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-[2.5rem] border-2 border-dashed border-chili/30 bg-white transition-all hover:border-chili hover:bg-chili/5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chili/10 text-chili">
              <Camera size={32} />
            </div>
            <div className="text-center">
              <span className="block font-semibold text-cream">{t("upload.tap_select")}</span>
              <span className="text-sm font-medium text-slate-600">High quality images work best</span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div>
        <label className="ml-2 block text-sm font-bold text-cream mb-2">{t("upload.category")}</label>
        <CategoryChips value={category} onChange={setCategory} />
      </div>

      <div>
        <label className="ml-2 block text-sm font-bold text-cream mb-2">{t("upload.venue")}</label>
        {selectedVenueId ? (
          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm">
            <Building2 size={18} className="mr-3 text-slate-500" />
            <span className="text-cream">
              {venues?.find((v) => v.id === selectedVenueId)?.name ?? t("common.selected")}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedVenueId(null);
                setVenueQuery("");
              }}
              className="text-xs font-bold text-slate-500 hover:text-cream"
            >
              {t("common.change")}
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <MapPin size={18} />
            </div>
            <input
              type="text"
              value={venueQuery}
              onChange={(e) => setVenueQuery(e.target.value)}
              placeholder={t("upload.search_placeholder")}
              className="w-full rounded-2xl border-none bg-white py-4 pl-12 pr-4 text-cream shadow-sm outline-none transition-all focus:ring-2 focus:ring-chili placeholder:text-slate-400"
            />
          </div>
        )}
        {!selectedVenueId && venues && venues.length > 0 && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {venues.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => {
                  setSelectedVenueId(venue.id);
                  setVenueQuery("");
                }}
                className="w-full rounded-2xl bg-white px-4 py-3 text-left text-sm text-cream shadow-sm transition-colors hover:bg-gray-50"
              >
                {venue.name}
                <span className="text-xs font-medium text-slate-500 ml-2">
                  {venue.district}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        loading={uploadMutation.isPending}
        disabled={!file || !category || !selectedVenueId}
        leftIcon={success ? "✓" : "📤"}
      >
        {uploadMutation.isPending ? t("upload.uploading") : t("upload.upload_photo")}
      </Button>
      <p className="px-8 text-center text-xs font-medium text-slate-500">
        By submitting, you agree to our terms and grant permission to use this photo.
      </p>
    </form>
  );
}
