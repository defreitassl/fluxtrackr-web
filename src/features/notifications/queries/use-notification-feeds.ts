"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  ListNotificationsParams,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from "@/api/generated/client";
import {
  dismissNotificationData,
  getNotificationPreferencesData,
  listActivitiesData,
  listNotificationsData,
  markAllNotificationsReadData,
  markNotificationReadData,
  updateNotificationPreferencesData,
} from "@/features/notifications/api/notifications";
import type { NotificationFilter } from "@/features/notifications/lib/notification-presentation";
import { ApiError } from "@/lib/http";

const PAGE_SIZE = 30;

function filterToParams(filter: NotificationFilter): ListNotificationsParams {
  if (filter === "unread") return { isRead: false };
  if (filter === "critical") return { severity: "critical" };
  if (filter === "all") return {};
  return { category: filter };
}

export function useNotificationsFeed(filter: NotificationFilter) {
  return useInfiniteQuery({
    queryKey: ["notifications", { filter }],
    queryFn: ({ pageParam }) =>
      listNotificationsData({
        ...filterToParams(filter),
        limit: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useActivitiesFeed() {
  return useInfiniteQuery({
    queryKey: ["activities"],
    queryFn: ({ pageParam }) =>
      listActivitiesData({ limit: PAGE_SIZE, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] }),
    ]);
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: markNotificationReadData,
    onSuccess: () => invalidate(),
  });
}

export function useDismissNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: dismissNotificationData,
    onSuccess: () => invalidate(),
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: markAllNotificationsReadData,
    onSuccess: () => invalidate(),
  });
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences, ApiError>({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferencesData,
    retry: false,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation<NotificationPreferences, ApiError, UpdateNotificationPreferencesRequest>({
    mutationFn: updateNotificationPreferencesData,
    onSuccess: (data) => {
      queryClient.setQueryData(["notification-preferences"], data);
    },
  });
}
