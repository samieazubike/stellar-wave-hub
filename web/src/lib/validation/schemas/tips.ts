import { z } from "zod";

export const createTipSchema = z.object({
  /** ID of the project being tipped. */
  project_id: z.coerce
    .number()
    .int()
    .positive("project_id is required"),

  /**
   * The Stellar transaction hash produced by payWithFreighter().
   * Must be a 64-character hex string.
   */
  tx_hash: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{64}$/, "tx_hash must be a valid 64-character hex transaction hash"),
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
