import { z } from "zod";

import { normalizeDecimalInput } from "@/lib/money-input";

export const balanceAdjustmentFormSchema = z.object({
  newBalance: z
    .string()
    .refine((value) => value.trim().length > 0, { error: "Informe o novo saldo." })
    .refine((value) => normalizeDecimalInput(value).length > 0, {
      error: "Use um número com no máximo duas casas decimais.",
    }),
  reason: z.string(),
});

export type BalanceAdjustmentFormValues = z.infer<typeof balanceAdjustmentFormSchema>;
