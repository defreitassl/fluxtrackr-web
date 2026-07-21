import type { CategoryBudgetOverview } from "@/api/generated/client";
import { formatPlanningAsOf } from "@/features/planning/lib/planning-period";
import type { BudgetSort, BudgetStatusFilter } from "@/features/planning/lib/planning-presentation";
import { formatCurrency } from "@/lib/format";

type PlanningOverviewProps = {
  filter: BudgetStatusFilter;
  onFilterChange: (filter: BudgetStatusFilter) => void;
  onSortChange: (sort: BudgetSort) => void;
  overview: CategoryBudgetOverview;
  sort: BudgetSort;
};

const filterOptions: Array<{ value: BudgetStatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "near_limit", label: "Em atenção" },
  { value: "exceeded", label: "Ultrapassados" },
];

const sortOptions: Array<{ value: BudgetSort; label: string }> = [
  { value: "usage", label: "Maior percentual utilizado" },
  { value: "category", label: "Nome da categoria" },
  { value: "spent", label: "Maior valor gasto" },
  { value: "limit", label: "Maior limite" },
];

export function PlanningOverview({
  filter,
  onFilterChange,
  onSortChange,
  overview,
  sort,
}: PlanningOverviewProps) {
  const filterCount = (value: BudgetStatusFilter) => {
    if (value === "all") {
      return overview.budgets.length;
    }

    return value === "near_limit"
      ? overview.summary.nearLimitCount
      : overview.summary.exceededCount;
  };

  return (
    <section aria-labelledby="planning-overview-title" className="planning-overview">
      <div className="planning-overview-heading">
        <div>
          <p className="planning-section-eyebrow">Visão mensal</p>
          <h2 id="planning-overview-title">Resumo do período</h2>
        </div>
        <p className="planning-as-of">Atualizado em {formatPlanningAsOf(overview.asOf)} (referência UTC)</p>
      </div>

      <div className="planning-summary-grid">
        <article>
          <span>Total orçado</span>
          <strong>{formatCurrency(overview.summary.totalLimit)}</strong>
        </article>
        <article>
          <span>Total gasto</span>
          <strong>{formatCurrency(overview.summary.totalSpent)}</strong>
        </article>
        <article>
          <span>Disponível</span>
          <strong>{formatCurrency(overview.summary.totalRemaining)}</strong>
        </article>
        <article>
          <span>Categorias monitoradas</span>
          <strong>{overview.budgets.length}</strong>
        </article>
      </div>

      <div className="planning-list-controls">
        <div aria-label="Filtrar situação dos orçamentos" className="planning-filter-list" role="group">
          {filterOptions.map((option) => (
            <button
              aria-pressed={filter === option.value}
              className={filter === option.value ? "is-active" : undefined}
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              type="button"
            >
              {option.label} <span>{filterCount(option.value)}</span>
            </button>
          ))}
        </div>

        <label className="planning-sort-field" htmlFor="planning-budget-sort">
          <span>Ordenar por</span>
          <select id="planning-budget-sort" onChange={(event) => onSortChange(event.target.value as BudgetSort)} value={sort}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
