"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Plus, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type {
  Account,
  Category,
  FinancialEvent,
  ListFinancialEventsParams,
} from "@/api/generated/client";
import { useCreditCards } from "@/features/dashboard/queries/use-credit-cards";
import { EventDrawer } from "@/features/events/components/event-drawer";
import { EventsList } from "@/features/events/components/events-list";
import {
  EventsToolbar,
  type EventStatusFilter,
  type EventTypeFilter,
} from "@/features/events/components/events-toolbar";
import { CancelEventDialog } from "@/features/events/components/cancel-event-dialog";
import { PostponeEventDialog } from "@/features/events/components/postpone-event-dialog";
import { RealizeEventDialog } from "@/features/events/components/realize-event-dialog";
import { getEventErrorMessage } from "@/features/events/lib/event-error-message";
import { useConfirmFinancialEvent } from "@/features/events/mutations/use-financial-event-mutations";
import { useFinancialEvents } from "@/features/events/queries/use-financial-events";
import {
  listTransactionAccountsData,
  listTransactionCategoriesData,
} from "@/features/transactions/api/transactions";
import { ApiError } from "@/lib/http";
import { useGlobalSearch } from "@/providers/search-provider";

/** evento que abre o drawer a partir do CTA global do header */
export const OPEN_EVENT_DRAWER_EVENT = "fluxtrackr:new-event";

/** tempo do realce do card focado via ?focus=<id> */
const FOCUS_HIGHLIGHT_MS = 3200;

export function EventsScreen() {
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FinancialEvent | null>(null);
  const [postponing, setPostponing] = useState<FinancialEvent | null>(null);
  const [canceling, setCanceling] = useState<FinancialEvent | null>(null);
  const [realizing, setRealizing] = useState<FinancialEvent | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expiredFocusId, setExpiredFocusId] = useState<string | null>(null);
  const { query: search } = useGlobalSearch();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");

  const params = useMemo<ListFinancialEventsParams>(
    () => ({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    }),
    [statusFilter, typeFilter],
  );

  const events = useFinancialEvents(params);
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
  const creditCards = useCreditCards();

  const categoriesById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );
  const accountsById = useMemo(
    () => new Map((accounts.data ?? []).map((account) => [account.id, account])),
    [accounts.data],
  );
  const creditCardsById = useMemo(
    () => new Map((creditCards.data ?? []).map((creditCard) => [creditCard.id, creditCard])),
    [creditCards.data],
  );

  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = events.data ?? [];
    if (!term) return list;
    return list.filter((event) => event.name.toLowerCase().includes(term));
  }, [events.data, search]);

  useEffect(() => {
    function openCreate() {
      setEditing(null);
      setDrawerOpen(true);
    }
    window.addEventListener(OPEN_EVENT_DRAWER_EVENT, openCreate);
    return () => window.removeEventListener(OPEN_EVENT_DRAWER_EVENT, openCreate);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // ?focus=<id> (links vindos da Timeline/Dashboard): scroll até o card + realce.
  const focusedId = focusParam && focusParam !== expiredFocusId && events.data ? focusParam : null;

  useEffect(() => {
    if (!focusParam || !events.data) return;
    document
      .querySelector(`[data-event-id="${CSS.escape(focusParam)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setExpiredFocusId(focusParam), FOCUS_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [focusParam, events.data]);

  const confirmMutation = useConfirmFinancialEvent();

  function confirmEvent(event: FinancialEvent) {
    setActionError(null);
    setFeedback(null);
    confirmMutation.mutate(event.id, {
      onSuccess: () => setFeedback("Evento confirmado."),
      onError: (mutationError) => setActionError(getEventErrorMessage(mutationError, "confirm")),
    });
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(event: FinancialEvent) {
    setEditing(event);
    setDrawerOpen(true);
  }

  function handleDone(message: string) {
    setDrawerOpen(false);
    setEditing(null);
    setPostponing(null);
    setCanceling(null);
    setRealizing(null);
    setActionError(null);
    setFeedback(message);
  }

  const hasEvents = (events.data ?? []).length > 0;

  return (
    <section className="evx-screen" aria-label="Eventos financeiros">
      <EventsToolbar
        onChangeStatus={setStatusFilter}
        onChangeType={setTypeFilter}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />

      <div className="evx-content">
        {feedback ? (
          <p className="mutation-feedback" role="status">
            {feedback}
          </p>
        ) : null}
        {actionError ? (
          <p className="evx-action-error" role="alert">
            {actionError}
          </p>
        ) : null}
        {events.isRefetchError ? (
          <div className="timeline-refetch-alert tlx-refetch-alert" role="alert">
            <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
            <button
              className="secondary-button"
              onClick={() => events.refetch({ cancelRefetch: false })}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {events.isPending ? (
          <div aria-busy="true" aria-label="Carregando eventos" className="evx-skeleton" role="status">
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {events.isError && !events.data ? (
          <div className="tlx-state" role="alert">
            <div>
              <span className="tlx-state-icon tlx-tone-red">
                <TriangleAlert aria-hidden="true" size={24} />
              </span>
              <strong>Falha ao carregar eventos</strong>
              <p>Verifique a conexão e tente novamente.</p>
              <button
                className="tlx-state-retry"
                onClick={() => events.refetch({ cancelRefetch: false })}
                type="button"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}

        {events.data ? (
          !hasEvents ? (
            <div className="tlx-state">
              <div>
                <span className="tlx-state-icon tlx-tone-blue">
                  <CalendarClock aria-hidden="true" size={24} />
                </span>
                <strong>Nenhum evento por aqui</strong>
                <p>Planeje compromissos futuros — confirme, adie ou realize quando chegar a hora.</p>
                <button className="tlx-state-cta" onClick={openCreate} type="button">
                  <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
                  Novo evento
                </button>
              </div>
            </div>
          ) : visibleEvents.length === 0 ? (
            <div className="tlx-state">
              <div>
                <span className="tlx-state-icon tlx-tone-blue">
                  <CalendarClock aria-hidden="true" size={24} />
                </span>
                <strong>Nenhum evento com estes filtros</strong>
                <p>Ajuste os filtros ou a busca para encontrar seus eventos.</p>
              </div>
            </div>
          ) : (
            <EventsList
              accountsById={accountsById}
              categoriesById={categoriesById}
              creditCardsById={creditCardsById}
              events={visibleEvents}
              focusedId={focusedId}
              onCancel={setCanceling}
              onConfirm={confirmEvent}
              onEdit={openEdit}
              onPostpone={setPostponing}
              onRealize={setRealizing}
            />
          )
        ) : null}
      </div>

      <EventDrawer
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        editing={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={handleDone}
        open={drawerOpen}
      />

      <PostponeEventDialog
        event={postponing}
        onClose={() => setPostponing(null)}
        onDone={handleDone}
        open={postponing !== null}
      />

      <CancelEventDialog
        event={canceling}
        onClose={() => setCanceling(null)}
        onDone={handleDone}
        open={canceling !== null}
      />

      <RealizeEventDialog
        accountsById={accountsById}
        creditCardsById={creditCardsById}
        event={realizing}
        onClose={() => setRealizing(null)}
        onDone={handleDone}
        open={realizing !== null}
      />
    </section>
  );
}
