"use client";

import { MailOpen, Trash2 } from "lucide-react";
import { createElement, useRef, useState } from "react";

import type { Notification } from "@/api/generated/client";
import {
  notificationIcon,
  severityPresentation,
  timeLabel,
} from "@/features/notifications/lib/notification-presentation";
import { cn } from "@/lib/cn";

const SWIPE_THRESHOLD = 82;
const SWIPE_LIMIT = 110;

type NotificationCardProps = {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
  onDismiss: (notification: Notification) => void;
};

/**
 * Card com gesto de arrastar (pointer events — funciona com toque e mouse):
 * esquerda revela a lixeira e dispensa; direita revela o envelope e marca
 * como lida. Clique curto abre a origem. Ações também disponíveis no hover.
 */
export function NotificationCard({ notification, onOpen, onMarkRead, onDismiss }: NotificationCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const drag = useRef({ startX: 0, currentX: 0, dragging: false, moved: false });
  const [leaving, setLeaving] = useState(false);

  const severity = severityPresentation[notification.severity];
  const isUnread = notification.readAt === null;

  function setTransform(x: number, animate: boolean) {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = animate ? "transform 160ms ease" : "none";
    card.style.transform = `translateX(${x}px)`;
  }

  function onPointerDown(event: React.PointerEvent) {
    if (leaving) return;
    cardRef.current?.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, currentX: 0, dragging: true, moved: false };
    setTransform(0, false);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag.current.dragging) return;
    let delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 3) drag.current.moved = true;
    delta = Math.max(-SWIPE_LIMIT, Math.min(SWIPE_LIMIT, delta));
    drag.current.currentX = delta;
    setTransform(delta, false);
  }

  function onPointerEnd() {
    if (!drag.current.dragging) return;
    drag.current.dragging = false;
    const delta = drag.current.currentX;

    if (delta <= -SWIPE_THRESHOLD) {
      setLeaving(true);
      setTransform(-160, true);
      setTimeout(() => onDismiss(notification), 140);
      return;
    }
    if (delta >= SWIPE_THRESHOLD) {
      setTransform(160, true);
      setTimeout(() => {
        setTransform(0, true);
        if (isUnread) onMarkRead(notification);
      }, 140);
      return;
    }
    setTransform(0, true);
    if (!drag.current.moved) onOpen(notification);
  }

  return (
    <div className="nfx-swipe-shell">
      <div className="nfx-swipe-bg" aria-hidden="true">
        <span className="nfx-swipe-action nfx-swipe-action-left">
          <MailOpen size={17} />
        </span>
        <span className="nfx-swipe-action nfx-swipe-action-right">
          <Trash2 size={17} />
        </span>
      </div>
      <article
        aria-label={notification.title}
        className={cn("nfx-card", isUnread && "nfx-card-unread")}
        onPointerCancel={onPointerEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        ref={cardRef}
        role="button"
        tabIndex={0}
      >
        <span className={cn("nfx-icon", severity.iconClass)}>
          {createElement(notificationIcon(notification), { "aria-hidden": true, size: 19 })}
        </span>
        <div className="nfx-copy">
          <strong>{notification.title}</strong>
          <span>{notification.message}</span>
          <i className={cn("nfx-priority", severity.pillClass)}>{severity.label}</i>
        </div>
        <div className="nfx-side">
          <span className="nfx-time">{timeLabel(notification.createdAt)}</span>
          <div className="nfx-hover-actions">
            {isUnread ? (
              <button
                aria-label={`Marcar "${notification.title}" como lida`}
                onClick={(event) => {
                  event.stopPropagation();
                  onMarkRead(notification);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                title="Marcar como lida"
                type="button"
              >
                <MailOpen aria-hidden="true" size={13} />
              </button>
            ) : null}
            <button
              aria-label={`Dispensar "${notification.title}"`}
              className="nfx-action-danger"
              onClick={(event) => {
                event.stopPropagation();
                onDismiss(notification);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              title="Dispensar"
              type="button"
            >
              <Trash2 aria-hidden="true" size={13} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
