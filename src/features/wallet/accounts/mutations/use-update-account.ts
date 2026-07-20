"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Account, UpdateAccountRequest } from "@/api/generated/client";
import { updateAccountData } from "@/features/wallet/accounts/api/update-account";
import { ApiError } from "@/lib/http";

export type UpdateAccountVariables = {
  id: string;
  payload: UpdateAccountRequest;
};

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation<Account, ApiError, UpdateAccountVariables>({
    mutationFn: ({ id, payload }) => updateAccountData(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
      ]);
    },
  });
}
