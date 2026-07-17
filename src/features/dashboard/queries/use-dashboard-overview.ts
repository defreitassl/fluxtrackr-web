"use client";

import { useQuery } from "@tanstack/react-query";

import type { DashboardOverview } from "@/api/generated/client";
import { getDashboardOverviewData } from "@/features/dashboard/api/get-dashboard-overview";
import { ApiError } from "@/lib/http";

export const dashboardOverviewQueryKey = ["dashboard-overview"] as const;

export function useDashboardOverview() {
  return useQuery<DashboardOverview, ApiError>({
    queryKey: dashboardOverviewQueryKey,
    queryFn: () => getDashboardOverviewData(),
  });
}
