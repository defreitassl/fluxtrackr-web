import {
  listAccountBalanceAdjustments,
  type AccountBalanceAdjustment,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Mantém a ordem decrescente retornada pela API. */
export async function listBalanceAdjustmentsData(
  accountId: string,
): Promise<AccountBalanceAdjustment[]> {
  const response = await listAccountBalanceAdjustments(accountId);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
