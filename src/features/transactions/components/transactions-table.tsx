"use client";

import { Check, Pencil, Plus, ReceiptText, TriangleAlert } from "lucide-react";

import type { Account, Category, Transaction } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import { paymentMethodLabel } from "@/features/transactions/lib/transaction-form";
import {
  transactionAccountLabel,
  transactionCategoryLabel,
} from "@/features/transactions/lib/transaction-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function rowTone(transaction: Transaction) {
  if (transaction.type === "income") return "green";
  return transaction.paymentMethod === "credit" ? "amber" : "red";
}

function RowIcon({ transaction, categoriesById }: { transaction: Transaction; categoriesById: Map<string, Category> }) {
  const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
  const Icon = category ? categoryPresentation(category).Icon : ReceiptText;
  return (
    <span className={`txx-mov-icon tlx-tone-${rowTone(transaction)}`}>
      <Icon aria-hidden="true" size={15} />
    </span>
  );
}

type TransactionsTableProps = {
  rows: Transaction[];
  totalCount: number;
  page: number;
  pageCount: number;
  rangeLabel: string;
  isPending: boolean;
  isError: boolean;
  selected: Set<string>;
  categoriesById: Map<string, Category>;
  accountsById: Map<string, Account>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (transaction: Transaction) => void;
  onChangePage: (page: number) => void;
  onRetry: () => void;
  onCreate: () => void;
  onRecategorize: () => void;
  onDeleteSelected: () => void;
};

function pageItems(page: number, pageCount: number): Array<number | "…"> {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const middle = Math.min(Math.max(page, 2), pageCount - 2);
  const pages: Array<number | "…"> = [1];
  if (middle > 2) pages.push("…");
  for (let value = Math.max(2, middle - 1); value <= Math.min(pageCount - 1, middle + 1); value += 1) {
    pages.push(value);
  }
  if (middle < pageCount - 2) pages.push("…");
  pages.push(pageCount);
  return pages;
}

export function TransactionsTable({
  rows,
  totalCount,
  page,
  pageCount,
  rangeLabel,
  isPending,
  isError,
  selected,
  categoriesById,
  accountsById,
  onToggleRow,
  onToggleAll,
  onEdit,
  onChangePage,
  onRetry,
  onCreate,
  onRecategorize,
  onDeleteSelected,
}: TransactionsTableProps) {
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  return (
    <div className="txx-table-card">
      {selected.size > 0 ? (
        <div className="txx-bulkbar">
          <span>
            {selected.size} {selected.size === 1 ? "selecionada" : "selecionadas"}
          </span>
          <div className="txx-bulkbar-actions">
            <button className="txx-bulk-recat" onClick={onRecategorize} type="button">
              Recategorizar
            </button>
            <button className="txx-bulk-delete" onClick={onDeleteSelected} type="button">
              Excluir
            </button>
          </div>
        </div>
      ) : null}

      <table className="txx-table">
        <thead>
          <tr>
            <th className="txx-col-check" scope="col">
              <button
                aria-checked={allSelected}
                aria-label={allSelected ? "Desmarcar todas" : "Selecionar todas"}
                className="txx-checkbox"
                onClick={onToggleAll}
                role="checkbox"
                type="button"
              >
                {allSelected ? <Check aria-hidden="true" size={11} strokeWidth={3} /> : null}
              </button>
            </th>
            <th scope="col">Data</th>
            <th scope="col">Movimentação</th>
            <th className="txx-th-category" scope="col">
              Categoria
            </th>
            <th className="txx-th-account" scope="col">
              Conta
            </th>
            <th className="txx-th-method" scope="col">
              Método
            </th>
            <th className="txx-col-amount" scope="col">
              Valor
            </th>
            <th className="txx-col-edit" scope="col">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((transaction) => {
            const isSelected = selected.has(transaction.id);
            return (
              <tr
                className={cn(isSelected && "txx-row-selected")}
                key={transaction.id}
                onClick={() => onEdit(transaction)}
              >
                <td className="txx-col-check">
                  <button
                    aria-checked={isSelected}
                    aria-label={`Selecionar ${transaction.description}`}
                    className="txx-checkbox"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleRow(transaction.id);
                    }}
                    role="checkbox"
                    type="button"
                  >
                    {isSelected ? <Check aria-hidden="true" size={11} strokeWidth={3} /> : null}
                  </button>
                </td>
                <td className="txx-td-date">{dayFormatter.format(new Date(transaction.occurredAt))}</td>
                <td>
                  <div className="txx-mov">
                    <RowIcon categoriesById={categoriesById} transaction={transaction} />
                    <strong>{transaction.description}</strong>
                  </div>
                </td>
                <td className="txx-td-category txx-td-muted">
                  {transactionCategoryLabel(transaction.categoryId, categoriesById)}
                </td>
                <td className="txx-td-account txx-td-muted">
                  {transactionAccountLabel(transaction.accountId, accountsById)}
                </td>
                <td className="txx-td-method">
                  {transaction.paymentMethod ? (
                    <span className="dx-pill">{paymentMethodLabel(transaction.paymentMethod)}</span>
                  ) : (
                    <span className="txx-td-muted">—</span>
                  )}
                </td>
                <td className="txx-col-amount">
                  <span
                    className={`dx-amount ${
                      transaction.type === "income" ? "dx-amount-positive" : "dx-amount-negative"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "−"} {formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td className="txx-col-edit">
                  <button
                    aria-label={`Editar ${transaction.description}`}
                    className="txx-edit-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(transaction);
                    }}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {isPending ? (
        <div aria-busy="true" aria-label="Carregando movimentações" className="txx-shimmer-list" role="status">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {isError && rows.length === 0 && !isPending ? (
        <div className="tlx-state" role="alert">
          <div>
            <span className="tlx-state-icon tlx-tone-red">
              <TriangleAlert aria-hidden="true" size={24} />
            </span>
            <strong>Falha ao carregar movimentações</strong>
            <p>Verifique a conexão. Filtros e busca foram preservados.</p>
            <button className="tlx-state-retry" onClick={onRetry} type="button">
              Tentar novamente
            </button>
          </div>
        </div>
      ) : null}

      {!isPending && !isError && rows.length === 0 ? (
        <div className="tlx-state">
          <div>
            <span className="tlx-state-icon tlx-tone-green">
              <ReceiptText aria-hidden="true" size={24} />
            </span>
            <strong>Nenhuma movimentação neste período</strong>
            <p>Ajuste os filtros ou registre um novo lançamento.</p>
            <button className="tlx-state-cta" onClick={onCreate} type="button">
              <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
              Nova movimentação
            </button>
          </div>
        </div>
      ) : null}

      <div className="txx-table-foot">
        <span>{rangeLabel}</span>
        <div className="dx-pager">
          <button
            className="dx-pager-nav"
            disabled={page <= 1}
            onClick={() => onChangePage(page - 1)}
            type="button"
          >
            Anterior
          </button>
          {pageItems(page, pageCount).map((item, index) =>
            item === "…" ? (
              <span className="txx-td-muted" key={`gap-${index}`}>
                …
              </span>
            ) : (
              <button
                aria-current={item === page ? "page" : undefined}
                className="dx-pager-page"
                key={item}
                onClick={() => onChangePage(item)}
                type="button"
              >
                {item}
              </button>
            ),
          )}
          <button
            className="dx-pager-nav"
            disabled={page >= pageCount}
            onClick={() => onChangePage(page + 1)}
            type="button"
          >
            Próxima
          </button>
        </div>
      </div>
      <span className="sr-only">{totalCount} movimentações no período</span>
    </div>
  );
}
