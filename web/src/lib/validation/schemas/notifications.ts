import { z } from "zod";

export const markNotificationsReadSchema = z.object({
  ids: z
    .array(z.union([z.string().min(1), z.number().int().positive()]).transform(String))
    .min(1, "ids is required")
    .max(100, "At most 100 notifications at a time"),
});
