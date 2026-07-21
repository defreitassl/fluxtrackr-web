import {
  updateCreditCard,
  type CreditCard,
  type UpdateCreditCardRequest,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Retorna somente o cartão atualizado pelo endpoint de edição. */
export async function updateCreditCardData(
  id: string,
  payload: UpdateCreditCardRequest,
): Promise<CreditCard> {
  const response = await updateCreditCard(id, payload);

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
