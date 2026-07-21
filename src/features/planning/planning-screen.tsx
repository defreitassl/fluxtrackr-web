"use client";

import { CircleDollarSign, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Category, CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ArchiveCategoryBudgetDialog } from "@/features/planning/components/archive-category-budget-dialog";
import { CategoriesWithoutBudget } from "@/features/planning/components/categories-without-budget";
import { CategoryBudgetFormDialog } from "@/features/planning/components/category-budget-form-dialog";
import { CategoryBudgetList } from "@/features/planning/components/category-budget-list";
import { PlanningHeader } from "@/features/planning/components/planning-header";
import { PlanningOverview } from "@/features/planning/components/planning-overview";
import {
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

const SUCCESS_MESSAGE_TIMEOUT = 5000;
const EMPTY_CATEGORIES: Category[] = [];

export function PlanningScreen() {
  const [period, setPeriod] = useState<PlanningPeriod>(getCurrentPlanningPeriod);
  const [filter, setFilter] = useState<BudgetStatusFilter>("all");
  const [sort, setSort] = useState<BudgetSort>("usage");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState<string | undefined>();
  const [editingBudget, setEditingBudget] = useState<CategoryBudgetOverviewBudgetsItem | null>(null);
  const [archivingBudget, setArchivingBudget] = useState<CategoryBudgetOverviewBudgetsItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const overview = useCategoryBudgetOverview(period);
  const categories = usePlanningCategories();
  const data = overview.data;
  const availableCategories = categories.data ?? EMPTY_CATEGORIES;

  const categoriesWithoutBudget = useMemo(
    () => getCategoriesWithoutBudget(availableCategories, data?.budgets ?? []),
    [availableCategories, data?.budgets],
  );
  const visibleBudgets = useMemo(
    () => sortBudgetItems(filterBudgetItems(data?.budgets ?? [], filter), sort),
    [data?.budgets, filter, sort],
  );

  const isRefreshing = overview.isFetching || categories.isFetching;
  const currentPeriod = getCurrentPlanningPeriod();
  const isCurrentPeriod = period.year === currentPeriod.year && period.month === currentPeriod.month;
  const canCreateBudget = Boolean(
    data && !overview.isPlaceholderData && !categories.isPending && !categories.isError && categoriesWithoutBudget.length,
  );
  const hasBudgetEligibleCategory = availableCategories.some(
    (category) => category.isActive && (category.type === "expense" || category.type === "both"),
  );

  useEffect(() => {
    return () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    };
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimer.current) {
      clearTimeout(successTimer.current);
    }
    successTimer.current = setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_TIMEOUT);
  };

  const closeDialogs = () => {
    setIsCreateOpen(false);
    setCreateCategoryId(undefined);
    setEditingBudget(null);
    setArchivingBudget(null);
  };

  const changePeriod = (nextPeriod: PlanningPeriod) => {
    closeDialogs();
    setSuccessMessage(null);
    setFilter("all");
    setPeriod(nextPeriod);
  };

  const refresh = () => {
    if (isRefreshing) {
      return;
    }

    void Promise.all([
      overview.refetch({ cancelRefetch: false }),
      categories.refetch({ cancelRefetch: false }),
    ]);
  };

  const openCreate = (category?: Category) => {
    if (!canCreateBudget) {
      return;
    }

    setSuccessMessage(null);
    setCreateCategoryId(category?.id);
    setIsCreateOpen(true);
  };

  const handleSaved = (message: string) => {
    closeDialogs();
    showSuccess(message);
  };

  const handleArchived = () => {
    closeDialogs();
    showSuccess("Orçamento arquivado com sucesso.");
  };

  return (
    <section aria-labelledby="planning-title" className="planning-screen">
      <PlanningHeader
        canCreateBudget={canCreateBudget}
        isCurrentPeriod={isCurrentPeriod}
        isInitialLoading={overview.isPending && !data}
        isRefreshing={isRefreshing}
        onCreateBudget={() => openCreate()}
        onMovePeriod={(months) => changePeriod(movePlanningPeriod(period, months))}
        onRefresh={refresh}
        onSelectCurrentPeriod={() => changePeriod(getCurrentPlanningPeriod())}
        period={period}
      />

      {overview.isPending && !data ? <LoadingState label="Carregando planejamento mensal…" /> : null}

      {overview.isError && !data ? (
        <ErrorState
          description="Não foi possível obter os orçamentos deste período. Tente novamente em instantes."
          onRetry={refresh}
          title="Planejamento indisponível"
        />
      ) : null}

      {overview.isPlaceholderData ? (
        <LoadingState label="Atualizando o planejamento do período selecionado…" />
      ) : null}

      {data && !overview.isPlaceholderData ? (
        <div aria-busy={isRefreshing} className="planning-content">
          {overview.isRefetchError ? (
            <div className="planning-refetch-error" role="alert">
              <p>Não foi possível atualizar os orçamentos. Os dados anteriores continuam visíveis.</p>
              <button className="secondary-button" onClick={refresh} type="button">
                Tentar novamente
              </button>
            </div>
          ) : null}

          {successMessage ? <p className="planning-success-message" role="status">{successMessage}</p> : null}

          <PlanningOverview
            filter={filter}
            onFilterChange={setFilter}
            onSortChange={setSort}
            overview={data}
            sort={sort}
          />

          {data.budgets.length === 0 ? (
            <EmptyPlanningState
              hasEligibleCategory={hasBudgetEligibleCategory}
              isCategoriesLoading={categories.isPending}
              onCreate={() => openCreate()}
            />
          ) : visibleBudgets.length === 0 ? (
            <section className="planning-filter-empty">
              <EmptyState
                description="Altere o filtro para consultar os demais orçamentos deste mês."
                icon={SlidersHorizontal}
                title="Nenhum orçamento corresponde ao filtro selecionado."
              />
            </section>
          ) : (
            <CategoryBudgetList
              budgets={visibleBudgets}
              onArchive={(budget) => {
                setSuccessMessage(null);
                setArchivingBudget(budget);
              }}
              onEdit={(budget) => {
                setSuccessMessage(null);
                setEditingBudget(budget);
              }}
            />
          )}

          <PlanningCategoriesSection
            categories={categoriesWithoutBudget}
            isError={categories.isError}
            isLoading={categories.isPending}
            onDefineBudget={openCreate}
            onRetry={() => void categories.refetch({ cancelRefetch: false })}
            refetchError={categories.isRefetchError}
          />
        </div>
      ) : null}

      {isCreateOpen ? (
        <CategoryBudgetFormDialog
          categories={categoriesWithoutBudget}
          initialCategoryId={createCategoryId}
          mode="create"
          onClose={closeDialogs}
          onSaved={handleSaved}
          open
          period={period}
        />
      ) : null}
      {editingBudget ? (
        <CategoryBudgetFormDialog
          budget={editingBudget}
          categories={categoriesWithoutBudget}
          mode="edit"
          onClose={closeDialogs}
          onSaved={handleSaved}
          open
          period={period}
        />
      ) : null}
      {archivingBudget ? (
        <ArchiveCategoryBudgetDialog
          budget={archivingBudget}
          onArchived={handleArchived}
          onClose={closeDialogs}
          open
          period={period}
        />
      ) : null}
    </section>
  );
}

type EmptyPlanningStateProps = {
  hasEligibleCategory: boolean;
  isCategoriesLoading: boolean;
  onCreate: () => void;
};

function EmptyPlanningState({ hasEligibleCategory, isCategoriesLoading, onCreate }: EmptyPlanningStateProps) {
  if (isCategoriesLoading) {
    return <LoadingState label="Verificando categorias disponíveis…" />;
  }

  if (!hasEligibleCategory) {
    return (
      <EmptyState
        description="Crie ou ative uma categoria de despesa para definir o primeiro orçamento mensal."
        icon={CircleDollarSign}
        title="Nenhuma categoria disponível"
      />
    );
  }

  return (
    <div className="planning-empty-budget-state">
      <EmptyState
        description="Defina limites por categoria para acompanhar os gastos do período selecionado."
        icon={CircleDollarSign}
        title="Nenhum orçamento foi definido para este mês."
      />
      <button className="primary-button" onClick={onCreate} type="button">
        Criar orçamento
      </button>
    </div>
  );
}

type PlanningCategoriesSectionProps = {
  categories: Category[];
  isError: boolean;
  isLoading: boolean;
  onDefineBudget: (category: Category) => void;
  onRetry: () => void;
  refetchError: boolean;
};

function PlanningCategoriesSection({
  categories,
  isError,
  isLoading,
  onDefineBudget,
  onRetry,
  refetchError,
}: PlanningCategoriesSectionProps) {
  if (isLoading && !categories.length) {
    return <LoadingState label="Carregando categorias disponíveis…" />;
  }

  if (isError && !categories.length) {
    return (
      <ErrorState
        description="Não foi possível verificar as categorias sem orçamento."
        onRetry={onRetry}
        title="Categorias indisponíveis"
      />
    );
  }

  return (
    <>
      {refetchError ? (
        <div className="planning-refetch-error" role="alert">
          <p>Não foi possível atualizar as categorias. A lista anterior continua visível.</p>
          <button className="secondary-button" onClick={onRetry} type="button">
            Tentar novamente
          </button>
        </div>
      ) : null}
      <CategoriesWithoutBudget categories={categories} onDefineBudget={onDefineBudget} />
    </>
  );
}
