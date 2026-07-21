import { listCreditCards, type CreditCard } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Fonte independente para usos reutilizáveis, como o diálogo de compra. */
export async function listActiveCreditCardsData(): Promise<CreditCard[]> {
  const response = await listCreditCards({ isActive: true });

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
