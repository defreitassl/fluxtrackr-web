import type { CreateBalanceAdjustmentRequest } from "@/api/generated/client";
import type { BalanceAdjustmentFormValues } from "@/features/wallet/adjustments/schemas/balance-adjustment-form-schema";
import { normalizeDecimalInput } from "@/lib/money-input";

export function toCreateBalanceAdjustmentPayload(
  values: BalanceAdjustmentFormValues,
): CreateBalanceAdjustmentRequest {
  const reason = values.reason.trim();

  return {
    newBalance: normalizeDecimalInput(values.newBalance),
    ...(reason ? { reason } : {}),
  };
}
