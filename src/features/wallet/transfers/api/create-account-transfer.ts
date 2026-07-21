import {
  createAccountTransfer,
  type AccountTransfer,
  type CreateAccountTransferRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Cria a transferência sem calcular ou alterar saldos no cliente. */
export async function createAccountTransferData(
  payload: CreateAccountTransferRequest,
): Promise<AccountTransfer> {
  const response = await createAccountTransfer(payload);

  if (response.status !== 201) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
