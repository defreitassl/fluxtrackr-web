import { z } from "zod";

import { AccountType } from "@/api/generated/client";
import { normalizeDecimalInput, parseFiniteMoneyNumber } from "@/lib/money-input";

/** Ícones conhecidos pelo frontend (nunca importados dinamicamente). */
export const ACCOUNT_ICON_OPTIONS = [
  { value: "landmark", label: "Banco" },
  { value: "piggy-bank", label: "Poupança" },
  { value: "wallet", label: "Carteira" },
  { value: "cash", label: "Dinheiro" },
  { value: "investment", label: "Investimento" },
  { value: "other", label: "Outro" },
] as const;

export type AccountIconValue = (typeof ACCOUNT_ICON_OPTIONS)[number]["value"];

const ACCOUNT_ICON_VALUES = ACCOUNT_ICON_OPTIONS.map((option) => option.value) as [
  AccountIconValue,
  ...AccountIconValue[],
];

/** Pequena lista de cores válidas para os acentos das contas. */
export const ACCOUNT_COLOR_OPTIONS = [
  { value: "#197147", label: "Verde" },
  { value: "#2563eb", label: "Azul" },
  { value: "#7c3aed", label: "Roxo" },
  { value: "#dc2626", label: "Vermelho" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#0d9488", label: "Turquesa" },
] as const;

export const HEX_COLOR_PATTERN = /^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/;
/** Aceita 1000, 1000,50, 1000.50, -250, -250,75, 0 — no máximo duas casas. */
const accountTypeValues = Object.values(AccountType) as [AccountType, ...AccountType[]];

const nameField = z.string().refine((value) => value.trim().length > 0, {
  error: "Informe um nome para a conta.",
});

const bankField = z.string().refine((value) => value.length === 0 || value.trim().length > 0, {
  error: "Informe um banco válido ou deixe o campo vazio.",
});

const typeField = z.enum(accountTypeValues, { error: "Selecione um tipo de conta." });

const colorField = z.union([
  z.literal(""),
  z.string().regex(HEX_COLOR_PATTERN, { error: "Selecione uma cor válida." }),
]);

const iconField = z.union([z.literal(""), z.enum(ACCOUNT_ICON_VALUES)]);

const initialBalanceField = z
  .string()
  .refine((value) => value.trim().length > 0, { error: "Informe o saldo inicial." })
  .refine((value) => normalizeDecimalInput(value).length > 0, {
    error: "Use um número com no máximo duas casas decimais.",
  })
  .refine((value) => Number.isFinite(parseFiniteMoneyNumber(value)), {
    error: "Use um saldo inicial finito.",
  });

export const accountMetadataSchema = z.object({
  name: nameField,
  bank: bankField,
  type: typeField,
  color: colorField,
  icon: iconField,
});

export const createAccountFormSchema = accountMetadataSchema.extend({
  initialBalance: initialBalanceField,
});

export const editAccountFormSchema = accountMetadataSchema;

export type AccountMetadataFormValues = z.infer<typeof accountMetadataSchema>;
export type CreateAccountFormValues = z.infer<typeof createAccountFormSchema>;
export type EditAccountFormValues = z.infer<typeof editAccountFormSchema>;
