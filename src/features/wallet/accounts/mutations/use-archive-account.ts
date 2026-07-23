"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ArchivedResponse } from "@/api/generated/client";
import { archiveAccountData } from "@/features/wallet/accounts/api/archive-account";
import { ApiError } from "@/lib/http";

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation<ArchivedResponse, ApiError, string>({
    mutationFn: archiveAccountData,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["transaction-accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["balance-forecast"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
      ]);
    },
  });
}
