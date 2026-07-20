import {
  createAccountBalanceAdjustment,
  type CreateBalanceAdjustmentRequest,
  type CreateBalanceAdjustmentResponse,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Retorna somente o ajuste criado pelo endpoint `201`, preservando ApiError. */
export async function createBalanceAdjustmentData(
  accountId: string,
  payload: CreateBalanceAdjustmentRequest,
): Promise<CreateBalanceAdjustmentResponse> {
  const response = await createAccountBalanceAdjustment(accountId, payload);

  if (response.status !== 201) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
