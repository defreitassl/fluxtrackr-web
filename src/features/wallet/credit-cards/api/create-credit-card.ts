import {
  createCreditCard,
  type CreateCreditCardRequest,
  type CreditCard,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** Retorna o cartão criado, sem expor o envelope HTTP gerado pelo Orval. */
export async function createCreditCardData(payload: CreateCreditCardRequest): Promise<CreditCard> {
  const response = await createCreditCard(payload);

  if (response.status !== 201) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
