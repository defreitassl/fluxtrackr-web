import type { Account, Category, Transaction } from "@/api/generated/client";
import { paymentMethodLabel } from "@/features/transactions/lib/transaction-form";
import {
  transactionAccountLabel,
  transactionCategoryLabel,
} from "@/features/transactions/lib/transaction-presentation";

function csvCell(value: string) {
  return /[";\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  categoriesById: Map<string, Category>,
  accountsById: Map<string, Account>,
) {
  const header = ["Data", "Descrição", "Tipo", "Categoria", "Conta", "Método", "Valor"];
  const rows = transactions.map((transaction) => [
    new Date(transaction.occurredAt).toISOString().slice(0, 10),
    transaction.description,
    transaction.type === "income" ? "Receita" : "Despesa",
    transactionCategoryLabel(transaction.categoryId, categoriesById),
    transactionAccountLabel(transaction.accountId, accountsById),
    paymentMethodLabel(transaction.paymentMethod),
    `${transaction.type === "income" ? "" : "-"}${transaction.amount}`,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
