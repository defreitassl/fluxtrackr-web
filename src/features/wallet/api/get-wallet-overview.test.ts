import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/generated/client", () => ({
  getAccountBalance: vi.fn(),
  listAccounts: vi.fn(),
  listCreditCardInvoices: vi.fn(),
  listCreditCards: vi.fn(),
}));

import {
  getAccountBalance,
  listAccounts,
  listCreditCardInvoices,
  listCreditCards,
} from "@/api/generated/client";
import { getWalletOverview } from "@/features/wallet/api/get-wallet-overview";
import { ApiError } from "@/lib/http";

afterEach(() => {
  vi.resetAllMocks();
});

const account = (id: string) => ({
  id,
  userId: "user-id",
  name: `Conta ${id}`,
  bank: null,
  type: "checking",
  color: "#197147",
  icon: "landmark",
  initialBalance: "0.00",
  isActive: true,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
});

const balance = (accountId: string) => ({
  accountId,
  asOf: "2026-07-20T12:00:00.000Z",
  initialBalance: "100.00",
  income: "0.00",
  expense: "0.00",
  incomingTransfers: "0.00",
  outgoingTransfers: "0.00",
  adjustments: "0.00",
  currentBalance: "100.00",
});

function mockBaseResponses(accounts = [account("account-a"), account("account-b")]) {
  vi.mocked(listAccounts).mockResolvedValue({ data: accounts, status: 200, headers: new Headers() } as never);
  vi.mocked(listCreditCards).mockResolvedValue({ data: [], status: 200, headers: new Headers() } as never);
  vi.mocked(listCreditCardInvoices).mockResolvedValue({ data: [], status: 200, headers: new Headers() } as never);
}

describe("getWalletOverview", () => {
  it("unwraps generated responses and associates each API balance with its account", async () => {
    mockBaseResponses();
    vi.mocked(getAccountBalance)
      .mockResolvedValueOnce({ data: balance("account-a"), status: 200, headers: new Headers() } as never)
      .mockResolvedValueOnce({ data: balance("account-b"), status: 200, headers: new Headers() } as never);

    await expect(getWalletOverview({ year: 2026, month: 7 })).resolves.toMatchObject({
      accounts: [
        { account: { id: "account-a" }, balance: { accountId: "account-a" } },
        { account: { id: "account-b" }, balance: { accountId: "account-b" } },
      ],
      creditCards: [],
      invoices: [],
    });
    expect(listCreditCards).toHaveBeenCalledWith({ isActive: true });
    expect(listCreditCardInvoices).toHaveBeenCalledWith({ year: 2026, month: 7 });
  });

  it("does not request balances when no accounts are returned", async () => {
    mockBaseResponses([]);

    await expect(getWalletOverview({ year: 2026, month: 7 })).resolves.toMatchObject({ accounts: [] });
    expect(getAccountBalance).not.toHaveBeenCalled();
  });

  it("starts every account balance request before awaiting the balance set", async () => {
    mockBaseResponses();
    let resolveFirst: ((value: unknown) => void) | undefined;
    let resolveSecond: ((value: unknown) => void) | undefined;
    vi.mocked(getAccountBalance)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }) as never)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }) as never);

    const overview = getWalletOverview({ year: 2026, month: 7 });
    await vi.waitFor(() => expect(getAccountBalance).toHaveBeenCalledTimes(2));
    resolveFirst?.({ data: balance("account-a"), status: 200, headers: new Headers() });
    resolveSecond?.({ data: balance("account-b"), status: 200, headers: new Headers() });

    const result = await overview;
    expect(result.accounts[0]?.account.id).toBe("account-a");
  });

  it("preserves ApiError from the generated HTTP client", async () => {
    const error = new ApiError(503, { message: "Serviço indisponível." });
    vi.mocked(listAccounts).mockRejectedValueOnce(error);
    vi.mocked(listCreditCards).mockResolvedValue({ data: [], status: 200, headers: new Headers() } as never);
    vi.mocked(listCreditCardInvoices).mockResolvedValue({ data: [], status: 200, headers: new Headers() } as never);

    await expect(getWalletOverview({ year: 2026, month: 7 })).rejects.toBe(error);
  });
});
