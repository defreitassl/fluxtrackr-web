"use client";

import { Bell, SlidersHorizontal } from "lucide-react";

import type { NotificationCategory } from "@/api/generated/client";
import { preferenceLabels } from "@/features/notifications/lib/notification-presentation";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/queries/use-notification-feeds";

type NotificationsRailProps = {
  unreadCount: number | null;
  criticalCount: number | null;
  onToast: (title: string, text: string) => void;
};

export function NotificationsRail({ unreadCount, criticalCount, onToast }: NotificationsRailProps) {
  const preferences = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  function togglePreference(category: NotificationCategory) {
    const current = preferences.data?.preferences ?? [];
    const target = current.find((preference) => preference.category === category);
    if (!target) return;
    updatePreferences.mutate(
      {
        preferences: current.map((preference) => ({
          category: preference.category,
          enabled: preference.category === category ? !preference.enabled : preference.enabled,
          leadDays: preference.leadDays,
        })),
      },
      {
        onSuccess: () =>
          onToast(
            "Preferências atualizadas",
            `${preferenceLabels[category].title} ${target.enabled ? "desativadas" : "ativadas"}.`,
          ),
        onError: () => onToast("Não foi possível salvar", "Tente novamente em instantes."),
      },
    );
  }

  return (
    <aside className="nfx-rail" aria-label="Resumo e preferências">
      <div className="nfx-rail-card">
        <div className="tlx-card-title">
          <Bell aria-hidden="true" size={15} />
          Resumo
        </div>
        <div className="nfx-summary-rows">
          <div className="nfx-summary-row">
            <span>Não lidas</span>
            <strong>{unreadCount ?? "—"}</strong>
          </div>
          <div className="nfx-summary-row">
            <span>Importantes ativas</span>
            <strong className={criticalCount ? "tlx-value-red" : undefined}>
              {criticalCount ?? "—"}
            </strong>
          </div>
        </div>
      </div>

      <div className="nfx-rail-card">
        <div className="tlx-card-title">
          <SlidersHorizontal aria-hidden="true" size={15} />
          Preferências de notificação
        </div>
        <div className="nfx-settings-list">
          {(preferences.data?.preferences ?? []).map((preference) => {
            const labels = preferenceLabels[preference.category];
            return (
              <div className="nfx-setting" key={preference.category}>
                <div>
                  <strong>{labels.title}</strong>
                  <span>{labels.description}</span>
                </div>
                <button
                  aria-checked={preference.enabled}
                  aria-label={`${labels.title}: ${preference.enabled ? "ativadas" : "desativadas"}`}
                  className="tlx-switch"
                  disabled={updatePreferences.isPending}
                  onClick={() => togglePreference(preference.category)}
                  role="switch"
                  type="button"
                >
                  <i aria-hidden="true" />
                </button>
              </div>
            );
          })}
          {preferences.isPending ? (
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 10 }}>Carregando preferências…</p>
          ) : null}
          {preferences.isError ? (
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 10 }}>
              Não foi possível carregar as preferências.
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
