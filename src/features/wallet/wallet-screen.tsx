"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  Account,
  AccountTransfer,
  CreateBalanceAdjustmentResponse,
  CreditCard,
  CreditCardInvoiceWithInstallments,
  CreditCardPurchase,
  PaidCreditCardInvoice,
} from "@/api/generated/client";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { CreateAccountDialog } from "@/features/wallet/accounts/components/create-account-dialog";
import { EditAccountDialog } from "@/features/wallet/accounts/components/edit-account-dialog";
import { BalanceAdjustmentDialog } from "@/features/wallet/adjustments/components/balance-adjustment-dialog";
import { ArchiveCreditCardDialog } from "@/features/wallet/credit-cards/components/archive-credit-card-dialog";
import { CreateCreditCardDialog } from "@/features/wallet/credit-cards/components/create-credit-card-dialog";
import { CreateCreditCardPurchaseDialog } from "@/features/wallet/credit-cards/components/create-credit-card-purchase-dialog";
import { EditCreditCardDialog } from "@/features/wallet/credit-cards/components/edit-credit-card-dialog";
import { PayCreditCardInvoiceDialog } from "@/features/wallet/credit-cards/components/pay-credit-card-invoice-dialog";
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
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [isCreatePurchaseOpen, setIsCreatePurchaseOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [archivingCard, setArchivingCard] = useState<CreditCard | null>(null);
  const [archivingInvoice, setArchivingInvoice] = useState<CreditCardInvoiceWithInstallments | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
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
  const payingInvoice = data?.invoices.find((invoice) => invoice.id === payingInvoiceId) ?? null;
  const payingCard = data?.creditCards.find((card) => card.id === payingInvoice?.creditCardId) ?? null;

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

  const handleCreateCard = () => {
    setSuccessMessage(null);
    setIsCreateCardOpen(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setSuccessMessage(null);
    setEditingCard(card);
  };

  const handleArchiveCard = (card: CreditCard, currentInvoice: CreditCardInvoiceWithInstallments | undefined) => {
    setSuccessMessage(null);
    setArchivingCard(card);
    setArchivingInvoice(currentInvoice ?? null);
  };

  const handleCreatePurchase = () => {
    setSuccessMessage(null);
    setIsCreatePurchaseOpen(true);
  };

  const handlePayInvoice = (invoiceId: string) => {
    setSuccessMessage(null);
    setPayingInvoiceId(invoiceId);
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

  const handleCardCreated = (card: CreditCard) => {
    setSelectedCardId(card.id);
    setSelectedInvoiceId(null);
    setIsCreateCardOpen(false);
    showSuccess("Cartão criado com sucesso.");
  };

  const handleCardUpdated = (card: CreditCard) => {
    setSelectedCardId(card.id);
    setEditingCard(null);
    showSuccess("Cartão atualizado com sucesso.");
  };

  const handleCardArchived = (card: CreditCard) => {
    if (selectedCardId === card.id) {
      setSelectedCardId(null);
      setSelectedInvoiceId(null);
    }
    setArchivingCard(null);
    setArchivingInvoice(null);
    showSuccess("Cartão arquivado com sucesso.");
  };

  const handlePurchaseCreated = (purchase: CreditCardPurchase) => {
    setSelectedCardId(purchase.creditCardId);
    setIsCreatePurchaseOpen(false);
    showSuccess("Compra no cartão registrada com sucesso.");
  };

  const handleInvoicePaid = (invoice: PaidCreditCardInvoice) => {
    setSelectedCardId(invoice.creditCardId);
    setSelectedInvoiceId(invoice.id);
    setPayingInvoiceId(null);
    showSuccess("Fatura paga integralmente com sucesso.");
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
                onArchiveCard={handleArchiveCard}
                onCreateCard={handleCreateCard}
                onCreatePurchase={handleCreatePurchase}
                onEditCard={handleEditCard}
                onPayInvoice={(invoice) => handlePayInvoice(invoice.id)}
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
      {isCreateCardOpen ? (
        <CreateCreditCardDialog
          accounts={data?.accounts ?? []}
          onClose={() => setIsCreateCardOpen(false)}
          onCreated={handleCardCreated}
          open
        />
      ) : null}
      {editingCard ? (
        <EditCreditCardDialog
          accounts={data?.accounts ?? []}
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onUpdated={handleCardUpdated}
          open
        />
      ) : null}
      {archivingCard ? (
        <ArchiveCreditCardDialog
          card={archivingCard}
          currentInvoice={archivingInvoice}
          onArchived={handleCardArchived}
          onClose={() => {
            setArchivingCard(null);
            setArchivingInvoice(null);
          }}
          open
        />
      ) : null}
      {isCreatePurchaseOpen ? (
        <CreateCreditCardPurchaseDialog
          onClose={() => setIsCreatePurchaseOpen(false)}
          onCreated={handlePurchaseCreated}
          open
        />
      ) : null}
      {payingInvoice ? (
        <PayCreditCardInvoiceDialog
          accounts={data?.accounts ?? []}
          card={payingCard}
          invoice={payingInvoice}
          onClose={() => setPayingInvoiceId(null)}
          onPaid={handleInvoicePaid}
          open
        />
      ) : null}
    </section>
  );
}
