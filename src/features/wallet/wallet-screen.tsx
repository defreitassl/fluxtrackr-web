"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Account, AccountTransfer, CreateBalanceAdjustmentResponse } from "@/api/generated/client";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { CreateAccountDialog } from "@/features/wallet/accounts/components/create-account-dialog";
import { EditAccountDialog } from "@/features/wallet/accounts/components/edit-account-dialog";
import { BalanceAdjustmentDialog } from "@/features/wallet/adjustments/components/balance-adjustment-dialog";
import { AccountTransferDialog } from "@/features/wallet/transfers/components/account-transfer-dialog";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { AccountsSection } from "@/features/wallet/components/accounts-section";
import { CreditCardsSection } from "@/features/wallet/components/credit-cards-section";
import { EmptyWallet } from "@/features/wallet/components/wallet-empty-states";
import { WalletFeedback, type RefetchErrorKind } from "@/features/wallet/components/wallet-feedback";
import { WalletHeader } from "@/features/wallet/components/wallet-header";
import { WalletSkeleton } from "@/features/wallet/components/wallet-skeleton";
import { WalletSummary } from "@/features/wallet/components/wallet-summary";
import { useCurrentWalletPeriod } from "@/features/wallet/hooks/use-current-wallet-period";
import { resolveWalletCardSelection } from "@/features/wallet/lib/wallet-selection";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";
import { formatCurrency } from "@/lib/format";

const SUCCESS_MESSAGE_TIMEOUT = 5000;

export function WalletScreen() {
  const { period, refreshPeriod } = useCurrentWalletPeriod();
  const wallet = useWalletOverview(period);
  const dashboard = useDashboardOverview();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [adjustingAccountId, setAdjustingAccountId] = useState<string | null>(null);
  const [transferringAccountId, setTransferringAccountId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = wallet.data;

  // A troca de período reaproveita a derivação de seleção: se a fatura anterior
  // deixar de existir, `resolveWalletCardSelection` cai para a primeira fatura
  // compatível do cartão — sem manter uma fatura do mês anterior selecionada.
  useEffect(() => {
    return () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    };
  }, []);

  const selectedAccount =
    data?.accounts.find(({ account }) => account.id === selectedAccountId) ?? data?.accounts[0];
  const adjustingAccount = data?.accounts.find(({ account }) => account.id === adjustingAccountId);
  const transferringAccount = data?.accounts.find(({ account }) => account.id === transferringAccountId);

  const cardSelection = useMemo(
    () =>
      resolveWalletCardSelection({
        creditCards: data?.creditCards ?? [],
        invoices: data?.invoices ?? [],
        selectedCardId,
        selectedInvoiceId,
      }),
    [data?.creditCards, data?.invoices, selectedCardId, selectedInvoiceId],
  );

  const isRefreshing = wallet.isFetching || dashboard.isFetching;
  const refetchErrorKind: RefetchErrorKind = wallet.isRefetchError
    ? "all"
    : dashboard.isRefetchError
      ? "dashboard-only"
      : "none";

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimer.current) {
      clearTimeout(successTimer.current);
    }
    successTimer.current = setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_TIMEOUT);
  };

  const refreshWallet = () => {
    if (isRefreshing) {
      return;
    }
    const { changed } = refreshPeriod();
    if (changed) {
      // A nova query key da Carteira busca o período UTC recém-calculado.
      // Não refetchamos a chave anterior durante a troca de mês.
      void dashboard.refetch({ cancelRefetch: false });
      return;
    }

    void Promise.all([
      wallet.refetch({ cancelRefetch: false }),
      dashboard.refetch({ cancelRefetch: false }),
    ]);
  };

  const handleSelectCard = (id: string) => {
    setSelectedCardId(id);
    const firstInvoice = data?.invoices.find((invoice) => invoice.creditCardId === id);
    setSelectedInvoiceId(firstInvoice?.id ?? null);
  };

  const handleCreateAccount = () => {
    setSuccessMessage(null);
    setIsCreateOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setSuccessMessage(null);
    setEditingAccount(account);
  };

  const handleAdjustAccount = (walletAccount: WalletAccount) => {
    setSuccessMessage(null);
    setAdjustingAccountId(walletAccount.account.id);
  };

  const handleTransferAccount = (account: Account) => {
    setSuccessMessage(null);
    setTransferringAccountId(account.id);
  };

  const handleAccountCreated = (account: Account) => {
    setSelectedAccountId(account.id);
    setIsCreateOpen(false);
    showSuccess("Conta criada com sucesso.");
  };

  const handleAccountUpdated = (account: Account) => {
    setSelectedAccountId(account.id);
    setEditingAccount(null);
    showSuccess("Conta atualizada com sucesso.");
  };

  const handleBalanceAdjusted = (response: CreateBalanceAdjustmentResponse) => {
    setSelectedAccountId(response.adjustment.accountId);
    setAdjustingAccountId(null);
    showSuccess(`Saldo ajustado para ${formatCurrency(response.currentBalance)}.`);
  };

  const handleTransferred = (transfer: AccountTransfer) => {
    setSelectedAccountId(transfer.sourceAccountId);
    setTransferringAccountId(null);
    showSuccess(`Transferência de ${formatCurrency(transfer.amount)} realizada com sucesso.`);
  };

  const isWalletEmpty = data
    ? data.accounts.length === 0 && data.creditCards.length === 0
    : false;

  return (
    <section className="wallet-screen" aria-labelledby="wallet-title">
      <WalletHeader
        isInitialLoading={wallet.isPending}
        isRefreshing={isRefreshing}
        onRefresh={refreshWallet}
      />

      {wallet.isPending && !data ? <WalletSkeleton /> : null}

      {wallet.isError && !data ? (
        <ErrorState
          description="Não foi possível obter sua Carteira agora. Tente novamente em instantes."
          onRetry={refreshWallet}
          title="Carteira indisponível"
        />
      ) : null}

      {data ? (
        <div className="wallet-content" aria-busy={isRefreshing}>
          <WalletFeedback
            isRefreshing={isRefreshing}
            onRetry={refreshWallet}
            refetchErrorKind={refetchErrorKind}
          />

          <WalletSummary
            accountCount={data.accounts.length}
            cardCount={data.creditCards.length}
            dashboard={dashboard.data}
            invoiceCount={data.invoices.length}
            isDashboardLoading={dashboard.isPending}
            isDashboardUnavailable={dashboard.isError && !dashboard.data}
          />

          {isWalletEmpty ? (
            <EmptyWallet onCreateAccount={handleCreateAccount} />
          ) : (
            <div className="wallet-sections">
              <AccountsSection
                accounts={data.accounts}
                onAdjustAccount={handleAdjustAccount}
                onCreateAccount={handleCreateAccount}
                onEditAccount={handleEditAccount}
                onSelectAccount={setSelectedAccountId}
                onTransferAccount={handleTransferAccount}
                selectedAccount={selectedAccount}
                successMessage={successMessage}
              />

              <CreditCardsSection
                cardInvoices={cardSelection.cardInvoices}
                creditCards={data.creditCards}
                invoices={data.invoices}
                onSelectCard={handleSelectCard}
                onSelectInvoice={setSelectedInvoiceId}
                orphanInvoices={cardSelection.orphanInvoices}
                selectedCard={cardSelection.selectedCard}
                selectedInvoice={cardSelection.selectedInvoice}
              />
            </div>
          )}
        </div>
      ) : null}

      {isCreateOpen ? (
        <CreateAccountDialog
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleAccountCreated}
          open
        />
      ) : null}
      {editingAccount ? (
        <EditAccountDialog
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onUpdated={handleAccountUpdated}
          open
        />
      ) : null}
      {adjustingAccount ? (
        <BalanceAdjustmentDialog
          account={adjustingAccount.account}
          currentBalance={adjustingAccount.balance.currentBalance}
          onAdjusted={handleBalanceAdjusted}
          onClose={() => setAdjustingAccountId(null)}
          open
        />
      ) : null}
      {transferringAccount ? (
        <AccountTransferDialog
          accounts={data?.accounts ?? []}
          initialSourceAccountId={transferringAccount.account.id}
          onClose={() => setTransferringAccountId(null)}
          onTransferred={handleTransferred}
          open
        />
      ) : null}
    </section>
  );
}
