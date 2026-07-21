"use client";

import { useQuery } from "@tanstack/react-query";

import type { CreditCard } from "@/api/generated/client";
import { listDashboardCreditCardsData } from "@/features/dashboard/api/get-balance-forecast";
import { ApiError } from "@/lib/http";

export function useCreditCards({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<CreditCard[], ApiError>({
    queryKey: ["credit-cards"],
    queryFn: listDashboardCreditCardsData,
    enabled,
    retry: false,
  });
}
