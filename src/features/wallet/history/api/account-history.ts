import {
  listAccountBalanceAdjustments,
  listAccountTransfers,
  type AccountBalanceAdjustment,
  type AccountTransfer,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

export type AccountTransfersFilters = {
  accountId: string;
};

/** Lista transferências em que a conta é origem ou destino. */
export async function listAccountTransfersData({ accountId }: AccountTransfersFilters): Promise<AccountTransfer[]> {
  const response = await listAccountTransfers({ accountId });

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}

/** Lista os snapshots de ajustes sem recalcular nenhum saldo no cliente. */
export async function listAccountBalanceAdjustmentsData(
  accountId: string,
): Promise<AccountBalanceAdjustment[]> {
  const response = await listAccountBalanceAdjustments(accountId);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
