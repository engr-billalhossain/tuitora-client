"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Crown,
  Loader2,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";
import { uploadBanner } from "@/lib/actions/uploadImage";
import { isProValue } from "@/lib/plans";

type Profile = {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  phone: string;
  bio: string;
  plan: string;
  createdAt?: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-[#141C21] px-3.5 text-[13px] text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#B6F70B]/50 focus:ring-2 focus:ring-[#B6F70B]/10";

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [image, setImage] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (isPending || !session?.user?.id) return;
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          profile?: Profile;
          error?: string;
        };
        if (!response.ok || !payload.profile) {
          throw new Error(payload.error || "Could not load your profile");
        }
        if (!active) return;
        setProfile(payload.profile);
        setName(payload.profile.name);
        setPhone(payload.profile.phone);
        setBio(payload.profile.bio);
        setImage(payload.profile.image);
      })
      .catch((err) => {
        if (active) {
          const message = err instanceof Error ? err.message : "Could not load profile";
          setError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isPending, session?.user?.id]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, bio, image }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        profile?: Profile;
        error?: string;
      };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Could not save your profile");
      }
      setProfile(payload.profile);
      await refetch();
      toast.success("Profile updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save your profile";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be smaller than 5 MB");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadBanner(file);
      setImage(result.url);
      toast.success("Photo uploaded — click Save changes to apply it");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (isPending || loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#050B0E] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#B6F70B]" />
      </main>
    );
  }

  if (!session?.user?.id) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#050B0E] px-5 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#0B1215] p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#B6F70B]" />
          <h1 className="mt-4 text-xl font-extrabold">Sign in to view your profile</h1>
          <Link
            href="/sign-in?callbackURL=/profile"
            className="mt-6 inline-flex rounded-lg bg-[#B6F70B] px-5 py-2.5 text-sm font-bold text-black"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[85vh] bg-[#050B0E] px-5 py-10 text-white">
      <div className="mx-auto max-w-[760px]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-400 hover:text-[#B6F70B]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="mt-7 text-3xl font-extrabold tracking-tight">My Profile</h1>
        <p className="mt-2 text-[13px] text-gray-400">
          Keep your contact details up to date. Your role and plan can only be
          changed by an administrator or a verified payment.
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-[12px] font-semibold text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="mt-8 rounded-2xl border border-white/10 bg-[#0B1215] p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-2 border-[#B6F70B]/40 object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#B6F70B]/40 bg-[#B6F70B]/10 text-2xl font-extrabold text-[#B6F70B]">
                  {(name || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:border-[#B6F70B]">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#B6F70B]" />
                ) : (
                  <Upload className="h-4 w-4 text-[#B6F70B]" />
                )}
                {uploading ? "Uploading..." : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-[11px] text-gray-500">
                JPG/PNG up to 5 MB. Stored securely on ImgBB.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-gray-300">
                Full name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-gray-300">
                Email address (read only)
              </span>
              <input value={profile?.email ?? ""} readOnly className={`${inputClass} opacity-60`} />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold text-gray-300">
                Phone number
              </span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 555 123 4567"
                maxLength={30}
                className={inputClass}
              />
            </label>
            <div className="block">
              <span className="mb-2 block text-[12px] font-semibold text-gray-300">
                Profile photo
              </span>
              <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141C21] px-3.5">
                <span className="truncate text-[12px] text-gray-400">
                  {image ? "Uploaded to ImgBB" : "No photo uploaded yet"}
                </span>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="shrink-0 text-[12px] font-bold text-rose-300 transition-colors hover:text-rose-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-[12px] font-semibold text-gray-300">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell students a little about yourself..."
              className={`${inputClass} h-auto resize-y py-3`}
            />
            <span className="mt-1 block text-right text-[10px] text-gray-600">
              {bio.length}/500
            </span>
          </label>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#B6F70B] px-6 text-[13px] font-extrabold text-[#0B1100] transition-colors hover:bg-[#C9FF42] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save changes"}
            </button>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold capitalize text-gray-300">
              {profile?.role}
            </span>
            {isProValue(profile?.plan) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-3 py-1.5 text-[11px] font-bold text-[#E8C34A]">
                <Crown className="h-3.5 w-3.5" /> PRO member
              </span>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
