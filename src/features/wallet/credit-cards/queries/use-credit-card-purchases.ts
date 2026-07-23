"use client";

import { useQuery } from "@tanstack/react-query";

import type { CreditCardPurchaseWithInstallments } from "@/api/generated/client";
import { listCreditCardPurchasesData } from "@/features/wallet/credit-cards/api/list-credit-card-purchases";
import { ApiError } from "@/lib/http";

const disabledCreditCardPurchasesQueryKey = ["credit-card-purchases", "disabled"] as const;

export function creditCardPurchasesQueryKey(creditCardId: string) {
  return ["credit-card-purchases", { creditCardId }] as const;
}

export function useCreditCardPurchases(creditCardId: string | null) {
  return useQuery<CreditCardPurchaseWithInstallments[], ApiError>({
    queryKey: creditCardId
      ? creditCardPurchasesQueryKey(creditCardId)
      : disabledCreditCardPurchasesQueryKey,
    queryFn: () => {
      if (!creditCardId) {
        throw new Error("A lista de compras requer um cartão.");
      }

      return listCreditCardPurchasesData({ creditCardId });
    },
    enabled: Boolean(creditCardId),
    retry: false,
  });
}
