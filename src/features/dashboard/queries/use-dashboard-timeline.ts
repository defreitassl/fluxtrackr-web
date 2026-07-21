"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { FinancialTimeline } from "@/api/generated/client";
import { getFinancialTimelineData } from "@/features/timeline/api/get-financial-timeline";
import { ApiError } from "@/lib/http";

type TimelineWindow = {
  startDate: string;
  endDate: string;
};

export function dashboardTimelineQueryKey(window: TimelineWindow) {
  return ["dashboard-timeline", window] as const;
}

export function useDashboardTimeline(window: TimelineWindow) {
  return useQuery<FinancialTimeline, ApiError>({
    queryKey: dashboardTimelineQueryKey(window),
    queryFn: () =>
      getFinancialTimelineData({
        startDate: window.startDate,
        endDate: window.endDate,
        includeCanceled: false,
      }),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function monthWindow(year: number, month: number): TimelineWindow {
  const startDate = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const endDate = new Date(Date.UTC(year, month, 1) - 1).toISOString();
  return { startDate, endDate };
}
