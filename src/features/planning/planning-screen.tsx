"use client";

import { CalendarDays, ChartNoAxesColumn, Plus, TriangleAlert, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import { FilterChip } from "@/features/transactions/components/filter-chip";
import { ArchiveCategoryBudgetDialog } from "@/features/planning/components/archive-category-budget-dialog";
import { BudgetDrawer } from "@/features/planning/components/budget-drawer";
import { BudgetGrid } from "@/features/planning/components/budget-grid";
import { BudgetHero } from "@/features/planning/components/budget-hero";
import { PlanningRail } from "@/features/planning/components/planning-rail";
import {
  formatPlanningPeriod,
  getCurrentPlanningPeriod,
  movePlanningPeriod,
  type PlanningPeriod,
} from "@/features/planning/lib/planning-period";
import {
  filterBudgetItems,
  getCategoriesWithoutBudget,
  sortBudgetItems,
  type BudgetSort,
  type BudgetStatusFilter,
} from "@/features/planning/lib/planning-presentation";
import { useCategoryBudgetOverview } from "@/features/planning/queries/use-category-budget-overview";
import { usePlanningCategories } from "@/features/planning/queries/use-planning-categories";
import { useGlobalSearch } from "@/providers/search-provider";

function periodOptions(reference: PlanningPeriod) {
  const options: Array<{ value: string; label: string }> = [];
  for (let offset = 2; offset >= -12; offset -= 1) {
    const period = movePlanningPeriod(reference, offset);
    options.push({
      value: `${period.year}-${period.month}`,
      label: formatPlanningPeriod(period),
    });
  }
  return options;
}

const sortLabels: Record<BudgetSort, string> = {
  usage: "% usado",
  category: "Categoria",
  spent: "Gasto",
  limit: "Limite",
};

export function PlanningScreen() {
  const currentPeriod = useMemo(() => getCurrentPlanningPeriod(), []);
  const [period, setPeriod] = useState<PlanningPeriod>(currentPeriod);
  const [filter, setFilter] = useState<BudgetStatusFilter>("all");
  const [sort, setSort] = useState<BudgetSort>("usage");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryBudgetOverviewBudgetsItem | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<CategoryBudgetOverviewBudgetsItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { query: search } = useGlobalSearch();

  const overview = useCategoryBudgetOverview(period);
  const categories = usePlanningCategories();

  useEffect(() => {
    function openCreate() {
      setEditing(null);
      setInitialCategoryId(null);
      setDrawerOpen(true);
    }
    window.addEventListener("fluxtrackr:new-budget", openCreate);
    return () => window.removeEventListener("fluxtrackr:new-budget", openCreate);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const visibleBudgets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const budgets = (overview.data?.budgets ?? []).filter((budget) =>
      term ? budget.category.name.toLowerCase().includes(term) : true,
    );
    return sortBudgetItems(filterBudgetItems(budgets, filter), sort);
  }, [overview.data, filter, sort, search]);

  const categoriesWithoutBudget = useMemo(
    () => getCategoriesWithoutBudget(categories.data ?? [], overview.data?.budgets ?? []),
    [categories.data, overview.data],
  );

  function openCreate(categoryId: string | null = null) {
    setFeedback(null);
    setEditing(null);
    setInitialCategoryId(categoryId);
    setDrawerOpen(true);
  }

  function openEdit(budget: CategoryBudgetOverviewBudgetsItem) {
    setFeedback(null);
    setEditing(budget);
    setDrawerOpen(true);
  }

  const statusChips: Array<{ key: BudgetStatusFilter; label: string; icon?: React.ReactNode }> = [
    { key: "all", label: "Todos" },
    {
      key: "near_limit",
      label: "Em atenção",
      icon: <TriangleAlert aria-hidden="true" color="var(--amber)" size={15} />,
    },
    {
      key: "exceeded",
      label: "Ultrapassados",
      icon: <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />,
    },
  ];

  return (
    <section className="plx-screen" aria-label="Planejamento">
      <div className="tlx-toolbar">
        <div className="tlx-toolbar-lead">
          <FilterChip
            emptyValue={`${currentPeriod.year}-${currentPeriod.month}`}
            icon={<CalendarDays aria-hidden="true" color="var(--text-muted)" size={15} />}
            label={formatPlanningPeriod(currentPeriod)}
            onChange={(value) => {
              const [year, month] = value.split("-").map(Number);
              setPeriod({ year, month });
              setFilter("all");
            }}
            options={periodOptions(currentPeriod)}
            value={`${period.year}-${period.month}`}
          />
          <span className="tlx-toolbar-divider" aria-hidden="true" />
          {statusChips.map((chip) => (
            <button
              aria-pressed={filter === chip.key}
              className="txx-chip"
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              type="button"
            >
              {chip.icon}
              {chip.label}
            </button>
          ))}
        </div>
        <FilterChip
          emptyValue="usage"
          label={`Ordenar: ${sortLabels.usage}`}
          onChange={(value) => setSort((value || "usage") as BudgetSort)}
          options={(Object.keys(sortLabels) as BudgetSort[]).map((value) => ({
            value,
            label: `Ordenar: ${sortLabels[value]}`,
          }))}
          value={sort}
        />
      </div>

      <div className="plx-body">
        <div className="plx-main">
          {feedback ? (
            <p className="mutation-feedback" role="status" style={{ marginBottom: 12 }}>
              {feedback}
            </p>
          ) : null}
          {overview.isRefetchError ? (
            <div className="timeline-refetch-alert tlx-refetch-alert" role="alert">
              <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
              <button
                className="secondary-button"
                onClick={() => overview.refetch({ cancelRefetch: false })}
                type="button"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {overview.isPending ? (
            <div aria-busy="true" aria-label="Carregando orçamentos" className="plx-skeleton" role="status">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {overview.isError && !overview.data ? (
            <div className="tlx-state" role="alert">
              <div>
                <span className="tlx-state-icon tlx-tone-red">
                  <TriangleAlert aria-hidden="true" size={24} />
                </span>
                <strong>Falha ao carregar orçamentos</strong>
                <p>Verifique a conexão e tente novamente.</p>
                <button
                  className="tlx-state-retry"
                  onClick={() => overview.refetch({ cancelRefetch: false })}
                  type="button"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : null}

          {overview.data ? (
            <>
              <BudgetHero overview={overview.data} />
              {overview.data.budgets.length === 0 ? (
                <div className="tlx-state">
                  <div>
                    <span className="tlx-state-icon tlx-tone-green">
                      <ChartNoAxesColumn aria-hidden="true" size={24} />
                    </span>
                    <strong>Nenhum orçamento definido</strong>
                    <p>Crie limites por categoria para acompanhar seus gastos do mês.</p>
                    <button className="tlx-state-cta" onClick={() => openCreate()} type="button">
                      <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
                      Novo orçamento
                    </button>
                  </div>
                </div>
              ) : visibleBudgets.length === 0 ? (
                <div className="tlx-state">
                  <div>
                    <span className="tlx-state-icon tlx-tone-green">
                      <ChartNoAxesColumn aria-hidden="true" size={24} />
                    </span>
                    <strong>Nenhum orçamento com este filtro</strong>
                    <p>Ajuste os filtros ou a busca para ver os orçamentos do mês.</p>
                  </div>
                </div>
              ) : (
                <BudgetGrid budgets={visibleBudgets} onEdit={openEdit} />
              )}
            </>
          ) : null}
        </div>

        {overview.data ? (
          <PlanningRail
            categories={categories.data ?? []}
            onDefineBudget={(categoryId) => openCreate(categoryId)}
            overview={overview.data}
          />
        ) : (
          <aside className="plx-rail" aria-hidden="true" />
        )}
      </div>

      <BudgetDrawer
        categoriesWithoutBudget={categoriesWithoutBudget}
        editing={editing}
        initialCategoryId={initialCategoryId}
        onArchive={(budget) => {
          setDrawerOpen(false);
          setArchiving(budget);
        }}
        onClose={() => setDrawerOpen(false)}
        onSaved={(message) => {
          setDrawerOpen(false);
          setEditing(null);
          setFeedback(message);
        }}
        open={drawerOpen}
        period={period}
      />

      <ArchiveCategoryBudgetDialog
        budget={archiving}
        onArchived={() => {
          setArchiving(null);
          setFeedback("Orçamento arquivado.");
        }}
        onClose={() => setArchiving(null)}
        open={archiving !== null}
        period={period}
      />
    </section>
  );
}
