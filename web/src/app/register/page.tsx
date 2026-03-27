"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister, connectWallet } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setError("");
    try {
      await authRegister(values.username, values.email, values.password);
      router.push("/explore");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const handleWallet = async () => {
    setError("");
    setWalletLoading(true);
    try {
      await connectWallet();
      router.push("/explore");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
    setWalletLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-plasma to-aurora flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-starlight">Join the Wave</h1>
          <p className="text-ash mt-2">Create your account to submit and rate projects</p>
        </div>

        <div className="space-y-4 animate-in animate-in-delay-1">
          {error && (
            <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Wallet Connect */}
          <button
            onClick={handleWallet}
            disabled={walletLoading}
            className="w-full glass glass-hover rounded-2xl p-4 flex items-center justify-center gap-3 transition-all disabled:opacity-50 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-plasma/30 to-aurora/30 border border-plasma/20 flex items-center justify-center group-hover:from-plasma/40 group-hover:to-aurora/40 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--plasma-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-starlight text-sm">
                {walletLoading ? "Connecting..." : "Sign up with Stellar Wallet"}
              </p>
              <p className="text-xs text-ash">One-click signup with Freighter</p>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-dust/30" />
            <span className="text-xs text-ash uppercase tracking-wider">or register with email</span>
            <div className="flex-1 h-px bg-dust/30" />
          </div>

          {/* Email form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="glass rounded-2xl p-8 space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="stellarbuilder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 6 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="btn-nova w-full !py-3 text-center disabled:opacity-50"
              >
                {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
              </button>

              <p className="text-center text-sm text-ash">
                Already have an account?{" "}
                <Link href="/login" className="text-nova-bright hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
