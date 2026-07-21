import { z } from "zod";

import { HEX_COLOR_PATTERN } from "@/features/wallet/accounts/schemas/account-form-schema";
import { isDecimal12_2, parseFiniteMoneyNumber } from "@/lib/money-input";

function isOptionalDay(value: string) {
  if (value === "") {
    return true;
  }

  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

function isRequiredDay(value: string) {
  return value !== "" && isOptionalDay(value);
}

const moneyField = z
  .string()
  .refine((value) => value.trim().length > 0, { error: "Informe o limite do cartão." })
  .refine(isDecimal12_2, { error: "Use um valor com no máximo duas casas decimais." })
  .refine((value) => parseFiniteMoneyNumber(value) >= 0, {
    error: "O limite não pode ser negativo.",
  });

export const creditCardFormSchema = z.object({
  accountId: z.string(),
  name: z.string().refine((value) => value.trim().length > 0, {
    error: "Informe um nome para o cartão.",
  }),
  bankName: z.string().refine((value) => value === "" || value.trim().length > 0, {
    error: "Informe um banco válido ou deixe o campo vazio.",
  }),
  brand: z.string().refine((value) => value === "" || value.trim().length > 0, {
    error: "Informe uma bandeira válida ou deixe o campo vazio.",
  }),
  lastFourDigits: z.string().refine((value) => value === "" || /^\d{4}$/.test(value), {
    error: "Informe exatamente os quatro últimos dígitos.",
  }),
  limitAmount: moneyField,
  closingDay: z.string().refine(isOptionalDay, {
    error: "Informe um dia entre 1 e 31 ou deixe o campo vazio.",
  }),
  dueDay: z.string().refine(isRequiredDay, { error: "Informe o dia de vencimento entre 1 e 31." }),
  color: z.union([
    z.literal(""),
    z.string().regex(HEX_COLOR_PATTERN, { error: "Use uma cor hexadecimal válida." }),
  ]),
});

export type CreditCardFormValues = z.infer<typeof creditCardFormSchema>;
