import { Archive, Pencil } from "lucide-react";

import type { CategoryBudgetOverviewBudgetsItem } from "@/api/generated/client";
import {
  formatUsagePercentage,
  getBudgetStatusPresentation,
  getVisualUsagePercentage,
} from "@/features/planning/lib/planning-presentation";
import { formatCurrency } from "@/lib/format";

type CategoryBudgetListProps = {
  budgets: CategoryBudgetOverviewBudgetsItem[];
  onArchive: (budget: CategoryBudgetOverviewBudgetsItem) => void;
  onEdit: (budget: CategoryBudgetOverviewBudgetsItem) => void;
};

export function CategoryBudgetList({ budgets, onArchive, onEdit }: CategoryBudgetListProps) {
  return (
    <section aria-labelledby="planning-budget-list-title" className="planning-budget-list-section">
      <div className="planning-section-heading">
        <div>
          <p className="planning-section-eyebrow">Acompanhamento</p>
          <h2 id="planning-budget-list-title">Orçamentos por categoria</h2>
        </div>
        <p>{budgets.length} exibido(s)</p>
      </div>

      <div className="planning-budget-list">
        {budgets.map((budget) => (
          <CategoryBudgetCard budget={budget} key={budget.id} onArchive={onArchive} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

type CategoryBudgetCardProps = {
  budget: CategoryBudgetOverviewBudgetsItem;
  onArchive: (budget: CategoryBudgetOverviewBudgetsItem) => void;
  onEdit: (budget: CategoryBudgetOverviewBudgetsItem) => void;
};

function CategoryBudgetCard({ budget, onArchive, onEdit }: CategoryBudgetCardProps) {
  const status = getBudgetStatusPresentation(budget.status);
  const visualUsage = getVisualUsagePercentage(budget.usagePercentage);
  const usageText = formatUsagePercentage(budget.usagePercentage);
  const titleId = `planning-budget-${budget.id}`;

  return (
    <article aria-labelledby={titleId} className="planning-budget-card">
      <header className="planning-budget-card-header">
        <div>
          <h3 id={titleId}>{budget.category.name}</h3>
          <span className={`planning-budget-status planning-budget-status-${status.tone}`}>
            {status.label}
          </span>
        </div>
        <div className="planning-budget-card-actions">
          <button aria-label={`Editar orçamento de ${budget.category.name}`} className="icon-button" onClick={() => onEdit(budget)} type="button">
            <Pencil aria-hidden="true" size={16} />
          </button>
          <button aria-label={`Arquivar orçamento de ${budget.category.name}`} className="icon-button icon-button-danger" onClick={() => onArchive(budget)} type="button">
            <Archive aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <dl className="planning-budget-metrics">
        <div>
          <dt>Limite</dt>
          <dd>{formatCurrency(budget.limitAmount)}</dd>
        </div>
        <div>
          <dt>Gasto</dt>
          <dd>{formatCurrency(budget.spentAmount)}</dd>
        </div>
        <div>
          <dt>Disponível</dt>
          <dd>{formatCurrency(budget.remainingAmount)}</dd>
        </div>
      </dl>

      <div className="planning-usage-row">
        <div className="planning-usage-label">
          <span>Percentual utilizado</span>
          <strong>{usageText}</strong>
        </div>
        <div
          aria-label={`Uso do orçamento de ${budget.category.name}`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={visualUsage}
          aria-valuetext={`${usageText} utilizado. ${status.label}.`}
          className={`planning-progress planning-progress-${status.tone}`}
          role="progressbar"
        >
          <span style={{ width: `${visualUsage}%` }} />
        </div>
      </div>

      <dl className="planning-spending-sources">
        <div>
          <dt>Transações</dt>
          <dd>{formatCurrency(budget.transactionSpent)}</dd>
        </div>
        <div>
          <dt>Cartão</dt>
          <dd>{formatCurrency(budget.creditCardSpent)}</dd>
        </div>
      </dl>
    </article>
  );
}
