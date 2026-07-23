import type { AccountBalanceAdjustment, AccountTransfer } from "@/api/generated/client";

export type AccountHistoryTransferEntry = {
  id: string;
  type: "transfer_in" | "transfer_out";
  occurredAt: AccountTransfer["occurredAt"];
  transfer: AccountTransfer;
};

export type AccountHistoryAdjustmentEntry = {
  id: string;
  type: "adjustment";
  occurredAt: AccountBalanceAdjustment["occurredAt"];
  adjustment: AccountBalanceAdjustment;
};

export type AccountHistoryEntry = AccountHistoryTransferEntry | AccountHistoryAdjustmentEntry;

export const ACCOUNT_HISTORY_PAGE_SIZE = 50;

/**
 * Converte os dois históricos imutáveis da API em uma sequência de apresentação
 * ordenada do mais recente para o mais antigo.
 */
export function mergeAccountHistoryEntries(
  accountId: string,
  transfers: AccountTransfer[],
  adjustments: AccountBalanceAdjustment[],
): AccountHistoryEntry[] {
  const transferEntries = transfers.flatMap<AccountHistoryTransferEntry>((transfer) => {
    if (transfer.sourceAccountId === accountId) {
      return [{
        id: `transfer:${transfer.id}`,
        type: "transfer_out",
        occurredAt: transfer.occurredAt,
        transfer,
      }];
    }

    if (transfer.destinationAccountId === accountId) {
      return [{
        id: `transfer:${transfer.id}`,
        type: "transfer_in",
        occurredAt: transfer.occurredAt,
        transfer,
      }];
    }

    return [];
  });

  const adjustmentEntries: AccountHistoryAdjustmentEntry[] = adjustments.map((adjustment) => ({
    id: `adjustment:${adjustment.id}`,
    type: "adjustment",
    occurredAt: adjustment.occurredAt,
    adjustment,
  }));

  return [...transferEntries, ...adjustmentEntries].sort((left, right) => {
    const dateDifference = Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
    return dateDifference || right.id.localeCompare(left.id);
  });
}

/** Mantém o limite de renderização independente do estado do drawer. */
export function getVisibleAccountHistoryEntries(
  entries: AccountHistoryEntry[],
  visibleCount = ACCOUNT_HISTORY_PAGE_SIZE,
) {
  return entries.slice(0, Math.max(0, visibleCount));
}

export function hasMoreAccountHistoryEntries(
  entries: AccountHistoryEntry[],
  visibleCount = ACCOUNT_HISTORY_PAGE_SIZE,
) {
  return entries.length > Math.max(0, visibleCount);
}
