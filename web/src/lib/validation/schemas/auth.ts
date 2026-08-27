import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z
  .object({
    username: z.string().optional(),
    bio: z.string().nullable().optional(),
    stellar_address: z.string().nullable().optional(),
    github_url: z.string().nullable().optional(),
    twitter_url: z.string().nullable().optional(),
    discord_username: z.string().nullable().optional(),
    telegram_url: z.string().nullable().optional(),
    website_url: z.string().nullable().optional(),
  })
  .refine(
    (body) =>
      Object.keys(body).some(
        (key) => body[key as keyof typeof body] !== undefined,
      ),
    { message: "No fields to update", path: ["body"] },
  );

export const walletAuthSchema = z.object({
  publicKey: z.string().min(1, "publicKey is required"),
  signedXdr: z.string().min(1, "signedXdr is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type WalletAuthInput = z.infer<typeof walletAuthSchema>;
