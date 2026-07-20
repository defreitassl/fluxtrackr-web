import {
  getAccountBalance,
  listAccounts,
  listCreditCardInvoices,
  listCreditCards,
  type Account,
  type AccountBalance,
  type CreditCard,
  type CreditCardInvoiceWithInstallments,
} from "@/api/generated/client";
import { ApiError } from "@/lib/http";

export type WalletAccount = {
  account: Account;
  balance: AccountBalance;
};

export type WalletOverview = {
  accounts: WalletAccount[];
  creditCards: CreditCard[];
  invoices: CreditCardInvoiceWithInstallments[];
};

export type GetWalletOverviewParams = {
  year: number;
  month: number;
};

/** Composes read-only API resources without recreating financial calculations. */
export async function getWalletOverview({ year, month }: GetWalletOverviewParams): Promise<WalletOverview> {
  const [accountsResponse, creditCardsResponse, invoicesResponse] = await Promise.all([
    listAccounts(),
    listCreditCards({ isActive: true }),
    listCreditCardInvoices({ year, month }),
  ]);
  const accounts = unwrap(accountsResponse);
  const creditCards = unwrap(creditCardsResponse);
  const invoices = unwrap(invoicesResponse);

  const accountsWithBalances = await Promise.all(accounts.map(async (account) => {
    const balance = unwrap(await getAccountBalance(account.id));
    return { account, balance };
  }));

  return { accounts: accountsWithBalances, creditCards, invoices };
}

function unwrap<T extends { data: unknown; status: number }>(response: T) {
  if (response.status !== 200) {
    throw new ApiError(response.status, response.data);
  }

  return response.data as Extract<T, { status: 200 }>["data"];
}
