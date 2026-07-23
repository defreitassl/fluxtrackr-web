"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import type { FinancialEventStatus, TransactionType } from "@/api/generated/client";

export type EventStatusFilter = "all" | FinancialEventStatus;
export type EventTypeFilter = "all" | TransactionType;

const statusChips: Array<{ key: EventStatusFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "planned", label: "Planejados" },
  { key: "confirmed", label: "Confirmados" },
  { key: "postponed", label: "Adiados" },
  { key: "realized", label: "Realizados" },
  { key: "canceled", label: "Cancelados" },
];

type EventsToolbarProps = {
  statusFilter: EventStatusFilter;
  typeFilter: EventTypeFilter;
  onChangeStatus: (status: EventStatusFilter) => void;
  onChangeType: (type: EventTypeFilter) => void;
};

export function EventsToolbar({
  statusFilter,
  typeFilter,
  onChangeStatus,
  onChangeType,
}: EventsToolbarProps) {
  return (
    <div className="tlx-toolbar">
      <div className="tlx-toolbar-lead" role="group" aria-label="Filtrar por status">
        {statusChips.map((chip) => (
          <button
            aria-pressed={statusFilter === chip.key}
            className="txx-chip"
            key={chip.key}
            onClick={() => onChangeStatus(chip.key)}
            type="button"
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="tlx-toolbar-lead" role="group" aria-label="Filtrar por tipo">
        <button
          aria-pressed={typeFilter === "income"}
          className="txx-chip"
          onClick={() => onChangeType(typeFilter === "income" ? "all" : "income")}
          type="button"
        >
          <TrendingUp aria-hidden="true" color="var(--green-strong)" size={15} />
          Receitas
        </button>
        <button
          aria-pressed={typeFilter === "expense"}
          className="txx-chip"
          onClick={() => onChangeType(typeFilter === "expense" ? "all" : "expense")}
          type="button"
        >
          <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />
          Despesas
        </button>
      </div>
    </div>
  );
}
