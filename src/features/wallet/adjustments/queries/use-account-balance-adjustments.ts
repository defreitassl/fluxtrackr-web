"use client";

import { useQuery } from "@tanstack/react-query";

import type { AccountBalanceAdjustment } from "@/api/generated/client";
import { listBalanceAdjustmentsData } from "@/features/wallet/adjustments/api/list-balance-adjustments";
import { ApiError } from "@/lib/http";

export function accountBalanceAdjustmentsQueryKey(accountId: string) {
  return ["account-balance-adjustments", accountId] as const;
}

export function useAccountBalanceAdjustments(accountId: string | null | undefined) {
  return useQuery<AccountBalanceAdjustment[], ApiError>({
    queryKey: accountBalanceAdjustmentsQueryKey(accountId ?? ""),
    queryFn: () => listBalanceAdjustmentsData(accountId ?? ""),
    enabled: Boolean(accountId),
    retry: false,
  });
}
