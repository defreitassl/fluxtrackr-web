"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import type { Account, Category, PaymentMethod, Transaction } from "@/api/generated/client";
import { formatSignedCurrency, type AmountTone } from "@/features/dashboard/lib/dashboard-format";
import {
  listTransactionAccountsData,
  listTransactionCategoriesData,
} from "@/features/transactions/api/transactions";
import {
  transactionAccountLabel,
  transactionCategoryLabel,
} from "@/features/transactions/lib/transaction-presentation";
import { useTransactions } from "@/features/transactions/queries/use-transactions";
import { ApiError } from "@/lib/http";

const PAGE_SIZE = 5;

const methodLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  transfer: "Transferência",
  boleto: "Boleto",
};

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function movementTone(transaction: Transaction): AmountTone {
  return transaction.type === "income" ? "positive" : "negative";
}

function MovementIcon({ transaction }: { transaction: Transaction }) {
  if (transaction.type === "income") {
    return (
      <span className="dx-mov-icon dx-tone-income">
        <TrendingUp aria-hidden="true" size={15} />
      </span>
    );
  }
  if (transaction.paymentMethod === "transfer") {
    return (
      <span className="dx-mov-icon dx-tone-transfer">
        <ArrowLeftRight aria-hidden="true" size={15} />
      </span>
    );
  }
  return (
    <span className="dx-mov-icon dx-tone-expense">
      <TrendingDown aria-hidden="true" size={15} />
    </span>
  );
}

type MovementsCardProps = {
  monthWindow: { startDate: string; endDate: string };
};

export function MovementsCard({ monthWindow: window }: MovementsCardProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const transactions = useTransactions({ startDate: window.startDate, endDate: window.endDate });
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
    const list = [...(transactions.data ?? [])].sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    );
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((transaction) => transaction.description.toLowerCase().includes(term));
  }, [transactions.data, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 1, pageCount - 2));
    return Array.from({ length: Math.min(3, pageCount) }, (_, index) => start + index);
  }, [currentPage, pageCount]);

  return (
    <section className="dx-panel dx-movements">
      <div className="dx-movements-head">
        <div>
          <h2>Movimentações</h2>
          <p>Últimos lançamentos do período selecionado.</p>
        </div>
        <label className="dx-movements-search">
          <Search aria-hidden="true" size={13} />
          <input
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar transação…"
            type="search"
            value={search}
          />
        </label>
      </div>

      <table className="dx-table">
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Movimentação</th>
            <th className="dx-th-category" scope="col">
              Categoria
            </th>
            <th className="dx-th-account" scope="col">
              Conta
            </th>
            <th className="dx-th-method" scope="col">
              Método
            </th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((transaction) => (
            <tr key={transaction.id}>
              <td className="dx-td-date">{dayFormatter.format(new Date(transaction.occurredAt))}</td>
              <td>
                <div className="dx-mov">
                  <MovementIcon transaction={transaction} />
                  <strong>{transaction.description}</strong>
                </div>
              </td>
              <td className="dx-td-category dx-td-muted">
                {transactionCategoryLabel(transaction.categoryId, categoriesById)}
              </td>
              <td className="dx-td-account dx-td-muted">
                {transactionAccountLabel(transaction.accountId, accountsById)}
              </td>
              <td className="dx-td-method">
                <span className="dx-pill">
                  {transaction.paymentMethod ? methodLabels[transaction.paymentMethod] : "—"}
                </span>
              </td>
              <td>
                <span
                  className={`dx-amount ${
                    movementTone(transaction) === "positive" ? "dx-amount-positive" : "dx-amount-negative"
                  }`}
                >
                  {formatSignedCurrency(transaction.amount, movementTone(transaction))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 ? (
        <div className="dx-table-empty">
          {transactions.isPending ? "Carregando movimentações…" : "Nenhuma movimentação no período."}
        </div>
      ) : null}

      <div className="dx-table-foot">
        <span>
          Mostrando {rows.length} de {filtered.length} movimentações
        </span>
        <div className="dx-pager">
          <button
            className="dx-pager-nav"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            type="button"
          >
            Anterior
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              aria-current={pageNumber === currentPage ? "page" : undefined}
              className="dx-pager-page"
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="dx-pager-nav"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
            type="button"
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}
