import { archiveAccount, type ArchivedResponse } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Arquiva uma conta sem expor o envelope HTTP gerado pelo Orval. */
export async function archiveAccountData(id: string): Promise<ArchivedResponse> {
  const response = await archiveAccount(id);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
