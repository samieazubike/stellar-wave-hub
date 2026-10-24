"use client";

import { useEffect, useState } from "react";
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
      </div>

      {/* Achievement badges */}
      <section
        aria-labelledby=
