import type { Account, CreateAccountRequest, UpdateAccountRequest } from "@/api/generated/client";
import {
  ACCOUNT_ICON_OPTIONS,
  HEX_COLOR_PATTERN,
  type CreateAccountFormValues,
  type EditAccountFormValues,
  type AccountIconValue,
} from "@/features/wallet/accounts/schemas/account-form-schema";
import { parseFiniteMoneyNumber } from "@/lib/money-input";

const ICON_VALUES = new Set<string>(ACCOUNT_ICON_OPTIONS.map((option) => option.value));

function normalizeIcon(icon: string | null): AccountIconValue | "" {
  return icon && ICON_VALUES.has(icon) ? (icon as AccountIconValue) : "";
}

function normalizeColor(color: string | null): string {
  return color && HEX_COLOR_PATTERN.test(color) ? color : "";
}

export function defaultCreateAccountFormValues(): CreateAccountFormValues {
  return { name: "", bank: "", type: "checking", color: "", icon: "", initialBalance: "" };
}

export function toEditAccountFormValues(account: Account): EditAccountFormValues {
  return {
    name: account.name,
    bank: account.bank ?? "",
    type: account.type,
    color: normalizeColor(account.color),
    icon: normalizeIcon(account.icon),
  };
}

export function toCreateAccountPayload(values: CreateAccountFormValues): CreateAccountRequest {
  const bank = values.bank.trim();
  const color = values.color.trim();

  return {
    name: values.name.trim(),
    type: values.type,
    initialBalance: parseFiniteMoneyNumber(values.initialBalance),
    ...(bank ? { bank } : {}),
    ...(color ? { color } : {}),
    ...(values.icon ? { icon: values.icon } : {}),
  };
}

export function toUpdateAccountPayload(values: EditAccountFormValues): UpdateAccountRequest {
  const bank = values.bank.trim();
  const color = values.color.trim();

  // Metadados apenas: `initialBalance` nunca é enviado pela tela de edição.
  return {
    name: values.name.trim(),
    type: values.type,
    bank: bank ? bank : null,
    color: color ? color : null,
    icon: values.icon ? values.icon : null,
  };
}
