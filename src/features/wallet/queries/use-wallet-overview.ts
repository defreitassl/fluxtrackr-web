"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getWalletOverview, type GetWalletOverviewParams, type WalletOverview } from "@/features/wallet/api/get-wallet-overview";
import { ApiError } from "@/lib/http";

export function walletOverviewQueryKey(params: GetWalletOverviewParams) {
  return ["wallet-overview", params] as const;
}

export function useWalletOverview(params: GetWalletOverviewParams) {
  return useQuery<WalletOverview, ApiError>({
    queryKey: walletOverviewQueryKey(params),
    queryFn: () => getWalletOverview(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
