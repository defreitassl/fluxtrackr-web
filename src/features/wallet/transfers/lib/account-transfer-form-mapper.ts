import type { CreateAccountTransferRequest } from "@/api/generated/client";
import type { AccountTransferFormValues } from "@/features/wallet/transfers/schemas/account-transfer-form-schema";
import { normalizeDecimalInput } from "@/lib/money-input";

export function toCreateAccountTransferPayload(
  values: AccountTransferFormValues,
): CreateAccountTransferRequest {
  const description = values.description.trim();

  return {
    sourceAccountId: values.sourceAccountId,
    destinationAccountId: values.destinationAccountId,
    amount: normalizeDecimalInput(values.amount),
    ...(description ? { description } : {}),
  };
}
