"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateCreditCardPurchaseRequest, CreditCardPurchase } from "@/api/generated/client";
import { createCreditCardPurchaseData } from "@/features/wallet/credit-cards/api/create-credit-card-purchase";
import { ApiError } from "@/lib/http";

export function useCreateCreditCardPurchase() {
  const queryClient = useQueryClient();

  return useMutation<CreditCardPurchase, ApiError, CreateCreditCardPurchaseRequest>({
    mutationFn: createCreditCardPurchaseData,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-card-purchases"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-card-invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["category-budget-overview"] }),
      ]);
    },
  });
}
