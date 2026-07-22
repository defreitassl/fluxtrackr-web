"use client";

import { SlidersHorizontal, Tag, TriangleAlert } from "lucide-react";

import type { Category, CategoryBudgetOverview } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { categoryTypeLabel } from "@/features/categories/lib/category-form";
import { getCategoriesWithoutBudget } from "@/features/planning/lib/planning-presentation";
import { formatCurrency } from "@/lib/format";

type PlanningRailProps = {
  overview: CategoryBudgetOverview;
  categories: Category[];
  onDefineBudget: (categoryId: string) => void;
};

export function PlanningRail({ overview, categories, onDefineBudget }: PlanningRailProps) {
  const exceeded = overview.budgets.find((budget) => budget.status === "exceeded");
  const withoutBudget = getCategoriesWithoutBudget(categories, overview.budgets);

  return (
    <aside className="plx-rail" aria-label="Resumo do planejamento">
      <div className="plx-rail-card">
        <div className="tlx-card-title">
          <SlidersHorizontal aria-hidden="true" size={15} />
          Resumo do mês
        </div>
        <div className="plx-rail-rows">
          <div className="plx-rail-row">
            <span>Total orçado</span>
            <span>{formatCurrency(overview.summary.totalLimit)}</span>
          </div>
          <div className="plx-rail-row">
            <span>Gasto até agora</span>
            <span className="tlx-value-red">{formatCurrency(overview.summary.totalSpent)}</span>
          </div>
          <div className="plx-rail-row plx-rail-total">
            <span>Disponível</span>
            <span>{formatCurrency(overview.summary.totalRemaining)}</span>
          </div>
        </div>
      </div>

      {exceeded ? (
        <div className="plx-alert">
          <div className="plx-alert-head">
            <span>
              <TriangleAlert aria-hidden="true" size={15} />
            </span>
            <div style={{ minWidth: 0 }}>
              <strong>{exceeded.category.name} ultrapassou o limite</strong>
              <small>
                {formatCurrency(exceeded.spentAmount)} de {formatCurrency(exceeded.limitAmount)} ·{" "}
                +{Math.max(0, Math.round(Number(exceeded.usagePercentage) - 100))}%
              </small>
            </div>
          </div>
          <p>
            Isso é só um aviso — os lançamentos continuam sendo registrados. Reveja o limite ou os
            gastos da categoria.
          </p>
        </div>
      ) : null}

      <div className="plx-rail-card plx-nobudget">
        <div className="tlx-card-title plx-nobudget-head">
          <Tag aria-hidden="true" size={15} />
          Categorias sem orçamento
        </div>
        {withoutBudget.length === 0 ? (
          <p className="tlx-upcoming-empty">Todas as categorias de despesa têm orçamento.</p>
        ) : (
          withoutBudget.slice(0, 6).map((category) => {
            const presentation = categoryPresentation(category);
            return (
              <div className="plx-nobudget-row" key={category.id}>
                <span
                  style={{
                    background: `color-mix(in srgb, ${presentation.color} 15%, transparent)`,
                    color: presentation.color,
                  }}
                >
                  <presentation.Icon aria-hidden="true" size={15} />
                </span>
                <div className="plx-nobudget-info">
                  <strong>{category.name}</strong>
                  <span>{categoryTypeLabel(category.type)}</span>
                </div>
                <button onClick={() => onDefineBudget(category.id)} type="button">
                  Definir
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
