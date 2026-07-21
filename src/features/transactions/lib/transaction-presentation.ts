import type { Account, Category, TransactionSource } from "@/api/generated/client";

export function transactionCategoryLabel(categoryId: string | null | undefined, categoriesById: Map<string, Category>) {
  if (!categoryId) return "Sem categoria";
  const category = categoriesById.get(categoryId);
  if (!category) return "Categoria arquivada ou indisponível";
  return `${category.name}${category.isActive ? "" : " · Arquivada"}`;
}

export function transactionAccountLabel(accountId: string | null | undefined, accountsById: Map<string, Account>) {
  if (!accountId) return "Sem conta";
  return accountsById.get(accountId)?.name ?? "Conta arquivada ou indisponível";
}

export function transactionSourceLabel(source: TransactionSource) {
  return source === "telegram" ? "Telegram" : "Aplicativo";
}
