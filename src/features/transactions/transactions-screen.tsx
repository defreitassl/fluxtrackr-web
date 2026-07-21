"use client";

import { useQuery } from "@tanstack/react-query";
import { ChartNoAxesColumn, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Account, Category, Transaction } from "@/api/generated/client";
import {
  listTransactionAccountsData,
  listTransactionCategoriesData,
} from "@/features/transactions/api/transactions";
import { DeleteTransactionsDialog } from "@/features/transactions/components/delete-transactions-dialog";
import { RecategorizeDialog } from "@/features/transactions/components/recategorize-dialog";
import { TransactionDrawer } from "@/features/transactions/components/transaction-drawer";
import { TransactionsTable } from "@/features/transactions/components/transactions-table";
import { TransactionsToolbar } from "@/features/transactions/components/transactions-toolbar";
import {
  transactionAccountLabel,
  transactionCategoryLabel,
} from "@/features/transactions/lib/transaction-presentation";
import { buildTransactionsCsv, downloadCsv } from "@/features/transactions/lib/transactions-csv";
import {
  initialTransactionsFilters,
  toListParams,
  type TransactionsFilters,
} from "@/features/transactions/lib/transactions-filters";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/http";
import { useGlobalSearch } from "@/providers/search-provider";

const PAGE_SIZE = 8;

/** eventos que abrem o drawer a partir do CTA global do header */
export const OPEN_TRANSACTION_DRAWER_EVENT = "fluxtrackr:new-transaction";

export function TransactionsScreen() {
  const [filters, setFilters] = useState<TransactionsFilters>(initialTransactionsFilters);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [recategorizing, setRecategorizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { query: search } = useGlobalSearch();

  const params = useMemo(() => toListParams(filters), [filters]);
  const transactions = useTransactions(params);
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

  const categoriesById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );
  const accountsById = useMemo(
    () => new Map((accounts.data ?? []).map((account) => [account.id, account])),
    [accounts.data],
  );

  const filtered = useMemo(() => {
    const list = [...(transactions.data ?? [])]
      .filter((transaction) => (filters.source ? transaction.source === filters.source : true))
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((transaction) => {
      const haystack = [
        transaction.description,
        transaction.amount,
        transactionCategoryLabel(transaction.categoryId, categoriesById),
        transactionAccountLabel(transaction.accountId, accountsById),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [transactions.data, filters.source, search, categoriesById, accountsById]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const summary = useMemo(() => {
    const income = filtered
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    const expense = filtered
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
    return { income, expense, result: income - expense };
  }, [filtered]);

  const selectedTransactions = useMemo(
    () => filtered.filter((transaction) => selected.has(transaction.id)),
    [filtered, selected],
  );

  useEffect(() => {
    function openDrawer() {
      setEditing(null);
      setDrawerOpen(true);
    }
    window.addEventListener(OPEN_TRANSACTION_DRAWER_EVENT, openDrawer);
    return () => window.removeEventListener(OPEN_TRANSACTION_DRAWER_EVENT, openDrawer);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  function applyFilters(patch: Partial<TransactionsFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
    setSelected(new Set());
  }

  function toggleRow(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const allSelected = rows.length > 0 && rows.every((row) => current.has(row.id));
      const next = new Set(current);
      if (allSelected) rows.forEach((row) => next.delete(row.id));
      else rows.forEach((row) => next.add(row.id));
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setDrawerOpen(true);
  }

  function handleSaved(message: string) {
    setDrawerOpen(false);
    setEditing(null);
    setFeedback(message);
  }

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, currentPage * PAGE_SIZE);
  const rangeLabel =
    filtered.length === 0
      ? "Nenhuma movimentação"
      : `Mostrando ${rangeStart}–${rangeEnd} de ${filtered.length} movimentações`;

  return (
    <section className="txx-screen" aria-label="Transações">
      <TransactionsToolbar
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        filters={filters}
        moreFiltersOpen={moreFiltersOpen}
        onChange={applyFilters}
        onExport={() =>
          downloadCsv(
            buildTransactionsCsv(filtered, categoriesById, accountsById),
            `fluxtrackr-transacoes-${filters.month || "todas"}.csv`,
          )
        }
        onToggleMoreFilters={() => setMoreFiltersOpen((value) => !value)}
      />

      <div className="txx-content">
        {feedback ? (
          <p className="mutation-feedback" role="status">
            {feedback}
          </p>
        ) : null}
        {transactions.isRefetchError ? (
          <div className="timeline-refetch-alert tlx-refetch-alert" role="alert">
            <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
            <button
              className="secondary-button"
              onClick={() => transactions.refetch({ cancelRefetch: false })}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <div className="txx-summary">
          <div className="txx-tile">
            <div className="txx-tile-label">
              <TrendingUp aria-hidden="true" color="var(--green-strong)" size={15} />
              Entradas no período
            </div>
            <strong className="tlx-value-green">{formatCurrency(summary.income)}</strong>
          </div>
          <div className="txx-tile">
            <div className="txx-tile-label">
              <TrendingDown aria-hidden="true" color="var(--danger)" size={15} />
              Saídas no período
            </div>
            <strong className="tlx-value-red">{formatCurrency(summary.expense)}</strong>
          </div>
          <div className="txx-tile">
            <div className="txx-tile-label">
              <ChartNoAxesColumn aria-hidden="true" color="var(--blue)" size={15} />
              Resultado
            </div>
            <strong>
              {summary.result >= 0 ? "+ " : "− "}
              {formatCurrency(Math.abs(summary.result))}
            </strong>
          </div>
          <div className="txx-tile txx-tile-count">
            <div>
              <span>Lançamentos</span>
              <strong>{filtered.length}</strong>
            </div>
          </div>
        </div>

        <TransactionsTable
          accountsById={accountsById}
          categoriesById={categoriesById}
          isError={transactions.isError}
          isPending={transactions.isPending}
          onChangePage={setPage}
          onCreate={openCreate}
          onDeleteSelected={() => setDeleting(true)}
          onEdit={openEdit}
          onRecategorize={() => setRecategorizing(true)}
          onRetry={() => transactions.refetch({ cancelRefetch: false })}
          onToggleAll={toggleAll}
          onToggleRow={toggleRow}
          page={currentPage}
          pageCount={pageCount}
          rangeLabel={rangeLabel}
          rows={transactions.isPending ? [] : rows}
          selected={selected}
          totalCount={filtered.length}
        />
      </div>

      <TransactionDrawer
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        editing={editing}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        open={drawerOpen}
      />

      <RecategorizeDialog
        categories={categories.data ?? []}
        onClose={() => setRecategorizing(false)}
        onDone={(message) => {
          setRecategorizing(false);
          setSelected(new Set());
          setFeedback(message);
        }}
        open={recategorizing}
        transactions={selectedTransactions}
      />

      <DeleteTransactionsDialog
        onClose={() => setDeleting(false)}
        onDone={(message) => {
          setDeleting(false);
          setSelected(new Set());
          setFeedback(message);
        }}
        open={deleting}
        transactions={selectedTransactions}
      />
    </section>
  );
}
