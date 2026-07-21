"use client";

import { CalendarDays, Clock3, CreditCard, Repeat, TrendingDown, TrendingUp } from "lucide-react";

import type { TimelineChipFilter } from "@/features/timeline/lib/timeline-item-presentation";

export type TimelineView = "calendar" | "timeline";

const chips: Array<{ key: TimelineChipFilter; label: string; icon?: React.ReactNode }> = [
  { key: "all", label: "Tudo" },
  {
    key: "income",
    label: "Receitas",
    icon: <TrendingUp aria-hidden="true" color="var(--green-strong)" size={15} />,
  },
  {
    key: "expense",
    label: "Despesas",
    icon: <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />,
  },
  {
    key: "invoices",
    label: "Faturas",
    icon: <CreditCard aria-hidden="true" color="var(--amber)" size={15} />,
  },
  {
    key: "recurring",
    label: "Recorrentes",
    icon: <Repeat aria-hidden="true" color="var(--blue)" size={15} />,
  },
];

type TimelineToolbarProps = {
  view: TimelineView;
  filter: TimelineChipFilter;
  showForecast: boolean;
  onChangeView: (view: TimelineView) => void;
  onChangeFilter: (filter: TimelineChipFilter) => void;
  onToggleForecast: () => void;
};

export function TimelineToolbar({
  view,
  filter,
  showForecast,
  onChangeView,
  onChangeFilter,
  onToggleForecast,
}: TimelineToolbarProps) {
  return (
    <div className="tlx-toolbar">
      <div className="tlx-toolbar-lead">
        <div className="tlx-view-switch" role="group" aria-label="Modo de visualização">
          <button aria-pressed={view === "calendar"} onClick={() => onChangeView("calendar")} type="button">
            <CalendarDays aria-hidden="true" size={14} />
            Calendário
          </button>
          <button aria-pressed={view === "timeline"} onClick={() => onChangeView("timeline")} type="button">
            <Clock3 aria-hidden="true" size={14} />
            Linha do tempo
          </button>
        </div>
        <span className="tlx-toolbar-divider" aria-hidden="true" />
        {chips.map((chip) => (
          <button
            aria-pressed={filter === chip.key}
            className="tlx-chip"
            key={chip.key}
            onClick={() => onChangeFilter(chip.key)}
            type="button"
          >
            {chip.icon}
            {chip.label}
          </button>
        ))}
      </div>
      <div className="tlx-forecast-toggle">
        <span id="tlx-forecast-label">Mostrar previsão</span>
        <button
          aria-checked={showForecast}
          aria-labelledby="tlx-forecast-label"
          className="tlx-switch"
          onClick={onToggleForecast}
          role="switch"
          type="button"
        >
          <i aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
