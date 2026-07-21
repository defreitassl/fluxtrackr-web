"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import type { TimelineItem } from "@/api/generated/client";
import { monthWindow, useDashboardTimeline } from "@/features/dashboard/queries/use-dashboard-timeline";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type DayMark = "invoice" | "projected" | "commitment";

function markForItems(items: TimelineItem[]): DayMark | null {
  if (items.some((item) => item.sourceType === "credit_card_invoice")) return "invoice";
  if (items.some((item) => item.type === "income" && item.balanceImpact === "projected")) {
    return "projected";
  }
  if (items.some((item) => item.type === "expense" && item.balanceImpact === "projected")) {
    return "commitment";
  }
  return null;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

type FinanceCalendarCardProps = {
  today: Date;
};

export function FinanceCalendarCard({ today }: FinanceCalendarCardProps) {
  const [period, setPeriod] = useState({
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
  });

  const window = useMemo(() => monthWindow(period.year, period.month), [period]);
  const { data: timeline } = useDashboardTimeline(window);

  const marksByDay = useMemo(() => {
    const itemsByDay = new Map<number, TimelineItem[]>();
    for (const item of timeline?.items ?? []) {
      const date = new Date(item.date);
      if (date.getUTCFullYear() !== period.year || date.getUTCMonth() + 1 !== period.month) continue;
      const day = date.getUTCDate();
      itemsByDay.set(day, [...(itemsByDay.get(day) ?? []), item]);
    }
    return new Map(
      [...itemsByDay.entries()].flatMap(([day, items]) => {
        const mark = markForItems(items);
        return mark ? [[day, mark] as const] : [];
      }),
    );
  }, [timeline, period]);

  function shiftMonth(offset: number) {
    setPeriod((current) => {
      const date = new Date(Date.UTC(current.year, current.month - 1 + offset, 1));
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
    });
  }

  const firstWeekday = new Date(Date.UTC(period.year, period.month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  const isCurrentMonth =
    today.getUTCFullYear() === period.year && today.getUTCMonth() + 1 === period.month;

  const monthLabel = monthFormatter.format(new Date(Date.UTC(period.year, period.month - 1, 1)));

  return (
    <section className="dx-panel dx-side-card">
      <div className="dx-side-head">
        <h2>Calendário financeiro</h2>
        <div className="dx-cal-nav">
          <button aria-label="Mês anterior" onClick={() => shiftMonth(-1)} type="button">
            <ChevronLeft aria-hidden="true" size={15} />
          </button>
          <strong>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</strong>
          <button aria-label="Próximo mês" onClick={() => shiftMonth(1)} type="button">
            <ChevronRight aria-hidden="true" size={15} />
          </button>
        </div>
      </div>

      <div className="dx-cal-week" aria-hidden="true">
        {WEEKDAYS.map((weekday, index) => (
          <span key={`${weekday}-${index}`}>{weekday}</span>
        ))}
      </div>
      <div className="dx-cal-grid">
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`pad-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const isToday = isCurrentMonth && day === today.getUTCDate();
          const mark = marksByDay.get(day);
          const variant = isToday
            ? "dx-cal-day-today"
            : mark === "invoice"
              ? "dx-cal-day-invoice"
              : mark === "projected"
                ? "dx-cal-day-projected"
                : mark === "commitment"
                  ? "dx-cal-day-commitment"
                  : "";
          return (
            <span className={`dx-cal-day ${variant}`.trim()} key={day}>
              {day}
              {mark && !isToday ? <i aria-hidden="true" /> : null}
            </span>
          );
        })}
      </div>

      <div className="dx-cal-legend">
        <span>
          <i style={{ background: "var(--green-strong)" }} />
          Compromisso
        </span>
        <span>
          <i style={{ background: "var(--amber)" }} />
          Fatura
        </span>
        <span>
          <i style={{ background: "var(--blue)" }} />
          Previsto
        </span>
      </div>
    </section>
  );
}
