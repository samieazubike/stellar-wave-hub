import { z } from "zod";

export const featuredProjectSchema = z.object({
  featured: z.boolean().optional(),
});

export const rejectProjectSchema = z.object({
  reason: z.string().optional(),
});

export const delistProjectSchema = z.object({
  reason: z.string().optional(),
});

export type FeaturedProjectInput = z.infer<typeof featuredProjectSchema>;
export type RejectProjectInput = z.infer<typeof rejectProjectSchema>;
export type DelistProjectInput = z.infer<typeof delistProjectSchema>;
