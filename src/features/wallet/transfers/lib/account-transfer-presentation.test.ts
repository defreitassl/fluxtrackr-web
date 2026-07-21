import { describe, expect, it } from "vitest";

import { getOppositeTransferAccount, getTransferDirection } from "@/features/wallet/transfers/lib/account-transfer-presentation";

const transfer = { sourceAccountId: "source", destinationAccountId: "destination" } as never;
const accounts = [{ id: "source", name: "Origem" }, { id: "destination", name: "Destino" }] as never;

describe("account transfer presentation", () => {
  it("distinguishes sent and received transfers and resolves the opposite account", () => {
    expect(getTransferDirection(transfer, "source")).toBe("sent");
    expect(getTransferDirection(transfer, "destination")).toBe("received");
    expect(getOppositeTransferAccount(transfer, "source", accounts)?.name).toBe("Destino");
    expect(getOppositeTransferAccount(transfer, "destination", accounts)?.name).toBe("Origem");
  });

  it("allows an unavailable opposite account fallback", () => {
    expect(getOppositeTransferAccount(transfer, "source", [])).toBeUndefined();
  });
});
