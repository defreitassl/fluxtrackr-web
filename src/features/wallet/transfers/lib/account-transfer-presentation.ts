import type { Account, AccountTransfer } from "@/api/generated/client";

export type TransferDirection = "sent" | "received";

export function getTransferDirection(transfer: AccountTransfer, accountId: string): TransferDirection {
  return transfer.sourceAccountId === accountId ? "sent" : "received";
}

export function getOppositeTransferAccount(
  transfer: AccountTransfer,
  selectedAccountId: string,
  accounts: Account[],
): Account | undefined {
  const oppositeId = transfer.sourceAccountId === selectedAccountId
    ? transfer.destinationAccountId
    : transfer.sourceAccountId;
  return accounts.find((account) => account.id === oppositeId);
}
