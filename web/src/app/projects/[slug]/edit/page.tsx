"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
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

const editSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be under 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
  category: z.string().min(1, "Please select a category"),
  stellar_account_id: z
    .string()
    .regex(/^G[A-Z2-7]{55}$/, "Must be a valid Stellar account ID starting with G")
    .or(z.literal("")),
  stellar_contract_id: z
    .string()
    .regex(/^C[A-Z2-7]{55}$/, "Must be a valid Soroban contract ID starting with C")
    .or(z.literal("")),
  stellar_network: z.enum(["testnet", "mainnet"]),
  tags: z.string(),
  website_url: z.string().url("Please enter a valid URL").or(z.literal("")),
  logo_url: z.string().url("Please enter a valid URL").or(z.literal("")),
});

type EditValues = z.infer<typeof editSchema>;

interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  stellar_account_id?: string;
  stellar_contract_id?: string;
  stellar_network?: string;
  tags?: string;
  website_url?: string;
  github_url?: string;
  github_repos?: { label: string; url: string }[];
  logo_url?: string;
  research_images?: string[];
  user_id: number;
}

export default function EditProjectPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Repos state
  const [repos, setRepos] = useState<{ label: string; url: string }[]>([
    { label: "", url: "" },
  ]);
  const [reposError, setReposError] = useState("");

  // Research images state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [researchError, setResearchError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      stellar_account_id: "",
      stellar_contract_id: "",
      stellar_network: "mainnet",
      tags: "",
      website_url: "",
      logo_url: "",
    },
  });

  // Fetch project data
  useEffect(() => {
    if (!token || !slug) return;
    fetch(`/api/projects/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.project) {
          setError("Project not found");
          return;
        }
        const p = data.project as Project;
        setProject(p);

        form.reset({
          name: p.name || "",
          description: p.description || "",
          category: p.category || "",
          stellar_account_id: p.stellar_account_id || "",
          stellar_contract_id: p.stellar_contract_id || "",
          stellar_network: (p.stellar_network as "testnet" | "mainnet") || "mainnet",
          tags: p.tags || "",
          website_url: p.website_url || "",
          logo_url: p.logo_url || "",
        });

        if (p.github_repos && p.github_repos.length > 0) {
          setRepos(p.github_repos);
        } else if (p.github_url) {
          setRepos([{ label: "Main", url: p.github_url }]);
        }

        setExistingImages(p.research_images || []);
      })
      .catch(() => setError("Failed to load project"))
      .finally(() => setLoading(false));
  }, [token, slug, form]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length !== files.length) {
        setResearchError("Only image files are allowed");
        return;
      }
      const totalCount = existingImages.length + newFiles.length + imageFiles.length;
      if (totalCount > 10) {
        setResearchError("Maximum 10 images allowed total");
        return;
      }
      setResearchError("");
      setNewFiles((prev) => [...prev, ...imageFiles]);

      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewPreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [existingImages, newFiles],
  );

  const removeExistingImage = useCallback((index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeNewImage = useCallback((index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = async (values: EditValues) => {
    if (!project) return;
    setError("");
    setSuccess("");
    setReposError("");
    setResearchError("");

    // Validate repos
    const validRepos = repos.filter((r) => r.url.trim() !== "");
    if (validRepos.length === 0) {
      setReposError("At least one GitHub repository is required");
      return;
    }
    const invalidRepo = validRepos.find(
      (r) => !r.label.trim() || !/^https?:\/\/.*github\.com\/.+/.test(r.url.trim()),
    );
    if (invalidRepo) {
      setReposError("Each repo needs a label and a valid GitHub URL");
      return;
    }

    const totalImages = existingImages.length + newFiles.length;
    if (totalImages === 0) {
      setResearchError("At least one research image is required");
      return;
    }

    try {
      // Upload new images if any
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        uploadedUrls = uploadData.urls;
      }

      const allImages = [...existingImages, ...uploadedUrls];

      const payload = {
        ...values,
        github_repos: validRepos.map((r) => ({
          label: r.label.trim(),
          url: r.url.trim(),
        })),
        research_images: allImages,
      };

      const res = await fetch(`/api/projects/${project.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Project updated successfully!");
      setNewFiles([]);
      setNewPreviews([]);
      setTimeout(() => router.push("/my-projects"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <h2 className="font-semibold text-xl text-starlight mb-2">Sign in required</h2>
          <p className="text-ash mb-6">You need to be signed in to edit a project</p>
          <Link href="/login" className="btn-nova inline-flex">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="skeleton h-10 w-64 rounded-xl mb-4" />
        <div className="skeleton h-[600px] rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-12 text-center max-w-md">
          <h2 className="font-semibold text-xl text-starlight mb-2">Project not found</h2>
          <p className="text-ash mb-6">The project you're looking for doesn't exist</p>
          <Link href="/my-projects" className="btn-nova inline-flex">
            My Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/my-projects"
            className="text-ash hover:text-moonlight transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="font-display font-bold text-3xl text-starlight">
            Edit Project
          </h1>
        </div>
        <p className="text-ash ml-8">Update your project details</p>
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
          {success && (
            <div className="bg-aurora/10 border border-aurora/20 text-aurora rounded-xl px-4 py-3 text-sm">
              {success}
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="stellar_network"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Network</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mainnet">Mainnet (Production)</SelectItem>
                      <SelectItem value="testnet">Testnet</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-ash mt-1">
                    Select the network your smart contract or account is deployed on
                  </p>
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

            {/* GitHub Repositories */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-sm font-medium text-moonlight">
                GitHub Repositories *
              </label>
              <p className="text-xs text-ash -mt-1">
                Add one or more repos (e.g. frontend, backend, smart contract)
              </p>

              {repos.map((repo, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-36 shrink-0">
                    <Input
                      placeholder="Label"
                      value={repo.label}
                      onChange={(e) => {
                        const updated = [...repos];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setRepos(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="https://github.com/org/repo"
                      value={repo.url}
                      onChange={(e) => {
                        const updated = [...repos];
                        updated[idx] = { ...updated[idx], url: e.target.value };
                        setRepos(updated);
                      }}
                    />
                  </div>
                  {repos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRepos(repos.filter((_, i) => i !== idx))}
                      className="shrink-0 w-9 h-9 rounded-lg bg-supernova/10 hover:bg-supernova/20 text-supernova flex items-center justify-center transition-colors mt-0.5"
                      title="Remove"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}

              {repos.length < 6 && (
                <button
                  type="button"
                  onClick={() => setRepos([...repos, { label: "", url: "" }])}
                  className="text-sm text-nova-bright hover:text-nova transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add another repo
                </button>
              )}

              {reposError && <p className="text-sm text-supernova">{reposError}</p>}
            </div>

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

            {/* Research Images */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-moonlight">Research Images *</label>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div>
                  <p className="text-xs text-ash mb-2">Current images (click X to remove)</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((src, i) => (
                      <div key={`existing-${i}`} className="relative group">
                        <img
                          src={src}
                          alt={`Research ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-xl border border-dust/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-supernova/80 text-void text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="input-field flex flex-col items-center justify-center gap-2 py-8 cursor-pointer border-dashed hover:border-nova/40 transition-colors"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ash)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-ash">Click to upload more images</span>
                <span className="text-xs text-ash/60">
                  PNG, JPG, WEBP — max {10 - existingImages.length} more
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* New image previews */}
              {newPreviews.length > 0 && (
                <div>
                  <p className="text-xs text-ash mb-2">New images to upload</p>
                  <div className="flex flex-wrap gap-3">
                    {newPreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative group">
                        <img
                          src={src}
                          alt={`New ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-xl border border-nova/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-supernova/80 text-void text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {researchError && <p className="text-sm text-supernova">{researchError}</p>}
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
            <Link href="/my-projects" className="btn-ghost !py-3 !px-6">
              Cancel
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
