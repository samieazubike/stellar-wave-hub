import { z } from "zod";

const emptyToNull = (value: unknown) => (value === "" || value === undefined ? null : value);

export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Promo code is required")
    .max(32, "Promo code must be 32 characters or fewer")
    .regex(/^[A-Za-z0-9_-]+$/, "Promo code may only contain letters, numbers, - and _")
    .transform((code) => code.toUpperCase()),
  percent_off: z.coerce
    .number()
    .gt(0, "percent_off must be between 1 and 100")
    .max(100, "percent_off must be between 1 and 100"),
  max_uses: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable()),
  expires_at: z.preprocess(emptyToNull, z.string().datetime({ offset: true }).nullable()),
});

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
