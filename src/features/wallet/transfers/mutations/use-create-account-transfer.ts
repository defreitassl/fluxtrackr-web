"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { AccountTransfer, CreateAccountTransferRequest } from "@/api/generated/client";
import { createAccountTransferData } from "@/features/wallet/transfers/api/create-account-transfer";
import { ApiError } from "@/lib/http";

export function useCreateAccountTransfer() {
  const queryClient = useQueryClient();

  return useMutation<AccountTransfer, ApiError, CreateAccountTransferRequest>({
    mutationFn: createAccountTransferData,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-transfers"] }),
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
      ]);
    },
  });
}
