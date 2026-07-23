"use client";

import { Plus, Target, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { FinancialGoal, FinancialGoalStatus } from "@/api/generated/client";
import { CancelGoalDialog } from "@/features/goals/components/cancel-goal-dialog";
import { GoalContributionDrawer } from "@/features/goals/components/goal-contribution-drawer";
import { GoalDrawer } from "@/features/goals/components/goal-drawer";
import { GoalsGrid } from "@/features/goals/components/goals-grid";
import { GoalsHero } from "@/features/goals/components/goals-hero";
import { getGoalErrorMessage } from "@/features/goals/lib/goal-error-message";
import { useUpdateFinancialGoal } from "@/features/goals/mutations/use-goal-mutations";
import { useFinancialGoalsOverview } from "@/features/goals/queries/use-financial-goals";
import { useGlobalSearch } from "@/providers/search-provider";

/** evento que abre o drawer a partir do CTA global do header */
export const OPEN_GOAL_DRAWER_EVENT = "fluxtrackr:new-goal";

const statusChips: Array<{ key: FinancialGoalStatus; label: string }> = [
  { key: "active", label: "Ativas" },
  { key: "completed", label: "Concluídas" },
  { key: "canceled", label: "Canceladas" },
];

export function GoalsScreen() {
  const [statusFilter, setStatusFilter] = useState<FinancialGoalStatus>("active");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialGoal | null>(null);
  const [contributing, setContributing] = useState<FinancialGoal | null>(null);
  const [canceling, setCanceling] = useState<FinancialGoal | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { query: search } = useGlobalSearch();

  const overview = useFinancialGoalsOverview();
  const reactivateMutation = useUpdateFinancialGoal();

  useEffect(() => {
    function openCreate() {
      setEditing(null);
      setDrawerOpen(true);
    }
    window.addEventListener(OPEN_GOAL_DRAWER_EVENT, openCreate);
    return () => window.removeEventListener(OPEN_GOAL_DRAWER_EVENT, openCreate);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const visibleGoals = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (overview.data?.goals ?? []).filter(
      (goal) =>
        goal.status === statusFilter && (term ? goal.name.toLowerCase().includes(term) : true),
    );
  }, [overview.data, statusFilter, search]);

  function openCreate() {
    setFeedback(null);
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(goal: FinancialGoal) {
    setFeedback(null);
    setEditing(goal);
    setDrawerOpen(true);
  }

  // Reativar = update `status: "active"` (cancelamento é reversível).
  function reactivate(goal: FinancialGoal) {
    setActionError(null);
    setFeedback(null);
    reactivateMutation.mutate(
      { id: goal.id, payload: { status: "active" } },
      {
        onSuccess: () => setFeedback("Meta reativada."),
        onError: (mutationError) => setActionError(getGoalErrorMessage(mutationError, "save")),
      },
    );
  }

  function handleDone(message: string) {
    setDrawerOpen(false);
    setEditing(null);
    setContributing(null);
    setCanceling(null);
    setActionError(null);
    setFeedback(message);
  }

  return (
    <section className="glx-screen" aria-label="Metas financeiras">
      <div className="tlx-toolbar">
        <div className="tlx-toolbar-lead" role="group" aria-label="Filtrar por status">
          {statusChips.map((chip) => (
            <button
              aria-pressed={statusFilter === chip.key}
              className="txx-chip"
              key={chip.key}
              onClick={() => setStatusFilter(chip.key)}
              type="button"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glx-content">
        {feedback ? (
          <p className="mutation-feedback" role="status">
            {feedback}
          </p>
        ) : null}
        {actionError ? (
          <p className="glx-action-error" role="alert">
            {actionError}
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
          <div aria-busy="true" aria-label="Carregando metas" className="glx-skeleton" role="status">
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
              <strong>Falha ao carregar metas</strong>
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
            <GoalsHero overview={overview.data} />
            {overview.data.goals.length === 0 ? (
              <div className="tlx-state">
                <div>
                  <span className="tlx-state-icon tlx-tone-blue">
                    <Target aria-hidden="true" size={24} />
                  </span>
                  <strong>Nenhuma meta criada</strong>
                  <p>Defina objetivos de poupança e acompanhe o progresso com aportes.</p>
                  <button className="tlx-state-cta" onClick={openCreate} type="button">
                    <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
                    Nova meta
                  </button>
                </div>
              </div>
            ) : visibleGoals.length === 0 ? (
              <div className="tlx-state">
                <div>
                  <span className="tlx-state-icon tlx-tone-blue">
                    <Target aria-hidden="true" size={24} />
                  </span>
                  <strong>Nenhuma meta com este filtro</strong>
                  <p>Ajuste o filtro ou a busca para ver suas metas.</p>
                </div>
              </div>
            ) : (
              <GoalsGrid
                goals={visibleGoals}
                onCancel={setCanceling}
                onContribute={setContributing}
                onEdit={openEdit}
                onReactivate={reactivate}
              />
            )}
          </>
        ) : null}
      </div>

      <GoalDrawer
        editing={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={handleDone}
        open={drawerOpen}
      />

      <GoalContributionDrawer
        goal={contributing}
        onClose={() => setContributing(null)}
        onSaved={handleDone}
        open={contributing !== null}
      />

      <CancelGoalDialog
        goal={canceling}
        onClose={() => setCanceling(null)}
        onDone={handleDone}
        open={canceling !== null}
      />
    </section>
  );
}
