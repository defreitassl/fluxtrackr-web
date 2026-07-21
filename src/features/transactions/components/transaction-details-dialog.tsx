"use client";

import { Pencil, Trash2 } from "lucide-react";

import type { Account, Category, Transaction } from "@/api/generated/client";
import { Dialog } from "@/components/ui/dialog";
import { paymentMethodLabel, transactionTypeLabel } from "@/features/transactions/lib/transaction-form";
import { transactionAccountLabel, transactionCategoryLabel, transactionSourceLabel } from "@/features/transactions/lib/transaction-presentation";
import { formatCurrency } from "@/lib/format";
import { formatUtcDateTime } from "@/features/wallet/lib/wallet-presentation";

type TransactionDetailsDialogProps = {
  transaction: Transaction;
  categoriesById: Map<string, Category>;
  accountsById: Map<string, Account>;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionDetailsDialog({
  transaction,
  categoriesById,
  accountsById,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailsDialogProps) {
  return (
    <Dialog
      description="Dados registrados e apresentados com datas em UTC."
      descriptionId="transaction-details-description"
      initialFocusSelector="#transaction-detail-edit"
      onClose={onClose}
      open
      title="Detalhe da transação"
      titleId="transaction-details-title"
    >
      <dl className="wallet-breakdown-list transaction-details-list">
        <div><dt>Descrição</dt><dd>{transaction.description}</dd></div>
        <div><dt>Valor</dt><dd>{transaction.type === "income" ? "+ " : "− "}{formatCurrency(transaction.amount)}</dd></div>
        <div><dt>Tipo</dt><dd>{transactionTypeLabel(transaction.type)}</dd></div>
        <div><dt>Data</dt><dd>{formatUtcDateTime(transaction.occurredAt)}</dd></div>
        <div><dt>Categoria</dt><dd>{transactionCategoryLabel(transaction.categoryId, categoriesById)}</dd></div>
        <div><dt>Conta</dt><dd>{transactionAccountLabel(transaction.accountId, accountsById)}</dd></div>
        <div><dt>Método de pagamento</dt><dd>{paymentMethodLabel(transaction.paymentMethod)}</dd></div>
        <div><dt>Origem</dt><dd>{transactionSourceLabel(transaction.source)}</dd></div>
        <div><dt>Criada em</dt><dd>{formatUtcDateTime(transaction.createdAt)}</dd></div>
      </dl>
      <div className="account-form-actions">
        <button className="secondary-button" id="transaction-detail-edit" onClick={() => onEdit(transaction)} type="button"><Pencil aria-hidden="true" size={16} /> Editar</button>
        <button className="danger-button" onClick={() => onDelete(transaction)} type="button"><Trash2 aria-hidden="true" size={16} /> Excluir</button>
      </div>
    </Dialog>
  );
}
