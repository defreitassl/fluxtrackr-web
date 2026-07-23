"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import { useUnreadNotificationsCount } from "@/features/notifications/queries/use-unread-notifications-count";

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
