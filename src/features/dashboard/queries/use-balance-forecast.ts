"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { BalanceForecast } from "@/api/generated/client";
import { getBalanceForecastData } from "@/features/dashboard/api/get-balance-forecast";
import { ApiError } from "@/lib/http";

export function balanceForecastQueryKey(horizonDays: number) {
  return ["balance-forecast", { horizonDays }] as const;
}

export function useBalanceForecast(horizonDays: number) {
  return useQuery<BalanceForecast, ApiError>({
    queryKey: balanceForecastQueryKey(horizonDays),
    queryFn: () => getBalanceForecastData({ horizonDays }),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
