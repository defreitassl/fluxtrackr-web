"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import type { Account, Category, TimelineItem } from "@/api/generated/client";
import { TimelineEventBody } from "@/features/timeline/components/timeline-event-body";
import { getUtcDayKey } from "@/features/timeline/lib/timeline-date-range";
import {
  timelineItemTone,
  timelineItemView,
} from "@/features/timeline/lib/timeline-item-presentation";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type TimelineCalendarViewProps = {
  month: Date;
  items: TimelineItem[];
  selectedDay: number;
  today: Date;
  categoriesById: Map<string, Category>;
  accountsById: Map<string, Account>;
  onMoveMonth: (amount: number) => void;
  onMoveYear: (amount: number) => void;
  onResetToday: () => void;
  onSelectDay: (day: number) => void;
};

export function TimelineCalendarView({
  month,
  items,
  selectedDay,
  today,
  categoriesById,
  accountsById,
  onMoveMonth,
  onMoveYear,
  onResetToday,
  onSelectDay,
}: TimelineCalendarViewProps) {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const isCurrentMonth = today.getUTCFullYear() === year && today.getUTCMonth() === monthIndex;

  const itemsByDay = useMemo(() => {
    const map = new Map<number, TimelineItem[]>();
    for (const item of items) {
      const day = Number(getUtcDayKey(item.date).slice(8, 10));
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return map;
  }, [items]);

  const selectedItems = itemsByDay.get(selectedDay) ?? [];
  const selectedIsToday = isCurrentMonth && selectedDay === today.getUTCDate();

  return (
    <div>
      <div className="tlx-cal-head">
        <div className="tlx-cal-nav">
          <button aria-label="Mês anterior" className="tlx-nav-button" onClick={() => onMoveMonth(-1)} type="button">
            <ChevronLeft aria-hidden="true" size={15} />
          </button>
          <strong>{`${capitalize(MONTHS[monthIndex])} de ${year}`}</strong>
          <button aria-label="Próximo mês" className="tlx-nav-button" onClick={() => onMoveMonth(1)} type="button">
            <ChevronRight aria-hidden="true" size={15} />
          </button>
        </div>
        <div className="tlx-cal-actions">
          <button className="tlx-today-button" onClick={onResetToday} type="button">
            Hoje
          </button>
          <div className="tlx-year-stepper">
            <button aria-label="Ano anterior" onClick={() => onMoveYear(-1)} type="button">
              <ChevronLeft aria-hidden="true" size={15} />
            </button>
            <span>{year}</span>
            <button aria-label="Próximo ano" onClick={() => onMoveYear(1)} type="button">
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="tlx-legend">
        <span>
          <i style={{ background: "var(--green)" }} />
          Receita
        </span>
        <span>
          <i style={{ background: "var(--danger)" }} />
          Despesa
        </span>
        <span>
          <i style={{ background: "var(--amber)" }} />
          Fatura / dívida
        </span>
        <span>
          <i style={{ background: "var(--blue)" }} />
          Evento / assinatura
        </span>
      </div>

      <div className="tlx-cal-week" aria-hidden="true">
        {WEEKDAYS.map((weekday, index) => (
          <span key={`${weekday}-${index}`}>{weekday}</span>
        ))}
      </div>
      <div className="tlx-cal-grid">
        {Array.from({ length: firstWeekday }, (_, index) => (
          <div className="tlx-cal-cell-pad" key={`pad-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const isToday = isCurrentMonth && day === today.getUTCDate();
          const dayItems = itemsByDay.get(day) ?? [];
          return (
            <button
              aria-label={`Dia ${day}, ${dayItems.length} eventos`}
              aria-pressed={day === selectedDay}
              className={cn("tlx-cal-cell", isToday && "tlx-cal-cell-today")}
              key={day}
              onClick={() => onSelectDay(day)}
              type="button"
            >
              <span className={cn("tlx-cal-daynum", isToday && "tlx-cal-daynum-today")}>{day}</span>
              <span className="tlx-cal-chips">
                {dayItems.slice(0, 2).map((item) => {
                  const tone = timelineItemTone(item);
                  return (
                    <span className={`tlx-cal-chip tlx-tone-${tone}`} key={item.id}>
                      <i style={{ background: "currentcolor" }} />
                      <span>{item.title}</span>
                    </span>
                  );
                })}
                {dayItems.length > 2 ? <span className="tlx-cal-more">+{dayItems.length - 2} mais</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="tlx-day-detail">
        <div className="tlx-day-detail-head">
          <strong>
            {selectedDay} de {MONTHS[monthIndex]} de {year}
            {selectedIsToday ? <span className="tlx-today-pill">Hoje</span> : null}
          </strong>
          <span>
            {selectedItems.length} {selectedItems.length === 1 ? "compromisso" : "compromissos"}
          </span>
        </div>
        {selectedItems.length === 0 ? (
          <div className="tlx-day-empty">
            <div>
              <span>
                <CalendarDays aria-hidden="true" size={22} />
              </span>
              <strong>Nenhum evento neste dia</strong>
              <p>Selecione outro dia ou registre uma movimentação.</p>
            </div>
          </div>
        ) : (
          selectedItems.map((item) => (
            <div className="tlx-event-row" key={item.id}>
              <TimelineEventBody
                title={item.title}
                view={timelineItemView(item, categoriesById, accountsById)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
