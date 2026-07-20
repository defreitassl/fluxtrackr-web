import { updateAccount, type Account, type UpdateAccountRequest } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/**
 * Envolve o `updateAccount` gerado pelo Orval mantendo o envelope HTTP fora da
 * interface: retorna apenas o `Account` atualizado e preserva o `ApiError`.
 */
export async function updateAccountData(id: string, payload: UpdateAccountRequest): Promise<Account> {
  const response = await updateAccount(id, payload);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
