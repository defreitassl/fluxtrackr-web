"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDown, BellOff, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { createElement, useEffect, useMemo, useRef, useState } from "react";

import { getUnreadNotificationsCount, type Notification, type UnreadCount } from "@/api/generated/client";
import { NotificationCard } from "@/features/notifications/components/notification-card";
import { NotificationsRail } from "@/features/notifications/components/notifications-rail";
import {
  activityFilterChips,
  activityIcon,
  activitySourceLabel,
  groupByDate,
  matchesActivityFilter,
  notificationFilterChips,
  notificationHref,
  timeLabel,
  type ActivityFilter,
  type NotificationFilter,
} from "@/features/notifications/lib/notification-presentation";
import {
  useActivitiesFeed,
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsFeed,
} from "@/features/notifications/queries/use-notification-feeds";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/http";
import { useGlobalSearch } from "@/providers/search-provider";

type Tab = "notifications" | "activities";

type Toast = { title: string; text: string } | null;

export function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("notifications");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { query: search } = useGlobalSearch();

  const notifications = useNotificationsFeed(filter);
  const activities = useActivitiesFeed();
  const unread = useQuery<UnreadCount, ApiError>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await getUnreadNotificationsCount();
      if (response.status !== 200) throw new ApiError(response.status, response.data);
      return response.data;
    },
    retry: false,
  });

  const markRead = useMarkNotificationRead();
  const dismiss = useDismissNotification();
  const markAll = useMarkAllNotificationsRead();
  const markAllMutate = markAll.mutate;

  function showToast(title: string, text: string) {
    setToast({ title, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    function readAll() {
      markAllMutate(undefined, {
        onSuccess: ({ updatedCount }) =>
          showToast(
            "Notificações lidas",
            updatedCount > 0
              ? `${updatedCount} ${updatedCount === 1 ? "notificação marcada" : "notificações marcadas"} como lida.`
              : "Nenhuma notificação pendente.",
          ),
      });
    }
    window.addEventListener("fluxtrackr:notifications-read-all", readAll);
    return () => window.removeEventListener("fluxtrackr:notifications-read-all", readAll);
  }, [markAllMutate]);

  const term = search.trim().toLowerCase();

  const notificationItems = useMemo(() => {
    const items = (notifications.data?.pages ?? []).flatMap((page) => page.items);
    if (!term) return items;
    return items.filter((item) => `${item.title} ${item.message}`.toLowerCase().includes(term));
  }, [notifications.data, term]);

  const activityItems = useMemo(() => {
    const items = (activities.data?.pages ?? []).flatMap((page) => page.items);
    return items.filter(
      (item) =>
        matchesActivityFilter(item, activityFilter) &&
        (!term || `${item.title} ${item.description ?? ""}`.toLowerCase().includes(term)),
    );
  }, [activities.data, activityFilter, term]);

  const criticalCount = useMemo(() => {
    const items = (notifications.data?.pages ?? []).flatMap((page) => page.items);
    return items.filter((item) => item.severity === "critical").length;
  }, [notifications.data]);

  function openNotification(notification: Notification) {
    if (notification.readAt === null) {
      markRead.mutate(notification.id);
    }
    showToast("Abrindo origem", notification.title);
    router.push(notificationHref(notification));
  }

  function handleMarkRead(notification: Notification) {
    markRead.mutate(notification.id, {
      onSuccess: () => showToast("Marcada como lida", notification.title),
    });
  }

  function handleDismiss(notification: Notification) {
    dismiss.mutate(notification.id, {
      onSuccess: () => showToast("Notificação dispensada", notification.title),
    });
  }

  const activeFeed = tab === "notifications" ? notifications : activities;

  return (
    <section className="nfx-screen" aria-label="Notificações e atividades">
      <div className="tlx-toolbar">
        <div className="tlx-toolbar-lead">
          <div className="tlx-view-switch" role="group" aria-label="Seção">
            <button
              aria-pressed={tab === "notifications"}
              onClick={() => setTab("notifications")}
              type="button"
            >
              Notificações
            </button>
            <button aria-pressed={tab === "activities"} onClick={() => setTab("activities")} type="button">
              Atividades
            </button>
          </div>
          <span className="tlx-toolbar-divider" aria-hidden="true" />
          {tab === "notifications"
            ? notificationFilterChips.map((chip) => (
                <button
                  aria-pressed={filter === chip.key}
                  className="txx-chip"
                  key={chip.key}
                  onClick={() => setFilter(chip.key)}
                  type="button"
                >
                  {chip.label}
                </button>
              ))
            : activityFilterChips.map((chip) => (
                <button
                  aria-pressed={activityFilter === chip.key}
                  className="txx-chip"
                  key={chip.key}
                  onClick={() => setActivityFilter(chip.key)}
                  type="button"
                >
                  {chip.label}
                </button>
              ))}
        </div>
        <span className="cgx-count">
          {tab === "notifications"
            ? `${notificationItems.length} ${notificationItems.length === 1 ? "notificação" : "notificações"}`
            : `${activityItems.length} ${activityItems.length === 1 ? "atividade" : "atividades"}`}
        </span>
      </div>

      <div className="nfx-body">
        <div className="nfx-main">
          <div className="nfx-list">
            {activeFeed.isPending ? (
              <div aria-busy="true" aria-label="Carregando" className="nfx-skeleton" role="status">
                <span />
                <span />
                <span />
                <span />
              </div>
            ) : null}

            {activeFeed.isError && !activeFeed.data ? (
              <div className="tlx-state" role="alert">
                <div>
                  <span className="tlx-state-icon tlx-tone-red">
                    <TriangleAlert aria-hidden="true" size={24} />
                  </span>
                  <strong>Falha ao carregar a central</strong>
                  <p>Verifique a conexão e tente novamente.</p>
                  <button
                    className="tlx-state-retry"
                    onClick={() => activeFeed.refetch()}
                    type="button"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            ) : null}

            {tab === "notifications" && notifications.data ? (
              notificationItems.length === 0 ? (
                <div className="nfx-empty">
                  <BellOff aria-hidden="true" size={18} style={{ marginBottom: 6 }} />
                  <br />
                  Nenhuma notificação encontrada neste filtro.
                </div>
              ) : (
                <>
                  {groupByDate(notificationItems, (item) => item.createdAt).map((group) => (
                    <section className="nfx-group" key={group.label}>
                      <div className="nfx-group-head">
                        <strong>{group.label}</strong>
                        <span>
                          {group.items.length} {group.items.length === 1 ? "item" : "itens"}
                        </span>
                      </div>
                      <div className="nfx-items">
                        {group.items.map((notification) => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onDismiss={handleDismiss}
                            onMarkRead={handleMarkRead}
                            onOpen={openNotification}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                  {notifications.hasNextPage ? (
                    <button
                      className="nfx-load-more"
                      disabled={notifications.isFetchingNextPage}
                      onClick={() => notifications.fetchNextPage()}
                      type="button"
                    >
                      <span className="nfx-load-more-icon">
                        <ArrowDown aria-hidden="true" size={16} />
                      </span>
                      <span>
                        <strong>
                          {notifications.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
                        </strong>
                        <small>Buscar notificações anteriores.</small>
                      </span>
                    </button>
                  ) : null}
                </>
              )
            ) : null}

            {tab === "activities" && activities.data ? (
              activityItems.length === 0 ? (
                <div className="nfx-empty">Nenhuma atividade encontrada neste filtro.</div>
              ) : (
                <>
                  {groupByDate(activityItems, (item) => item.occurredAt).map((group) => (
                    <section className="nfx-group" key={group.label}>
                      <div className="nfx-group-head">
                        <strong>{group.label}</strong>
                        <span>
                          {group.items.length} {group.items.length === 1 ? "ação" : "ações"}
                        </span>
                      </div>
                      <div className="nfx-items">
                        {group.items.map((activity) => {
                          return (
                            <article className="nfx-activity" key={activity.id}>
                              <span className="nfx-activity-icon">
                                {createElement(activityIcon(activity), { "aria-hidden": true, size: 17 })}
                              </span>
                              <div className="nfx-activity-copy">
                                <strong>{activity.title}</strong>
                                {activity.description ? <span>{activity.description}</span> : null}
                                <div className="nfx-activity-meta">
                                  <i>{timeLabel(activity.occurredAt)}</i>
                                  <i>{activitySourceLabel(activity)}</i>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                  {activities.hasNextPage ? (
                    <button
                      className="nfx-load-more"
                      data-armed={activities.isFetchingNextPage || undefined}
                      disabled={activities.isFetchingNextPage}
                      onClick={() => activities.fetchNextPage()}
                      type="button"
                    >
                      <span className="nfx-load-more-icon">
                        <ArrowDown aria-hidden="true" size={16} />
                      </span>
                      <span>
                        <strong>{activities.isFetchingNextPage ? "Carregando…" : "Carregar mais"}</strong>
                        <small>Buscar o próximo lote do histórico.</small>
                      </span>
                    </button>
                  ) : (
                    <div className="nfx-load-complete">
                      Todas as atividades disponíveis foram carregadas.
                    </div>
                  )}
                </>
              )
            ) : null}
          </div>
        </div>

        <NotificationsRail
          criticalCount={notifications.data ? criticalCount : null}
          onToast={showToast}
          unreadCount={unread.data?.unreadCount ?? null}
        />
      </div>

      <div aria-live="polite" className={cn("nfx-toast", toast && "nfx-toast-show")}>
        {toast ? (
          <>
            <strong>{toast.title}</strong>
            <span>{toast.text}</span>
          </>
        ) : null}
      </div>
    </section>
  );
}
