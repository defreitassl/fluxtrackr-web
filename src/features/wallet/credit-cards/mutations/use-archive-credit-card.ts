"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { archiveCreditCardData } from "@/features/wallet/credit-cards/api/archive-credit-card";
import { ApiError } from "@/lib/http";

export function useArchiveCreditCard() {
  const queryClient = useQueryClient();

  return useMutation<{ archived: true }, ApiError, string>({
    mutationFn: archiveCreditCardData,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["credit-cards"] }),
      ]);
    },
  });
}
