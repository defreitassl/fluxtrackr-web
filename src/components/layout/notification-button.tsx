"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

import { getUnreadNotificationsCount, type UnreadCount } from "@/api/generated/client";
import { ApiError } from "@/lib/http";

function useUnreadNotificationsCount() {
  return useQuery<UnreadCount, ApiError>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await getUnreadNotificationsCount();
      if (response.status !== 200) {
        throw new ApiError(response.status, response.data);
      }
      return response.data;
    },
    retry: false,
  });
}

export function NotificationButton() {
  const { data } = useUnreadNotificationsCount();
  const hasUnread = (data?.unreadCount ?? 0) > 0;

  return (
    <Link aria-label="Abrir notificações" className="icon-button" href="/notifications">
      <Bell aria-hidden="true" size={18} />
      {hasUnread ? <span className="notification-dot" aria-hidden="true" /> : null}
    </Link>
  );
}
