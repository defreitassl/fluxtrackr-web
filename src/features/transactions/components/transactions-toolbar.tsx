"use client";

import { CalendarDays, Download, SlidersHorizontal } from "lucide-react";

import type { Account, Category } from "@/api/generated/client";
import { FilterChip } from "@/features/transactions/components/filter-chip";
import { paymentMethodOptions } from "@/features/transactions/lib/transaction-form";
import {
  monthOptions,
  type TransactionsFilters,
} from "@/features/transactions/lib/transactions-filters";
import { cn } from "@/lib/cn";

type TransactionsToolbarProps = {
  filters: TransactionsFilters;
  categories: Category[];
  accounts: Account[];
  moreFiltersOpen: boolean;
  onChange: (patch: Partial<TransactionsFilters>) => void;
  onToggleMoreFilters: () => void;
  onExport: () => void;
};

export function TransactionsToolbar({
  filters,
  categories,
  accounts,
  moreFiltersOpen,
  onChange,
  onToggleMoreFilters,
  onExport,
}: TransactionsToolbarProps) {
  return (
    <div className="txx-toolbar">
      <div className="txx-toolbar-lead">
        <FilterChip
          icon={<CalendarDays aria-hidden="true" color="var(--text-muted)" size={15} />}
          label="Período"
          onChange={(month) => onChange({ month })}
          options={monthOptions()}
          value={filters.month}
        />
        <FilterChip
          label="Tipo"
          onChange={(type) => onChange({ type: type as TransactionsFilters["type"] })}
          options={[
            { value: "expense", label: "Despesas" },
            { value: "income", label: "Receitas" },
          ]}
          value={filters.type}
        />
        <FilterChip
          label="Todas as contas"
          onChange={(accountId) => onChange({ accountId })}
          options={accounts.map((account) => ({ value: account.id, label: account.name }))}
          value={filters.accountId}
        />
        <FilterChip
          label="Categoria"
          onChange={(categoryId) => onChange({ categoryId })}
          options={categories
            .filter((category) => category.isActive)
            .map((category) => ({ value: category.id, label: category.name }))}
          value={filters.categoryId}
        />
        <FilterChip
          label="Método"
          onChange={(paymentMethod) =>
            onChange({ paymentMethod: paymentMethod as TransactionsFilters["paymentMethod"] })
          }
          options={paymentMethodOptions}
          value={filters.paymentMethod}
        />
        <button
          aria-expanded={moreFiltersOpen}
          className={cn("txx-chip txx-chip-ghost", moreFiltersOpen && "txx-chip-active")}
          onClick={onToggleMoreFilters}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={15} />
          Mais filtros
        </button>
        {moreFiltersOpen ? (
          <FilterChip
            label="Fonte"
            onChange={(source) => onChange({ source: source as TransactionsFilters["source"] })}
            options={[
              { value: "app", label: "Aplicativo" },
              { value: "telegram", label: "Telegram" },
            ]}
            value={filters.source}
          />
        ) : null}
      </div>
      <button className="txx-chip" onClick={onExport} type="button">
        <Download aria-hidden="true" size={15} />
        Exportar
      </button>
    </div>
  );
}
