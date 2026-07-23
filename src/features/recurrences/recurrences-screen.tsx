"use client";

import { Plus, Repeat2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Account, Category, FixedExpense, FixedIncome, Subscription } from "@/api/generated/client";
import { ArchiveRecurrenceDialog, type ArchiveRecurrenceTarget } from "@/features/recurrences/components/archive-recurrence-dialog";
import { CancelChargeDialog } from "@/features/recurrences/components/cancel-charge-dialog";
import { FixedDrawer } from "@/features/recurrences/components/fixed-drawer";
import { FixedList } from "@/features/recurrences/components/fixed-list";
import { RealizeChargeDialog } from "@/features/recurrences/components/realize-charge-dialog";
import { RecurrencesHero } from "@/features/recurrences/components/recurrences-hero";
import { RecurrencesRail } from "@/features/recurrences/components/recurrences-rail";
import { RecurrencesTabs, type RecurrenceTab } from "@/features/recurrences/components/recurrences-tabs";
import { SubscriptionDrawer } from "@/features/recurrences/components/subscription-drawer";
import { SubscriptionList } from "@/features/recurrences/components/subscription-list";
import { getRecurrenceErrorMessage } from "@/features/recurrences/lib/recurrence-error-message";
import {
  currentRecurrencePeriod,
  type RecurrenceRailItem,
} from "@/features/recurrences/lib/recurrence-presentation";
import {
  useRecurrencesRail,
  useFixedExpenses,
  useFixedIncomes,
  useSubscriptions,
  useSubscriptionsSummary,
} from "@/features/recurrences/queries/use-recurrences";
import type { FixedKind, FixedTemplate } from "@/features/recurrences/schemas/fixed-form-schema";
import { useCreditCards } from "@/features/dashboard/queries/use-credit-cards";
import {
  useUpdateFixedExpense,
  useUpdateFixedIncome,
  useUpdateSubscription,
} from "@/features/recurrences/mutations/use-recurrence-mutations";
import {
  listTransactionAccountsData,
  listTransactionCategoriesData,
} from "@/features/transactions/api/transactions";
import { useTransactionMonthlySummary } from "@/features/transactions/queries/use-monthly-summary";
import { ApiError } from "@/lib/http";
import { useGlobalSearch } from "@/providers/search-provider";

type DrawerTarget =
  | { kind: "subscription"; editing: Subscription | null }
  | { kind: FixedKind; editing: FixedTemplate | null }
  | null;

function fixedArchiveTarget(kind: FixedKind, item: FixedTemplate): ArchiveRecurrenceTarget {
  return kind === "expense"
    ? { kind: "fixed-expense", item: item as FixedExpense }
    : { kind: "fixed-income", item: item as FixedIncome };
}

export function RecurrencesScreen() {
  const [activeTab, setActiveTab] = useState<RecurrenceTab>("subscriptions");
  const [drawer, setDrawer] = useState<DrawerTarget>(null);
  const [archiving, setArchiving] = useState<ArchiveRecurrenceTarget | null>(null);
  const [realizing, setRealizing] = useState<RecurrenceRailItem | null>(null);
  const [canceling, setCanceling] = useState<RecurrenceRailItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { query: search } = useGlobalSearch();
  const period = useMemo(() => currentRecurrencePeriod(), []);
  const subscriptions = useSubscriptions();
  const summary = useSubscriptionsSummary();
  const fixedExpenses = useFixedExpenses();
  const fixedIncomes = useFixedIncomes();
  const rail = useRecurrencesRail();
  const monthlySummary = useTransactionMonthlySummary(period);
  const creditCards = useCreditCards();
  const categories = useQuery<Category[], ApiError>({
    queryKey: ["transaction-categories"],
    queryFn: listTransactionCategoriesData,
    retry: false,
  });
  const accounts = useQuery<Account[], ApiError>({
    queryKey: ["transaction-accounts"],
    queryFn: listTransactionAccountsData,
    retry: false,
  });
  const updateSubscription = useUpdateSubscription();
  const updateExpense = useUpdateFixedExpense();
  const updateIncome = useUpdateFixedIncome();

  useEffect(() => {
    const openCreate = () => {
      setFeedback(null);
      setDrawer(activeTab === "subscriptions" ? { kind: "subscription", editing: null } : { kind: activeTab === "fixed-expenses" ? "expense" : "income", editing: null });
    };
    window.addEventListener("fluxtrackr:new-recurrence", openCreate);
    return () => window.removeEventListener("fluxtrackr:new-recurrence", openCreate);
  }, [activeTab]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const filteredSubscriptions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (subscriptions.data ?? []).filter((item) => !term || item.name.toLocaleLowerCase().includes(term));
  }, [search, subscriptions.data]);
  const filteredExpenses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (fixedExpenses.data ?? []).filter((item) => !term || item.name.toLocaleLowerCase().includes(term));
  }, [fixedExpenses.data, search]);
  const filteredIncomes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (fixedIncomes.data ?? []).filter((item) => !term || item.name.toLocaleLowerCase().includes(term));
  }, [fixedIncomes.data, search]);

  const currentQuery = activeTab === "subscriptions" ? subscriptions : activeTab === "fixed-expenses" ? fixedExpenses : fixedIncomes;
  const list = activeTab === "subscriptions" ? filteredSubscriptions : activeTab === "fixed-expenses" ? filteredExpenses : filteredIncomes;
  const isLoading = currentQuery.isPending || summary.isPending || monthlySummary.isPending;
  const initialError = currentQuery.isError || summary.isError || monthlySummary.isError;

  function openCreate() {
    setFeedback(null);
    setDrawer(activeTab === "subscriptions" ? { kind: "subscription", editing: null } : { kind: activeTab === "fixed-expenses" ? "expense" : "income", editing: null });
  }

  async function toggleSubscription(item: Subscription) {
    try {
      await updateSubscription.mutateAsync({ id: item.id, payload: { isActive: !item.isActive } });
      setFeedback(item.isActive ? "Assinatura pausada." : "Assinatura ativada.");
    } catch (error) {
      setFeedback(getRecurrenceErrorMessage(error));
    }
  }

  async function toggleFixed(kind: FixedKind, item: FixedTemplate) {
    try {
      if (kind === "expense") {
        await updateExpense.mutateAsync({ id: item.id, payload: { isActive: !item.isActive } });
      } else {
        await updateIncome.mutateAsync({ id: item.id, payload: { isActive: !item.isActive } });
      }
      setFeedback(item.isActive ? "Recorrência pausada." : "Recorrência ativada.");
    } catch (error) {
      setFeedback(getRecurrenceErrorMessage(error));
    }
  }

  const emptyTitle = activeTab === "subscriptions" ? "Nenhuma assinatura cadastrada" : activeTab === "fixed-expenses" ? "Nenhum gasto fixo cadastrado" : "Nenhuma renda fixa cadastrada";
  const emptyDescription = activeTab === "subscriptions" ? "Cadastre serviços recorrentes para acompanhar suas próximas cobranças." : activeTab === "fixed-expenses" ? "Cadastre contas e compromissos mensais para não perder vencimentos." : "Cadastre receitas recorrentes para acompanhar suas entradas previstas.";

  return (
    <section aria-label="Recorrências" className="rcx-screen">
      <div className="rcx-body">
        <main className="rcx-main">
          {feedback ? <p className="mutation-feedback" role="status">{feedback}</p> : null}
          {isLoading ? <div aria-busy="true" aria-label="Carregando recorrências" className="rcx-skeleton" role="status"><span /><span /><span /></div> : null}
          {initialError && !isLoading ? (
            <div className="tlx-state" role="alert"><div><span className="tlx-state-icon tlx-tone-red"><TriangleAlert aria-hidden="true" size={24} /></span><strong>Falha ao carregar recorrências</strong><p>Verifique a conexão e tente novamente.</p><button className="tlx-state-retry" onClick={() => void Promise.all([currentQuery.refetch({ cancelRefetch: false }), summary.refetch({ cancelRefetch: false }), monthlySummary.refetch({ cancelRefetch: false })])} type="button">Tentar novamente</button></div></div>
          ) : null}
          {!isLoading && !initialError && summary.data && monthlySummary.data ? (
            <>
              <RecurrencesHero monthlySummary={monthlySummary.data} summary={summary.data} />
              <div className="rcx-content-head"><RecurrencesTabs activeTab={activeTab} onChange={setActiveTab} /><button className="primary-button" onClick={openCreate} type="button"><Plus aria-hidden="true" size={15} /> {activeTab === "subscriptions" ? "Nova assinatura" : activeTab === "fixed-expenses" ? "Novo gasto fixo" : "Nova renda fixa"}</button></div>
              {list.length === 0 ? (
                <div className="tlx-state"><div><span className="tlx-state-icon tlx-tone-green"><Repeat2 aria-hidden="true" size={24} /></span><strong>{search ? "Nenhum resultado encontrado" : emptyTitle}</strong><p>{search ? "Ajuste a busca global para encontrar a recorrência desejada." : emptyDescription}</p>{!search ? <button className="tlx-state-cta" onClick={openCreate} type="button"><Plus aria-hidden="true" size={14} /> Criar agora</button> : null}</div></div>
              ) : activeTab === "subscriptions" ? (
                <SubscriptionList accounts={accounts.data ?? []} categories={categories.data ?? []} creditCards={creditCards.data ?? []} items={filteredSubscriptions} onArchive={(item) => setArchiving({ kind: "subscription", item })} onEdit={(item) => setDrawer({ kind: "subscription", editing: item })} onToggle={(item) => void toggleSubscription(item)} />
              ) : (
                <FixedList accounts={accounts.data ?? []} categories={categories.data ?? []} items={activeTab === "fixed-expenses" ? filteredExpenses : filteredIncomes} kind={activeTab === "fixed-expenses" ? "expense" : "income"} onArchive={(kind, item) => setArchiving(fixedArchiveTarget(kind, item))} onEdit={(kind, item) => setDrawer({ kind, editing: item })} onToggle={(kind, item) => void toggleFixed(kind, item)} />
              )}
            </>
          ) : null}
        </main>

        <RecurrencesRail accounts={accounts.data ?? []} categories={categories.data ?? []} creditCards={creditCards.data ?? []} isError={rail.isError} isPending={rail.isPending} items={rail.items} onCancel={setCanceling} onRealize={setRealizing} onRetry={() => void rail.refetch()} />
      </div>

      <SubscriptionDrawer accounts={accounts.data ?? []} categories={categories.data ?? []} creditCards={creditCards.data ?? []} editing={drawer?.kind === "subscription" ? drawer.editing : null} onClose={() => setDrawer(null)} onSaved={(message) => { setDrawer(null); setFeedback(message); }} open={drawer?.kind === "subscription"} />
      <FixedDrawer accounts={accounts.data ?? []} categories={categories.data ?? []} editing={drawer && drawer.kind !== "subscription" ? drawer.editing : null} kind={drawer && drawer.kind !== "subscription" ? drawer.kind : activeTab === "fixed-incomes" ? "income" : "expense"} onClose={() => setDrawer(null)} onSaved={(message) => { setDrawer(null); setFeedback(message); }} open={Boolean(drawer && drawer.kind !== "subscription")} />
      <ArchiveRecurrenceDialog onArchived={(message) => { setArchiving(null); setFeedback(message); }} onClose={() => setArchiving(null)} open={archiving !== null} target={archiving} />
      <RealizeChargeDialog accounts={accounts.data ?? []} categories={categories.data ?? []} creditCards={creditCards.data ?? []} item={realizing} onClose={() => setRealizing(null)} onRealized={setFeedback} open={realizing !== null} />
      <CancelChargeDialog item={canceling} onCanceled={(message) => { setCanceling(null); setFeedback(message); }} onClose={() => setCanceling(null)} open={canceling !== null} />
    </section>
  );
}
