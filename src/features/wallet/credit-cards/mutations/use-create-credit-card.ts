"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateCreditCardRequest, CreditCard } from "@/api/generated/client";
import { createCreditCardData } from "@/features/wallet/credit-cards/api/create-credit-card";
import { ApiError } from "@/lib/http";

export function useCreateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation<CreditCard, ApiError, CreateCreditCardRequest>({
    mutationFn: createCreditCardData,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-cards"] }),
      ]);
    },
  });
}
