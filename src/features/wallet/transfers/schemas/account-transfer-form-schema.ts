import { z } from "zod";

import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

export const accountTransferFormSchema = z.object({
  sourceAccountId: z.string().min(1, "Selecione a conta de origem."),
  destinationAccountId: z.string().min(1, "Selecione a conta de destino."),
  amount: z
    .string()
    .refine((value) => value.trim().length > 0, { error: "Informe o valor." })
    .refine(isDecimal12_2, { error: "Use um valor de até dez dígitos inteiros e duas casas decimais." })
    .refine((value) => parseFiniteMoneyNumber(value) > 0, { error: "Informe um valor maior que zero." }),
  description: z.string(),
}).refine((value) => value.sourceAccountId !== value.destinationAccountId, {
  error: "Escolha contas diferentes para a transferência.",
  path: ["destinationAccountId"],
});

export type AccountTransferFormValues = z.infer<typeof accountTransferFormSchema>;
