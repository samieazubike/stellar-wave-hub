import { z } from "zod";

export const createNoteSchema = z.object({
  body: z.string().min(1, "Note body is required").max(4000, "Note body must be 4000 characters or fewer"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
