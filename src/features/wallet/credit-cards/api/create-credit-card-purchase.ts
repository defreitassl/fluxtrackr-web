import {
  createCreditCardPurchase,
  type CreateCreditCardPurchaseRequest,
  type CreditCardPurchase,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

/** A API é responsável por gerar parcelas e faturas; o cliente só cria a compra. */
export async function createCreditCardPurchaseData(
  payload: CreateCreditCardPurchaseRequest,
): Promise<CreditCardPurchase> {
  const response = await createCreditCardPurchase(payload);

  if (response.status !== 201) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
