"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { AccountBalanceAdjustment, AccountTransfer } from "@/api/generated/client";
import {
  listAccountBalanceAdjustmentsData,
  listAccountTransfersData,
} from "@/features/wallet/history/api/account-history";
import {
  mergeAccountHistoryEntries,
  type AccountHistoryEntry,
} from "@/features/wallet/history/lib/account-history";
import { ApiError } from "@/lib/http";

const disabledAccountTransfersQueryKey = ["account-transfers", "disabled"] as const;
const disabledAccountBalanceAdjustmentsQueryKey = ["account-balance-adjustments", "disabled"] as const;

export function accountTransfersQueryKey(accountId: string) {
  return ["account-transfers", { accountId }] as const;
}

export function accountBalanceAdjustmentsQueryKey(accountId: string) {
  return ["account-balance-adjustments", { accountId }] as const;
}

export function useAccountTransfers(accountId: string | null) {
  return useQuery<AccountTransfer[], ApiError>({
    queryKey: accountId ? accountTransfersQueryKey(accountId) : disabledAccountTransfersQueryKey,
    queryFn: () => {
      if (!accountId) {
        throw new Error("O histórico de transferências requer uma conta.");
      }

      return listAccountTransfersData({ accountId });
    },
    enabled: Boolean(accountId),
    retry: false,
  });
}

export function useAccountBalanceAdjustments(accountId: string | null) {
  return useQuery<AccountBalanceAdjustment[], ApiError>({
    queryKey: accountId
      ? accountBalanceAdjustmentsQueryKey(accountId)
      : disabledAccountBalanceAdjustmentsQueryKey,
    queryFn: () => {
      if (!accountId) {
        throw new Error("O histórico de ajustes requer uma conta.");
      }

      return listAccountBalanceAdjustmentsData(accountId);
    },
    enabled: Boolean(accountId),
    retry: false,
  });
}

/** Combina consultas independentes para o drawer, sem alterar os dados da API. */
export function useAccountHistory(accountId: string | null) {
  const transfers = useAccountTransfers(accountId);
  const adjustments = useAccountBalanceAdjustments(accountId);
  const data = useMemo<AccountHistoryEntry[]>(
    () =>
      accountId
        ? mergeAccountHistoryEntries(accountId, transfers.data ?? [], adjustments.data ?? [])
        : [],
    [accountId, adjustments.data, transfers.data],
  );

  return {
    data,
    error: transfers.error ?? adjustments.error,
    isError: transfers.isError || adjustments.isError,
    isFetching: transfers.isFetching || adjustments.isFetching,
    isPending: transfers.isPending || adjustments.isPending,
    isSuccess: transfers.isSuccess && adjustments.isSuccess,
    transfers,
    adjustments,
  };
}
