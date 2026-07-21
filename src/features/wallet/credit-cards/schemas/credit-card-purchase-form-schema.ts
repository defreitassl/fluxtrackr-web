import { z } from "zod";

import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

function isInstallmentCount(value: string) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 1 && count <= 120;
}

export const creditCardPurchaseFormSchema = z.object({
  creditCardId: z.string().min(1, { error: "Selecione um cartão ativo." }),
  categoryId: z.string(),
  description: z.string().refine((value) => value.trim().length > 0, {
    error: "Informe uma descrição para a compra.",
  }),
  totalAmount: z
    .string()
    .refine((value) => value.trim().length > 0, { error: "Informe o valor total." })
    .refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." })
    .refine((value) => parseFiniteMoneyNumber(value) > 0, {
      error: "Informe um valor maior que zero.",
    }),
  purchaseDate: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
    error: "Informe uma data e hora válidas.",
  }),
  installmentCount: z.string().refine(isInstallmentCount, {
    error: "Informe entre 1 e 120 parcelas.",
  }),
});

export type CreditCardPurchaseFormValues = z.infer<typeof creditCardPurchaseFormSchema>;
