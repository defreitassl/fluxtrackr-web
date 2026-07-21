"use client";

import { useQuery } from "@tanstack/react-query";

import type { AccountTransfer } from "@/api/generated/client";
import { listAccountTransfersData } from "@/features/wallet/transfers/api/list-account-transfers";
import { ApiError } from "@/lib/http";

export function accountTransfersQueryKey(accountId: string) {
  return ["account-transfers", { accountId }] as const;
}

export function useAccountTransfers(accountId: string | null | undefined) {
  return useQuery<AccountTransfer[], ApiError>({
    queryKey: accountTransfersQueryKey(accountId ?? ""),
    queryFn: () => listAccountTransfersData({ accountId: accountId ?? "" }),
    enabled: Boolean(accountId),
    retry: false,
  });
}
