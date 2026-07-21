"use client";

import { Clock3 } from "lucide-react";
import { Fragment, useMemo } from "react";

import type { Account, Category, TimelineItem } from "@/api/generated/client";
import { TimelineEventBody } from "@/features/timeline/components/timeline-event-body";
import { getUtcDayKey } from "@/features/timeline/lib/timeline-date-range";
import { timelineItemView } from "@/features/timeline/lib/timeline-item-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

const MONTH_ABBREVIATIONS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const toneColors = {
  green: "var(--green-strong)",
  red: "var(--danger)",
  amber: "var(--amber)",
  blue: "var(--blue)",
} as const;

type TimelineTrackViewProps = {
  items: TimelineItem[];
  today: Date;
  categoriesById: Map<string, Category>;
  accountsById: Map<string, Account>;
  /** saldo atual para calcular o saldo previsto dos itens futuros (apenas mês corrente) */
  currentBalance: number | null;
};

export function TimelineTrackView({
  items,
  today,
  categoriesById,
  accountsById,
  currentBalance,
}: TimelineTrackViewProps) {
  const todayKey = getUtcDayKey(today.toISOString());

  const rows = useMemo(() => {
    const sorted = [...items].sort((left, right) => left.date.localeCompare(right.date));

    type Row = { item: TimelineItem; isToday: boolean; isFuture: boolean; balanceChip: string | null };
    const result = sorted.reduce<{ rows: Row[]; runningBalance: number | null }>(
      (state, item) => {
        const dayKey = getUtcDayKey(item.date);
        const isToday = dayKey === todayKey;
        const isFuture = dayKey > todayKey;

        const projectsBalance =
          isFuture && state.runningBalance !== null && item.balanceImpact === "projected";
        const amount = Number(item.amount);
        const runningBalance = projectsBalance
          ? (state.runningBalance as number) + (item.type === "income" ? amount : -amount)
          : state.runningBalance;

        return {
          runningBalance,
          rows: [
            ...state.rows,
            {
              item,
              isToday,
              isFuture,
              balanceChip: projectsBalance && runningBalance !== null ? formatCurrency(runningBalance) : null,
            },
          ],
        };
      },
      { rows: [], runningBalance: currentBalance },
    );

    return result.rows;
  }, [items, todayKey, currentBalance]);

  const firstFutureIndex = rows.findIndex((row) => row.isFuture);

  return (
    <div className="tlx-track">
      {rows.map(({ item, isToday, isFuture, balanceChip }, index) => {
        const view = timelineItemView(item, categoriesById, accountsById);
        const date = new Date(item.date);
        return (
          <Fragment key={item.id}>
            {index === firstFutureIndex ? (
              <div className="tlx-divider" aria-label="Eventos previstos">
                <span />
                <span />
                <div className="tlx-divider-inner">
                  <span className="tlx-divider-pill">
                    <Clock3 aria-hidden="true" size={13} />
                    Previsto
                  </span>
                </div>
              </div>
            ) : null}
            <div className="tlx-track-row">
              <div className="tlx-track-date">
                <strong
                  style={{
                    color: isToday ? "var(--green-strong)" : isFuture ? "var(--text-muted)" : "var(--text)",
                  }}
                >
                  {String(date.getUTCDate()).padStart(2, "0")}
                </strong>
                <span>{MONTH_ABBREVIATIONS[date.getUTCMonth()]}</span>
              </div>
              <div className="tlx-track-spine">
                {isToday ? (
                  <span className="tlx-dot tlx-dot-today" />
                ) : (
                  <span
                    className={cn("tlx-dot", isFuture && "tlx-dot-future")}
                    style={
                      isFuture
                        ? { color: toneColors[view.tone] }
                        : { background: toneColors[view.tone] }
                    }
                  />
                )}
                {index < rows.length - 1 ? (
                  <span className={cn("tlx-track-line", isFuture && "tlx-track-line-future")} />
                ) : null}
              </div>
              <div
                className={cn(
                  "tlx-track-card",
                  isFuture && !view.isInvoice && "tlx-track-card-future",
                  isToday && "tlx-track-card-today",
                  view.isInvoice && "tlx-track-card-invoice",
                )}
              >
                <TimelineEventBody
                  balanceChip={balanceChip}
                  isToday={isToday}
                  title={item.title}
                  view={view}
                />
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
