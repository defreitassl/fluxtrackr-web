import {
  listAccountTransfers,
  type AccountTransfer,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Mantém a ordem decrescente retornada pela API. */
export async function listAccountTransfersData({ accountId }: { accountId: string }): Promise<AccountTransfer[]> {
  const response = await listAccountTransfers({ accountId });

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
