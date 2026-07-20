"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CreateBalanceAdjustmentRequest,
  CreateBalanceAdjustmentResponse,
} from "@/api/generated/client";
import { createBalanceAdjustmentData } from "@/features/wallet/adjustments/api/create-balance-adjustment";
import { accountBalanceAdjustmentsQueryKey } from "@/features/wallet/adjustments/queries/use-account-balance-adjustments";
import { ApiError } from "@/lib/http";

export type CreateBalanceAdjustmentVariables = {
  accountId: string;
  payload: CreateBalanceAdjustmentRequest;
};

export function useCreateBalanceAdjustment() {
  const queryClient = useQueryClient();

  return useMutation<CreateBalanceAdjustmentResponse, ApiError, CreateBalanceAdjustmentVariables>({
    mutationFn: ({ accountId, payload }) => createBalanceAdjustmentData(accountId, payload),
    onSuccess: async (_response, { accountId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountBalanceAdjustmentsQueryKey(accountId) }),
        queryClient.invalidateQueries({ queryKey: ["wallet-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["financial-timeline"] }),
      ]);
    },
  });
}
