import { archiveCreditCard } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Arquivar é reversível na API, mas a interface não oferece reativação nesta fase. */
export async function archiveCreditCardData(id: string): Promise<{ archived: true }> {
  const response = await archiveCreditCard(id);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
