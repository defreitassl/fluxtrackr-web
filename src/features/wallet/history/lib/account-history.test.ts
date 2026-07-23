import { describe, expect, it } from "vitest";

import type { AccountBalanceAdjustment, AccountTransfer } from "@/api/generated/client";
import {
  ACCOUNT_HISTORY_PAGE_SIZE,
  getVisibleAccountHistoryEntries,
  hasMoreAccountHistoryEntries,
  mergeAccountHistoryEntries,
  type AccountHistoryEntry,
} from "@/features/wallet/history/lib/account-history";

function makeTransfer(overrides: Partial<AccountTransfer> = {}): AccountTransfer {
  return {
    id: "transfer-1",
    userId: "user-1",
    sourceAccountId: "source-account",
    destinationAccountId: "destination-account",
    amount: "120.00",
    description: null,
    occurredAt: "2026-07-01T12:00:00.000Z",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeAdjustment(overrides: Partial<AccountBalanceAdjustment> = {}): AccountBalanceAdjustment {
  return {
    id: "adjustment-1",
    userId: "user-1",
    accountId: "account-1",
    previousBalance: "100.00",
    newBalance: "150.00",
    difference: "50.00",
    reason: null,
    occurredAt: "2026-07-03T12:00:00.000Z",
    createdAt: "2026-07-03T12:00:00.000Z",
    ...overrides,
  };
}

describe("mergeAccountHistoryEntries", () => {
  it("merges records in descending order and marks transfer direction relative to the account", () => {
    const incoming = makeTransfer({
      id: "incoming",
      sourceAccountId: "savings-account",
      destinationAccountId: "account-1",
      occurredAt: "2026-07-02T12:00:00.000Z",
    });
    const outgoing = makeTransfer({
      id: "outgoing",
      sourceAccountId: "account-1",
      destinationAccountId: "savings-account",
    });
    const adjustment = makeAdjustment();
    const unrelated = makeTransfer({
      id: "unrelated",
      sourceAccountId: "other-source",
      destinationAccountId: "other-destination",
      occurredAt: "2026-07-04T12:00:00.000Z",
    });

    const entries = mergeAccountHistoryEntries("account-1", [outgoing, unrelated, incoming], [adjustment]);

    expect(entries.map((entry) => entry.type)).toEqual(["adjustment", "transfer_in", "transfer_out"]);
    expect(entries[0]).toMatchObject({ id: "adjustment:adjustment-1", adjustment });
    expect(entries[1]).toMatchObject({ id: "transfer:incoming", transfer: incoming });
    expect(entries[2]).toMatchObject({ id: "transfer:outgoing", transfer: outgoing });
  });

  it("exposes the first 50 records and whether a drawer can show more", () => {
    const entries: AccountHistoryEntry[] = Array.from({ length: ACCOUNT_HISTORY_PAGE_SIZE + 1 }, (_, index) => ({
      id: `adjustment:${index}`,
      type: "adjustment" as const,
      occurredAt: "2026-07-03T12:00:00.000Z",
      adjustment: makeAdjustment({ id: String(index) }),
    }));

    expect(getVisibleAccountHistoryEntries(entries)).toHaveLength(ACCOUNT_HISTORY_PAGE_SIZE);
    expect(hasMoreAccountHistoryEntries(entries)).toBe(true);
    expect(hasMoreAccountHistoryEntries(entries, entries.length)).toBe(false);
  });
});
