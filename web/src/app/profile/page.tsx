"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  FileCheck2,
  FolderPlus,
  Link2,
  Sparkles,
} from "lucide-react";
import type { Achievement } from "@/lib/achievements";

const ACHIEVEMENT_ICONS = {
  "first-review": FileCheck2,
  "ten-reviews": Award,
  "first-project": FolderPlus,
  "on-chain-reviewer": Link2,
  "early-supporter": Sparkles,
} as const;

/** Personal moderation counts from GET /api/admin/maintainer-stats?me=1. */
type ModeratorStats = {
  approvals: number;
  rejections: number;
  delists: number;
  total_actions: number;
  last_action_at: string | null;
};

const ACHIEVEMENT_ACCENTS = {
  "first-review": "text-plasma-bright bg-plasma/10 border-plasma/20",
  "ten-reviews": "text-solar-bright bg-solar/10 border-solar/20",
  "first-project": "text-aurora-bright bg-aurora/10 border-aurora/20",
  "on-chain-reviewer": "text-nova-bright bg-nova/10 border-nova/20",
  "early-supporter": "text-rose-300 bg-rose-400/10 border-rose-300/20",
} as const;

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  bio: z
    .string()
    .max(500, "Bio must be under 500 characters"),
  github_url: z
    .string()
    .url("Please enter a valid URL")
    .refine((val) => val === "" || val.includes("github.com"), "Must be a GitHub URL")
    .or(z.literal("")),
  twitter_url: z
    .string()
    .url("Please enter a valid URL")
    .refine((val) => val === "" || val.includes("x.com") || val.includes("twitter.com"), "Must be an X / Twitter URL")
    .or(z.literal("")),
  discord_username: z
    .string()
    .max(40, "Discord username too long"),
  telegram_url: z
    .string()
    .url("Please enter a valid URL")
    .refine((val) => val === "" || val.includes("t.me"), "Must be a Telegram URL")
    .or(z.literal("")),
  website_url: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

const AVATAR_SIZE = 256;

/** Center-crops an image to a square and downsizes it to AVATAR_SIZE px. */
async function cropToSquare(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Could not process image");
  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const achievementsQuery = useQuery<Achievement[]>({
    queryKey: ["achievements", user?.id],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/achievements/me", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load achievements");
      return data.achievements;
    },
    enabled: !!user && !!token,
  });
  const achievements = achievementsQuery.data ?? [];
  const achievementsLoading = achievementsQuery.isLoading;
  const achievementsError = achievementsQuery.error?.message ?? "";

  const isModerator = user?.role === "maintainer" || user?.role === "admin";

  const moderationStatsQuery = useQuery<ModeratorStats | null>({
    queryKey: ["moderation-stats", user?.id],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/admin/maintainer-stats?me=1", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load moderation stats");
      return data.stats?.[0] ?? null;
    },
    enabled: isModerator && !!token,
  });
  const moderationStats = moderationStatsQuery.data;
  const moderationStatsLoading = moderationStatsQuery.isLoading;
  const moderationStatsError = moderationStatsQuery.error?.message ?? "";

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      username: user?.username || "",
      bio: user?.bio || "",
      github_url: user?.github_url || "",
      twitter_url: user?.twitter_url || "",
      discord_username: user?.discord_username || "",
      telegram_url: user?.telegram_url || "",
      website_url: user?.website_url || "",
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const saveAvatarUrl = async (avatarUrl: string | null) => {
    const res = await fetch("/api/auth/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save avatar");
    await refreshUser();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const cropped = await cropToSquare(file);
      const formData = new FormData();
      formData.append("files", cropped);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await saveAvatarUrl(data.urls[0]);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarError("");
    setAvatarUploading(true);
    try {
      await saveAvatarUrl(null);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLinkWallet = async () => {
    setWalletError("");
    setWalletLoading(true);
    try {
      const { isConnected, requestAccess, getAddress, signTransaction } =
        await import("@stellar/freighter-api");

      const connResult = await isConnected();
      if (connResult.error || !connResult.isConnected) {
        throw new Error("Freighter wallet not found. Please install the Freighter browser extension.");
      }

      const accessResult = await requestAccess();
      if (accessResult.error) {
        throw new Error(accessResult.error.message || "Wallet access denied.");
      }

      const addrResult = await getAddress();
      if (addrResult.error || !addrResult.address) {
        throw new Error("Could not retrieve public key from wallet.");
      }
      const publicKey = addrResult.address;

      // Get challenge from server
      const challengeRes = await fetch(`/api/auth/challenge?publicKey=${publicKey}`);
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) throw new Error(challengeData.error || "Failed to get challenge");

      // Sign with Freighter
      const signResult = await signTransaction(challengeData.challengeXdr, {
        networkPassphrase: challengeData.networkPassphrase,
      });
      if (signResult.error || !signResult.signedTxXdr) {
        throw new Error("Failed to sign transaction with wallet.");
      }

      // Link wallet to current account
      const linkRes = await fetch("/api/auth/link-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publicKey, signedXdr: signResult.signedTxXdr }),
      });
      const linkData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkData.error || "Failed to link wallet");

      await refreshUser();
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setWalletLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stardust/50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="font-semibold text-xl text-starlight mb-2">Sign in required</h2>
          <p className="text-ash mb-6">You need to be signed in to view your profile</p>
          <Link href="/login" className="btn-nova inline-flex">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-4 mb-4">
          <Avatar
            username={user.username}
            avatarUrl={user.avatar_url}
            className="w-16 h-16 text-2xl shadow-lg shadow-nova/20"
          />
          <div>
            <h1 className="font-display font-bold text-3xl text-starlight">{user.username}</h1>
            <div className="flex items-center gap-3 text-sm text-ash mt-0.5">
              <span>{user.email || "No email"}</span>
              <RoleBadge role={user.role as "contributor" | "maintainer" | "admin"} />
              {user.created_at && (
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              )}
            </div>
            <div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <label className="btn-ghost !py-1 !px-3 text-xs cursor-pointer">
                  {avatarUploading ? "Uploading..." : "Change avatar"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={avatarUploading}
                    onChange={handleAvatarChange}
                  />
                </label>
                {user.avatar_url && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading}
                    className="text-xs text-ash hover:text-starlight"
                  >
                    Remove
                  </button>
                )}
              </div>
              {avatarError && (
                <p className="text-xs text-supernova mt-1">{avatarError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement badges */}
      <section
        aria-labelledby="achievements-heading"
        className="glass rounded-2xl p-6 mb-6 animate-in animate-in-delay-1"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plasma-bright">
              Community milestones
            </p>
            <h2 id="achievements-heading" className="font-semibold text-lg text-starlight mt-1">
              Achievements
            </h2>
          </div>
          {!achievementsLoading && (
            <span className="rounded-full border border-dust/30 bg-stardust/50 px-3 py-1 text-xs text-ash">
              {achievements.filter((achievement) => achievement.earned).length} / {achievements.length} earned
            </span>
          )}
        </div>

        {achievementsError ? (
          <p role="alert" className="rounded-xl border border-supernova/20 bg-supernova/10 px-4 py-3 text-sm text-supernova">
            {achievementsError}
          </p>
        ) : achievementsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Loading achievements">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-xl border border-dust/20 bg-stardust/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((achievement) => {
              const Icon = ACHIEVEMENT_ICONS[achievement.id];
              return (
                <article
                  key={achievement.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    achievement.earned
                      ? "border-aurora/20 bg-aurora/[0.04]"
                      : "border-dust/20 bg-stardust/20 opacity-65"
                  }`}
                  aria-label={`${achievement.name}: ${achievement.earned ? "earned" : "not yet earned"}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ACHIEVEMENT_ACCENTS[achievement.id]}`}>
                    <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-starlight">
                      {achievement.name}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-ash">
                      {achievement.description}
                    </p>
                    <p className={`mt-2 text-[10px] font-medium uppercase tracking-wider ${
                      achievement.earned ? "text-aurora-bright" : "text-ash/70"
                    }`}>
                      {achievement.earned ? "Earned" : achievement.progress}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* My moderation stats — maintainer / admin only */}
      {isModerator && (
        <section
          aria-labelledby="moderation-stats-heading"
          className="glass rounded-2xl p-6 mb-6 animate-in animate-in-delay-1"
        >
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plasma-bright">
              Moderation
            </p>
            <h2 id="moderation-stats-heading" className="font-semibold text-lg text-starlight mt-1">
              My moderation stats
            </h2>
          </div>

          {moderationStatsError ? (
            <p
              role="alert"
              className="rounded-xl border border-supernova/20 bg-supernova/10 px-4 py-3 text-sm text-supernova"
            >
              {moderationStatsError}
            </p>
          ) : moderationStatsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Loading moderation stats">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-xl border border-dust/20 bg-stardust/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-dust/20 bg-stardust/30 p-4">
                  <p className="text-2xl font-semibold text-starlight">
                    {moderationStats?.approvals ?? 0}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ash">Approvals</p>
                </div>
                <div className="rounded-xl border border-dust/20 bg-stardust/30 p-4">
                  <p className="text-2xl font-semibold text-starlight">
                    {moderationStats?.rejections ?? 0}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ash">Rejections</p>
                </div>
                <div className="rounded-xl border border-dust/20 bg-stardust/30 p-4">
                  <p className="text-2xl font-semibold text-starlight">
                    {moderationStats?.delists ?? 0}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ash">Delists</p>
                </div>
                <div className="rounded-xl border border-dust/20 bg-stardust/30 p-4">
                  <p className="text-2xl font-semibold text-starlight">
                    {moderationStats?.total_actions ?? 0}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ash">Total actions</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-ash">
                {moderationStats?.last_action_at
                  ? `Last action: ${new Date(moderationStats.last_action_at).toLocaleDateString()}`
                  : "No moderation actions yet"}
              </p>
            </>
          )}
        </section>
      )}

      {/* Wallet Section */}
      <div className="glass rounded-2xl p-6 mb-6 animate-in animate-in-delay-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma/30 to-aurora/30 border border-plasma/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-starlight">Stellar Wallet</h2>
            <p className="text-xs text-ash">Connect your Freighter wallet to link your Stellar identity</p>
          </div>
        </div>

        {user.stellar_address ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-aurora/10 border border-aurora/20 rounded-xl px-4 py-2.5">
              <div className="w-2 h-2 rounded-full bg-aurora animate-pulse" />
              <span className="font-mono text-sm text-aurora-bright">
                {user.stellar_address.slice(0, 8)}...{user.stellar_address.slice(-8)}
              </span>
            </div>
            <a
              href={`https://stellar.expert/explorer/public/account/${user.stellar_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm !py-2 !px-3"
            >
              View on Stellar Expert
            </a>
          </div>
        ) : (
          <div>
            <button
              onClick={handleLinkWallet}
              disabled={walletLoading}
              className="btn-nova !py-2.5 !px-6 disabled:opacity-50"
            >
              {walletLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting...
                </span>
              ) : (
                "Connect Freighter Wallet"
              )}
            </button>
            {walletError && (
              <p className="text-sm text-supernova mt-2">{walletError}</p>
            )}
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="glass rounded-2xl p-8 animate-in animate-in-delay-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solar/30 to-nova/30 border border-solar/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--solar-bright)" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-starlight">Profile Information</h2>
            <p className="text-xs text-ash">Update your personal details and social links</p>
          </div>
        </div>

        {success && (
          <div className="bg-aurora/10 border border-aurora/20 text-aurora-bright rounded-xl px-4 py-3 text-sm mb-6">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="your_username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-moonlight">Email</label>
                <div className="input-field flex items-center text-sm text-ash cursor-not-allowed opacity-60">
                  {user.email || "No email set"}
                </div>
                <p className="text-xs text-ash/60">Email cannot be changed</p>
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Tell others about yourself and what you build on Stellar..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Social links */}
            <div className="pt-4 border-t border-dust/20">
              <h3 className="text-sm font-semibold text-moonlight uppercase tracking-wider mb-4">
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="github_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          GitHub
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://github.com/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          X (Twitter)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://x.com/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discord_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
                          </svg>
                          Discord
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="username#0000 or username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                          </svg>
                          Telegram
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://t.me/username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        <span className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          Personal Website
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://yoursite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-dust/20">
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="btn-nova !py-3 !px-8 disabled:opacity-50"
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Form>
      </div>

      {/* Maintainer Application Section */}
      {user.role === "contributor" && (
        <div className="glass rounded-2xl p-8 mt-6 animate-in animate-in-delay-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nova)" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lg text-starlight">Become a Maintainer</h2>
              <p className="text-xs text-ash">Apply for a maintainer role to help review projects</p>
            </div>
          </div>
          
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const reason = (form.elements.namedItem("reason") as HTMLTextAreaElement).value;
              if (!reason.trim()) return;
              
              const btn = form.elements.namedItem("submitBtn") as HTMLButtonElement;
              btn.disabled = true;
              btn.textContent = "Submitting...";
              
              try {
                const res = await fetch("/api/maintainer-applications", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                  },
                  body: JSON.stringify({ reason })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                alert("Application submitted successfully!");
                form.reset();
              } catch (err) {
                alert(err instanceof Error ? err.message : "Submission failed");
              } finally {
                btn.disabled = false;
                btn.textContent = "Submit Application";
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-moonlight">Why do you want to be a maintainer?</label>
              <Textarea
                name="reason"
                required
                rows={3}
                placeholder="Explain your experience and why you would be a good fit..."
                className="w-full"
              />
            </div>
            <button
              name="submitBtn"
              type="submit"
              className="btn-nova !py-2.5 !px-6"
            >
              Submit Application
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
