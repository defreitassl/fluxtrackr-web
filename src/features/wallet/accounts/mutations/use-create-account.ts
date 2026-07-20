"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Account, CreateAccountRequest } from "@/api/generated/client";
import { createAccountData } from "@/features/wallet/accounts/api/create-account";
import { ApiError } from "@/lib/http";

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation<Account, ApiError, CreateAccountRequest>({
    mutationFn: createAccountData,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
      ]);
    },
  });
}
