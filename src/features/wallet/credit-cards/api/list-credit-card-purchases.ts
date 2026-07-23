import {
  listCreditCardPurchases,
  type CreditCardPurchaseWithInstallments,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

export type CreditCardPurchasesFilters = {
  creditCardId: string;
};

/** Lista compras do cartão já acompanhadas de suas parcelas persistidas. */
export async function listCreditCardPurchasesData({
  creditCardId,
}: CreditCardPurchasesFilters): Promise<CreditCardPurchaseWithInstallments[]> {
  const response = await listCreditCardPurchases({ creditCardId });

  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data;
}
