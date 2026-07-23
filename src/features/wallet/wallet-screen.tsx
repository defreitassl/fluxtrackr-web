"use client";

import { Info, Plus, TriangleAlert, Wallet } from "lucide-react";
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
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import { CreateAccountDialog } from "@/features/wallet/accounts/components/create-account-dialog";
import { EditAccountDialog } from "@/features/wallet/accounts/components/edit-account-dialog";
import { ArchiveAccountDialog } from "@/features/wallet/accounts/components/archive-account-dialog";
import { BalanceAdjustmentDialog } from "@/features/wallet/adjustments/components/balance-adjustment-dialog";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { PayInvoiceDrawer } from "@/features/wallet/components/pay-invoice-drawer";
import { WalletAccountsGrid } from "@/features/wallet/components/wallet-accounts-grid";
import { WalletAddDialog } from "@/features/wallet/components/wallet-add-dialog";
import { WalletCardRows } from "@/features/wallet/components/wallet-card-rows";
import { WalletInvoicePanel } from "@/features/wallet/components/wallet-invoice-panel";
import { WalletTiles } from "@/features/wallet/components/wallet-tiles";
import { ArchiveCreditCardDialog } from "@/features/wallet/credit-cards/components/archive-credit-card-dialog";
import { CreateCreditCardDialog } from "@/features/wallet/credit-cards/components/create-credit-card-dialog";
import { CreateCreditCardPurchaseDialog } from "@/features/wallet/credit-cards/components/create-credit-card-purchase-dialog";
import { EditCreditCardDialog } from "@/features/wallet/credit-cards/components/edit-credit-card-dialog";
import { AccountTransferDialog } from "@/features/wallet/transfers/components/account-transfer-dialog";
import { useCurrentWalletPeriod } from "@/features/wallet/hooks/use-current-wallet-period";
import { resolveWalletCardSelection } from "@/features/wallet/lib/wallet-selection";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";
import { formatCurrency } from "@/lib/format";
import { useGlobalSearch } from "@/providers/search-provider";

const SUCCESS_MESSAGE_TIMEOUT = 5000;

export function WalletScreen() {
  const { period, refreshPeriod } = useCurrentWalletPeriod();
  const wallet = useWalletOverview(period);
  const dashboard = useDashboardOverview();
  const { query: search } = useGlobalSearch();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);
  const [isCreatePurchaseOpen, setIsCreatePurchaseOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [archivingAccount, setArchivingAccount] = useState<WalletAccount | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [archivingCard, setArchivingCard] = useState<CreditCard | null>(null);
  const [archivingInvoice, setArchivingInvoice] = useState<CreditCardInvoiceWithInstallments | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [adjustingAccountId, setAdjustingAccountId] = useState<string | null>(null);
  const [transferringAccountId, setTransferringAccountId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = wallet.data;

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // Ações do header global (Transferir / Adicionar).
  useEffect(() => {
    function openAdd() {
      setSuccessMessage(null);
      setIsAddOpen(true);
    }
    function openTransfer() {
      setSuccessMessage(null);
      setTransferringAccountId((current) => current ?? wallet.data?.accounts[0]?.account.id ?? null);
    }
    window.addEventListener("fluxtrackr:wallet-add", openAdd);
    window.addEventListener("fluxtrackr:wallet-transfer", openTransfer);
    return () => {
      window.removeEventListener("fluxtrackr:wallet-add", openAdd);
      window.removeEventListener("fluxtrackr:wallet-transfer", openTransfer);
    };
  }, [wallet.data]);

  const term = search.trim().toLowerCase();
  const filteredAccounts = useMemo(
    () =>
      (data?.accounts ?? []).filter(({ account }) =>
        term ? `${account.name} ${account.bank ?? ""}`.toLowerCase().includes(term) : true,
      ),
    [data?.accounts, term],
  );
  const filteredCards = useMemo(
    () =>
      (data?.creditCards ?? []).filter((card) =>
        term
          ? `${card.name} ${card.bankName ?? ""} ${card.lastFourDigits ?? ""}`.toLowerCase().includes(term)
          : true,
      ),
    [data?.creditCards, term],
  );

  const cardSelection = useMemo(
    () =>
      resolveWalletCardSelection({
        creditCards: filteredCards,
        invoices: data?.invoices ?? [],
        selectedCardId,
        selectedInvoiceId,
      }),
    [filteredCards, data?.invoices, selectedCardId, selectedInvoiceId],
  );

  const adjustingAccount = data?.accounts.find(({ account }) => account.id === adjustingAccountId);
  const transferringAccount = data?.accounts.find(({ account }) => account.id === transferringAccountId);
  const payingInvoice = data?.invoices.find((invoice) => invoice.id === payingInvoiceId) ?? null;
  const payingCard = data?.creditCards.find((card) => card.id === payingInvoice?.creditCardId) ?? null;

  const isRefreshing = wallet.isFetching || dashboard.isFetching;

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_TIMEOUT);
  };

  const refreshWallet = () => {
    if (isRefreshing) return;
    const { changed } = refreshPeriod();
    if (changed) {
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

  const handleAccountCreated = (account: Account) => {
    setIsCreateOpen(false);
    showSuccess(`Conta ${account.name} criada com sucesso.`);
  };

  const handleAccountUpdated = (account: Account) => {
    setEditingAccount(null);
    showSuccess(`Conta ${account.name} atualizada.`);
  };

  const handleAccountArchived = () => {
    setArchivingAccount(null);
    showSuccess("Conta arquivada.");
  };

  const handleBalanceAdjusted = (response: CreateBalanceAdjustmentResponse) => {
    setAdjustingAccountId(null);
    showSuccess(`Saldo ajustado para ${formatCurrency(response.currentBalance)}.`);
  };

  const handleTransferred = (transfer: AccountTransfer) => {
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

  const isWalletEmpty = data ? data.accounts.length === 0 && data.creditCards.length === 0 : false;

  return (
    <section className="wlx-screen" aria-label="Carteira">
      <div className="wlx-main">
        {wallet.isPending && !data ? (
          <div aria-busy="true" aria-label="Carregando Carteira" className="wlx-skeleton" role="status">
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {wallet.isError && !data ? (
          <div className="tlx-state" role="alert">
            <div>
              <span className="tlx-state-icon tlx-tone-red">
                <TriangleAlert aria-hidden="true" size={24} />
              </span>
              <strong>Não foi possível carregar a carteira</strong>
              <p>Seus saldos estão seguros. Tente novamente em instantes.</p>
              <button className="tlx-state-retry" onClick={refreshWallet} type="button">
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}

        {data ? (
          <>
            {successMessage ? (
              <p className="mutation-feedback" role="status" style={{ marginBottom: 12 }}>
                {successMessage}
              </p>
            ) : null}
            {wallet.isRefetchError || dashboard.isRefetchError ? (
              <div className="timeline-refetch-alert tlx-refetch-alert" role="alert">
                <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
                <button className="secondary-button" onClick={refreshWallet} type="button">
                  Tentar novamente
                </button>
              </div>
            ) : null}

            <WalletTiles dashboard={dashboard.data} overview={data} />

            <div className="wlx-info-banner">
              <Info aria-hidden="true" size={14} />
              <span>
                O saldo das contas só diminui quando a fatura do cartão é paga. Até lá, ela conta como
                valor comprometido.
              </span>
            </div>

            {isWalletEmpty ? (
              <div className="tlx-state">
                <div>
                  <span className="tlx-state-icon tlx-tone-green">
                    <Wallet aria-hidden="true" size={24} />
                  </span>
                  <strong>Nenhuma conta ou cartão ainda</strong>
                  <p>Adicione uma conta para começar a acompanhar seus saldos.</p>
                  <button className="tlx-state-cta" onClick={() => setIsCreateOpen(true)} type="button">
                    <Plus aria-hidden="true" size={14} strokeWidth={2.4} />
                    Adicionar conta
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="wlx-section-head">
                  <h2>Contas</h2>
                  <button className="dx-panel-link" onClick={() => setIsAddOpen(true)} type="button">
                    Gerenciar
                  </button>
                </div>
                <WalletAccountsGrid
                  accounts={filteredAccounts}
                  onAdjustAccount={(walletAccount: WalletAccount) => {
                    setSuccessMessage(null);
                    setAdjustingAccountId(walletAccount.account.id);
                  }}
                  onArchiveAccount={(walletAccount) => {
                    setSuccessMessage(null);
                    setArchivingAccount(walletAccount);
                  }}
                  onCreateAccount={() => {
                    setSuccessMessage(null);
                    setIsCreateOpen(true);
                  }}
                  onEditAccount={(account) => {
                    setSuccessMessage(null);
                    setEditingAccount(account);
                  }}
                  onTransferAccount={(account) => {
                    setSuccessMessage(null);
                    setTransferringAccountId(account.id);
                  }}
                />

                <div className="wlx-section-head">
                  <h2>Cartões</h2>
                  <button className="dx-panel-link" onClick={() => setIsAddOpen(true)} type="button">
                    Gerenciar
                  </button>
                </div>
                <WalletCardRows
                  creditCards={filteredCards}
                  invoices={data.invoices}
                  onCreateCard={() => {
                    setSuccessMessage(null);
                    setIsCreateCardOpen(true);
                  }}
                  onSelectCard={handleSelectCard}
                  selectedCardId={cardSelection.selectedCard?.id ?? null}
                />
              </>
            )}
          </>
        ) : null}
      </div>

      <WalletInvoicePanel
        card={cardSelection.selectedCard ?? null}
        cardInvoices={cardSelection.cardInvoices}
        invoice={cardSelection.selectedInvoice ?? null}
        onArchiveCard={(card, invoice) => {
          setSuccessMessage(null);
          setArchivingCard(card);
          setArchivingInvoice(invoice ?? null);
        }}
        onCreatePurchase={() => {
          setSuccessMessage(null);
          setIsCreatePurchaseOpen(true);
        }}
        onEditCard={(card) => {
          setSuccessMessage(null);
          setEditingCard(card);
        }}
        onPay={(invoice) => {
          setSuccessMessage(null);
          setPayingInvoiceId(invoice.id);
        }}
        onSelectInvoice={setSelectedInvoiceId}
      />

      <WalletAddDialog
        onClose={() => setIsAddOpen(false)}
        onCreateAccount={() => {
          setIsAddOpen(false);
          setIsCreateOpen(true);
        }}
        onCreateCard={() => {
          setIsAddOpen(false);
          setIsCreateCardOpen(true);
        }}
        open={isAddOpen}
      />

      {isCreateOpen ? (
        <CreateAccountDialog onClose={() => setIsCreateOpen(false)} onCreated={handleAccountCreated} open />
      ) : null}
      {editingAccount ? (
        <EditAccountDialog
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onUpdated={handleAccountUpdated}
          open
        />
      ) : null}
      {archivingAccount ? (
        <ArchiveAccountDialog
          account={archivingAccount}
          onArchived={handleAccountArchived}
          onClose={() => setArchivingAccount(null)}
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
          initialCreditCardId={cardSelection.selectedCard?.id}
          onClose={() => setIsCreatePurchaseOpen(false)}
          onCreated={handlePurchaseCreated}
          open
        />
      ) : null}
      <PayInvoiceDrawer
        accounts={data?.accounts ?? []}
        card={payingCard}
        invoice={payingInvoice}
        onClose={() => setPayingInvoiceId(null)}
        onPaid={handleInvoicePaid}
        open={payingInvoice !== null}
      />
    </section>
  );
}
