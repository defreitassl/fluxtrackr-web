import type {
  Category,
  CategoryBudgetOverviewBudgetsItem,
  CategoryBudgetOverviewBudgetsItemStatus,
} from "@/api/generated/client";

export type BudgetStatusFilter = "all" | "near_limit" | "exceeded";
export type BudgetSort = "usage" | "category" | "spent" | "limit";

type BudgetStatusPresentation = {
  label: string;
  tone: "safe" | "attention" | "danger";
};

const budgetStatusLabels: Record<
  CategoryBudgetOverviewBudgetsItemStatus,
  BudgetStatusPresentation
> = {
  within_budget: { label: "Dentro do limite", tone: "safe" },
  near_limit: { label: "Em atenção", tone: "attention" },
  exceeded: { label: "Limite ultrapassado", tone: "danger" },
};

export function getBudgetStatusPresentation(status: CategoryBudgetOverviewBudgetsItemStatus) {
  return budgetStatusLabels[status];
}

export function filterBudgetItems(
  budgets: CategoryBudgetOverviewBudgetsItem[],
  filter: BudgetStatusFilter,
) {
  if (filter === "all") {
    return budgets;
  }

  return budgets.filter((budget) => budget.status === filter);
}

/**
 * Ordenação inteiramente de apresentação. A cópia estável preserva o array
 * retornado pela API e a ordem do servidor em caso de empate.
 */
export function sortBudgetItems(
  budgets: CategoryBudgetOverviewBudgetsItem[],
  sort: BudgetSort,
) {
  return budgets
    .map((budget, index) => ({ budget, index }))
    .sort((left, right) => {
      const comparison = compareBudgets(left.budget, right.budget, sort);
      return comparison || left.index - right.index;
    })
    .map(({ budget }) => budget);
}

function compareBudgets(
  left: CategoryBudgetOverviewBudgetsItem,
  right: CategoryBudgetOverviewBudgetsItem,
  sort: BudgetSort,
) {
  if (sort === "category") {
    return left.category.name.localeCompare(right.category.name, "pt-BR", {
      sensitivity: "base",
    });
  }

  const field = sort === "usage" ? "usagePercentage" : sort === "spent" ? "spentAmount" : "limitAmount";
  return Number(right[field]) - Number(left[field]);
}

/** Limita somente a largura visual; o texto mostra o percentual real da API. */
export function getVisualUsagePercentage(value: string): number {
  const percentage = Number(value);
  if (!Number.isFinite(percentage)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percentage));
}

export function formatUsagePercentage(value: string): string {
  const percentage = Number(value);
  if (!Number.isFinite(percentage)) {
    return "—";
  }

  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(percentage)}%`;
}

/** Categorias elegíveis: ativas, de despesa/ambas, e sem orçamento no período. */
export function getCategoriesWithoutBudget(
  categories: Category[],
  budgets: CategoryBudgetOverviewBudgetsItem[],
) {
  const budgetedCategoryIds = new Set(budgets.map((budget) => budget.category.id));

  return categories.filter(
    (category) =>
      category.isActive &&
      (category.type === "expense" || category.type === "both") &&
      !budgetedCategoryIds.has(category.id),
  );
}
