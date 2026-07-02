import { z } from "zod";

const githubRepoSchema = z.object({
  label: z.string(),
  url: z.string(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  stellar_account_id: z.string().nullable().optional(),
  stellar_contract_id: z.string().nullable().optional(),
  stellar_network: z.enum(["testnet", "mainnet"]).optional(),
  tags: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  github_url: z.string().nullable().optional(),
  github_repos: z.array(githubRepoSchema).optional(),
  logo_url: z.string().nullable().optional(),
  research_images: z.array(z.string()).optional(),
});

export const editProjectSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    stellar_account_id: z.string().nullable().optional(),
    stellar_contract_id: z.string().nullable().optional(),
    stellar_network: z.string().optional(),
    tags: z.string().nullable().optional(),
    website_url: z.string().nullable().optional(),
    github_url: z.string().nullable().optional(),
    github_repos: z.array(githubRepoSchema).optional(),
    logo_url: z.string().nullable().optional(),
    research_images: z.array(z.string()).optional(),
  })
  .refine(
    (body) =>
      Object.keys(body).some(
        (key) => body[key as keyof typeof body] !== undefined,
      ),
    { message: "No fields to update", path: ["body"] },
  );

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type EditProjectInput = z.infer<typeof editProjectSchema>;
