"use client";

import type { CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import {
  formatUsagePercentage,
  getBudgetStatusPresentation,
  getVisualUsagePercentage,
} from "@/features/planning/lib/planning-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

const toneColors = {
  safe: { bar: "var(--green)", barBg: "var(--soft)", pill: "tlx-tone-green", label: "No ritmo" },
  attention: { bar: "var(--amber)", barBg: "var(--amber-soft)", pill: "tlx-tone-amber", label: "Em atenção" },
  danger: { bar: "var(--danger)", barBg: "var(--danger-soft)", pill: "tlx-tone-red", label: "Ultrapassado" },
} as const;

type BudgetGridProps = {
  budgets: CategoryBudgetOverviewBudgetsItem[];
  onEdit: (budget: CategoryBudgetOverviewBudgetsItem) => void;
};

export function BudgetGrid({ budgets, onEdit }: BudgetGridProps) {
  return (
    <div className="plx-budgets">
      {budgets.map((budget) => {
        const { tone } = getBudgetStatusPresentation(budget.status);
        const colors = toneColors[tone];
        const presentation = categoryPresentation(budget.category);
        const spent = Number(budget.spentAmount);
        const limit = Number(budget.limitAmount);
        const isOver = budget.status === "exceeded";
        return (
          <button
            aria-label={`Editar orçamento de ${budget.category.name}`}
            className={cn("plx-budget-card", isOver && "plx-budget-card-over")}
            key={budget.id}
            onClick={() => onEdit(budget)}
            type="button"
          >
            <div className="plx-budget-head">
              <span
                style={{
                  background: `color-mix(in srgb, ${presentation.color} 15%, transparent)`,
                  color: presentation.color,
                }}
              >
                <presentation.Icon aria-hidden="true" size={15} />
              </span>
              <strong>{budget.category.name}</strong>
              <span className={`plx-budget-pill ${colors.pill}`}>{colors.label}</span>
            </div>
            <div className="plx-budget-amounts">
              <strong style={{ color: isOver ? "var(--danger)" : "var(--text)" }}>
                {formatCurrency(budget.spentAmount)}
              </strong>
              <span>de {formatCurrency(budget.limitAmount)}</span>
            </div>
            <div className="plx-budget-bar" style={{ background: colors.barBg }} aria-hidden="true">
              <i
                style={{
                  width: `${getVisualUsagePercentage(budget.usagePercentage)}%`,
                  background: colors.bar,
                }}
              />
            </div>
            <div className="plx-budget-foot">
              {isOver ? (
                <span style={{ color: "var(--danger)", fontWeight: 700 }}>
                  Ultrapassou {formatCurrency(spent - limit)}
                </span>
              ) : (
                <span>
                  Restam <strong>{formatCurrency(budget.remainingAmount)}</strong>
                </span>
              )}
              <span style={{ color: colors.bar }}>{formatUsagePercentage(budget.usagePercentage)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
