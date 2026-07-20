import { createAccount, type Account, type CreateAccountRequest } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/**
 * Envolve o `createAccount` gerado pelo Orval mantendo o envelope HTTP fora da
 * interface: retorna apenas o `Account` criado e preserva o `ApiError`.
 */
export async function createAccountData(payload: CreateAccountRequest): Promise<Account> {
  const response = await createAccount(payload);

  if (response.status !== 201) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
