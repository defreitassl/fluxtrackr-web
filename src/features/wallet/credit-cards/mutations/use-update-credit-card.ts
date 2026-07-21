"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreditCard, UpdateCreditCardRequest } from "@/api/generated/client";
import { updateCreditCardData } from "@/features/wallet/credit-cards/api/update-credit-card";
import { ApiError } from "@/lib/http";

type UpdateCreditCardVariables = { id: string; payload: UpdateCreditCardRequest };

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation<CreditCard, ApiError, UpdateCreditCardVariables>({
    mutationFn: ({ id, payload }) => updateCreditCardData(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-cards"] }),
      ]);
    },
  });
}
