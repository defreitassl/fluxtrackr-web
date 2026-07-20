import { describe, expect, it } from "vitest";

import type { TimelineItem } from "@/api/generated/client";
import {
  getBalanceImpactLabel,
  getTimelineSourceLabel,
  getTimelineStatusLabel,
  getTimelineTypeLabel,
  groupTimelineItemsByUtcDay,
} from "@/features/timeline/lib/timeline-presentation";

const items: TimelineItem[] = [
  {
    id: "first",
    sourceId: "source-first",
    sourceType: "transaction",
    type: "expense",
    title: "Antes da meia-noite UTC",
    amount: "10.00",
    date: "2026-07-10T23:59:00.000Z",
    status: "realized",
    balanceImpact: "realized",
    accountId: null,
    creditCardId: null,
    categoryId: null,
    metadata: {},
  },
  {
    id: "second",
    sourceId: "source-second",
    sourceType: "financial_event",
    type: "income",
    title: "Depois da meia-noite UTC",
    amount: "20.00",
    date: "2026-07-11T00:01:00.000Z",
    status: "planned",
    balanceImpact: "projected",
    accountId: null,
    creditCardId: null,
    categoryId: null,
    metadata: {},
  },
];

describe("timeline presentation", () => {
  it("groups items by UTC day and preserves the API item order", () => {
    const groups = groupTimelineItemsByUtcDay(items);

    expect(groups.map((group) => group.key)).toEqual(["2026-07-10", "2026-07-11"]);
    expect(groups[0].items.map((item) => item.id)).toEqual(["first"]);
    expect(groups[1].items.map((item) => item.id)).toEqual(["second"]);
  });

  it("translates known API enums and formats unknown status strings legibly", () => {
    expect(getTimelineTypeLabel("transfer")).toBe("Transferência");
    expect(getTimelineSourceLabel("account_balance_adjustment")).toBe("Ajuste de saldo");
    expect(getBalanceImpactLabel("informational")).toBe("Informativo");
    expect(getTimelineStatusLabel("awaiting_manual_review")).toBe("Awaiting Manual Review");
  });
});
