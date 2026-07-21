"use client";

import { useState } from "react";

import type { CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { getCategoryBudgetErrorMessage } from "@/features/planning/lib/category-budget-error-message";
import { formatPlanningPeriod, type PlanningPeriod } from "@/features/planning/lib/planning-period";
import { useArchiveCategoryBudget } from "@/features/planning/mutations/use-category-budget-mutations";

type ArchiveCategoryBudgetDialogProps = {
  budget: CategoryBudgetOverviewBudgetsItem | null;
  onArchived: () => void;
  onClose: () => void;
  open: boolean;
  period: PlanningPeriod;
};

export function ArchiveCategoryBudgetDialog({
  budget,
  onArchived,
  onClose,
  open,
  period,
}: ArchiveCategoryBudgetDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const archiveBudget = useArchiveCategoryBudget();

  if (!budget) {
    return null;
  }

  const budgetToArchive = budget;

  async function handleArchive() {
    setSubmitError(null);
    try {
      await archiveBudget.mutateAsync(budgetToArchive.id);
      onArchived();
    } catch (error) {
      setSubmitError(getCategoryBudgetErrorMessage(error, "archive"));
    }
  }

  return (
    <Dialog
      busy={archiveBudget.isPending}
      description="Este orçamento deixará de ser considerado no planejamento deste período. O histórico financeiro da categoria será preservado."
      descriptionId="archive-category-budget-description"
      initialFocusSelector="#archive-category-budget-confirm"
      onClose={onClose}
      open={open}
      title="Arquivar orçamento"
      titleId="archive-category-budget-title"
    >
      <div className="planning-archive-dialog">
        <dl>
          <div>
            <dt>Categoria</dt>
            <dd>{budgetToArchive.category.name}</dd>
          </div>
          <div>
            <dt>Período</dt>
            <dd>{formatPlanningPeriod(period)}</dd>
          </div>
        </dl>

        {submitError ? (
          <p className="planning-form-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="planning-form-actions">
          <button className="secondary-button" disabled={archiveBudget.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="danger-button"
            disabled={archiveBudget.isPending}
            id="archive-category-budget-confirm"
            onClick={handleArchive}
            type="button"
          >
            {archiveBudget.isPending ? "Arquivando…" : "Arquivar orçamento"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
