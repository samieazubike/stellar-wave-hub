"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const CATEGORIES = [
  "DeFi",
  "Payments",
  "NFT",
  "Infrastructure",
  "Gaming",
  "Social",
  "Tools",
  "DAO",
  "Identity",
  "Other",
] as const;

const submitSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
  category: z
    .string()
    .min(1, "Please select a category"),
  stellar_account_id: z
    .string()
    .regex(/^G[A-Z2-7]{55}$/, "Must be a valid Stellar account ID starting with G")
    .or(z.literal("")),
  stellar_contract_id: z
    .string()
    .regex(/^C[A-Z2-7]{55}$/, "Must be a valid Soroban contract ID starting with C")
    .or(z.literal("")),
  tags: z.string(),
  website_url: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
  github_url: z
    .string()
    .url("Please enter a valid URL")
    .refine((val) => val === "" || val.includes("github.com"), "Must be a GitHub URL")
    .or(z.literal("")),
  logo_url: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
});

type SubmitValues = z.infer<typeof submitSchema>;

export default function SubmitPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const form = useForm<SubmitValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      stellar_account_id: "",
      stellar_contract_id: "",
      tags: "",
      website_url: "",
      github_url: "",
      logo_url: "",
    },
  });

  const onSubmit = async (values: SubmitValues) => {
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/my-projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
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
          <p className="text-ash mb-6">You need to be signed in to submit a project</p>
          <Link href="/login" className="btn-nova inline-flex">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 animate-in">
        <h1 className="font-display font-bold text-3xl text-starlight mb-2">Submit a Project</h1>
        <p className="text-ash">Share your Stellar Wave project with the community</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="glass rounded-2xl p-8 space-y-6 animate-in animate-in-delay-1"
        >
          {error && (
            <div className="bg-supernova/10 border border-supernova/20 text-supernova rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Stellar Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="What does your project do? What problem does it solve?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="defi, lending, stellar (comma-separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stellar_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stellar Account ID</FormLabel>
                  <FormControl>
                    <Input className="font-mono text-sm" placeholder="G..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stellar_contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soroban Contract ID</FormLabel>
                  <FormControl>
                    <Input className="font-mono text-sm" placeholder="C..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://myproject.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="github_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://github.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://... (direct image link)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-dust/20">
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="btn-nova !py-3 !px-8 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? "Submitting..." : "Submit Project"}
            </button>
            <Link href="/explore" className="btn-ghost !py-3 !px-6">
              Cancel
            </Link>
          </div>

          <p className="text-xs text-ash">
            Your project will be reviewed by an admin before appearing publicly.
          </p>
        </form>
      </Form>
    </div>
  );
}
