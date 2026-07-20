"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Banknote,
  ChartNoAxesCombined,
  CircleDot,
  CreditCard,
  Landmark,
  PiggyBank,
  RefreshCw,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import type { CreditCard as CreditCardModel, CreditCardInvoiceWithInstallments } from "@/api/generated/client";
import { ErrorState } from "@/components/ui/error-state";
import { useDashboardOverview } from "@/features/dashboard/queries/use-dashboard-overview";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { getCurrentUtcWalletPeriod } from "@/features/wallet/lib/wallet-period";
import {
  formatUnknownStatus,
  formatUtcDate,
  formatUtcDateTime,
  getAccountTypeLabel,
  getInvoiceStatusLabel,
  isSafeHexColor,
} from "@/features/wallet/lib/wallet-presentation";
import { useWalletOverview } from "@/features/wallet/queries/use-wallet-overview";
import { formatCurrency } from "@/lib/format";

const accountIcons = {
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  wallet: WalletCards,
  cash: Banknote,
  investment: ChartNoAxesCombined,
  other: CircleDot,
} as const;

export function WalletScreen() {
  const period = useMemo(() => getCurrentUtcWalletPeriod(), []);
  const wallet = useWalletOverview(period);
  const dashboard = useDashboardOverview();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const data = wallet.data;

  const selectedAccount = data?.accounts.find(({ account }) => account.id === selectedAccountId) ?? data?.accounts[0];
  const selectedInvoice = data?.invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? data?.invoices[0];
  const isRefreshing = wallet.isFetching || dashboard.isFetching;

  const refreshWallet = () => {
    if (!isRefreshing) {
      void Promise.all([
        wallet.refetch({ cancelRefetch: false }),
        dashboard.refetch({ cancelRefetch: false }),
      ]);
    }
  };

  return (
    <section className="wallet-screen" aria-labelledby="wallet-title">
      <header className="wallet-page-header">
        <div>
          <p className="page-eyebrow">Organização</p>
          <h1 id="wallet-title">Carteira</h1>
          <p>Contas, cartões e faturas atuais, sempre apresentados a partir dos retornos da API.</p>
        </div>
        <button
          aria-label="Atualizar Carteira"
          className="secondary-button wallet-refresh-button"
          disabled={isRefreshing}
          onClick={refreshWallet}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isRefreshing ? "is-spinning" : undefined} size={16} />
          {isRefreshing && !wallet.isPending ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

      {wallet.isPending && !data ? <WalletSkeleton /> : null}

      {wallet.isError && !data ? (
        <ErrorState
          description="Não foi possível obter sua Carteira agora. Tente novamente em instantes."
          onRetry={refreshWallet}
          title="Carteira indisponível"
        />
      ) : null}

      {data ? (
        <div className="wallet-content" aria-busy={wallet.isFetching}>
          {wallet.isFetching && !wallet.isRefetchError ? (
            <p className="wallet-refreshing" role="status">Atualizando informações da Carteira…</p>
          ) : null}
          {wallet.isRefetchError ? (
            <div className="wallet-refetch-alert" role="alert">
              <span>Não foi possível atualizar. Os dados exibidos podem estar desatualizados.</span>
              <button className="secondary-button" onClick={refreshWallet} type="button">Tentar novamente</button>
            </div>
          ) : null}

          <WalletSummary
            accountCount={data.accounts.length}
            cardCount={data.creditCards.length}
            dashboard={dashboard.data}
            invoiceCount={data.invoices.length}
          />

          {data.accounts.length === 0 && data.creditCards.length === 0 ? (
            <EmptyWallet />
          ) : (
            <div className="wallet-sections">
              <section className="wallet-section wallet-accounts-section" aria-labelledby="wallet-accounts-title">
                <SectionHeading count={data.accounts.length} id="wallet-accounts-title" title="Contas ativas" />
                {data.accounts.length === 0 ? (
                  <InlineEmpty icon={Landmark} message="Nenhuma conta ativa foi retornada pela API." />
                ) : (
                  <div className="wallet-account-layout">
                    <ul className="wallet-account-list">
                      {data.accounts.map((walletAccount) => (
                        <li key={walletAccount.account.id}>
                          <AccountButton
                            isSelected={selectedAccount?.account.id === walletAccount.account.id}
                            onSelect={() => setSelectedAccountId(walletAccount.account.id)}
                            walletAccount={walletAccount}
                          />
                        </li>
                      ))}
                    </ul>
                    <AccountDetails walletAccount={selectedAccount} />
                  </div>
                )}
              </section>

              <section className="wallet-section wallet-cards-section" aria-labelledby="wallet-cards-title">
                <SectionHeading count={data.creditCards.length} id="wallet-cards-title" title="Cartões ativos" />
                {data.creditCards.length === 0 ? (
                  <InlineEmpty icon={CreditCard} message="Nenhum cartão ativo foi retornado pela API." />
                ) : (
                  <div className="wallet-card-layout">
                    <ul className="wallet-credit-card-list">
                      {data.creditCards.map((card) => {
                        const cardInvoices = data.invoices.filter((invoice) => invoice.creditCardId === card.id);
                        const invoice = cardInvoices.length === 1 ? cardInvoices[0] : undefined;

                        return (
                          <li key={card.id}>
                            <CreditCardButton
                              card={card}
                              invoice={invoice}
                              invoiceCount={cardInvoices.length}
                              isSelected={selectedInvoice?.creditCardId === card.id && cardInvoices.length === 1}
                              onSelect={invoice ? () => setSelectedInvoiceId(invoice.id) : undefined}
                            />
                          </li>
                        );
                      })}
                    </ul>
                    <InvoiceDetails
                      creditCards={data.creditCards}
                      invoices={data.invoices}
                      onSelectInvoice={setSelectedInvoiceId}
                      selectedInvoice={selectedInvoice}
                    />
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function WalletSummary({
  accountCount,
  cardCount,
  dashboard,
  invoiceCount,
}: {
  accountCount: number;
  cardCount: number;
  dashboard: ReturnType<typeof useDashboardOverview>["data"];
  invoiceCount: number;
}) {
  return (
    <section className="wallet-summary" aria-label="Panorama da Carteira">
      <div className="wallet-summary-main">
        <p>Panorama financeiro</p>
        {dashboard ? <strong>{formatCurrency(dashboard.balance.total)}</strong> : <span className="wallet-summary-unavailable">Panorama indisponível no momento</span>}
        <span>{dashboard ? "Saldo total calculado pela API" : "As contas e cartões continuam disponíveis abaixo."}</span>
      </div>
      <dl className="wallet-summary-metrics">
        <div>
          <dt>Disponível para gastar</dt>
          <dd>{dashboard ? formatCurrency(dashboard.balance.availableToSpend) : "—"}</dd>
        </div>
        <div>
          <dt>Próxima fatura</dt>
          <dd>{dashboard?.nextInvoice ? formatCurrency(dashboard.nextInvoice.amount) : "Sem próxima fatura"}</dd>
        </div>
        <div>
          <dt>Itens ativos</dt>
          <dd>{accountCount} contas · {cardCount} cartões · {invoiceCount} faturas</dd>
        </div>
      </dl>
    </section>
  );
}

function SectionHeading({ count, id, title }: { count: number; id: string; title: string }) {
  return (
    <div className="wallet-section-heading">
      <div>
        <p className="page-eyebrow">Leitura</p>
        <h2 id={id}>{title}</h2>
      </div>
      <span>{count} {count === 1 ? "item" : "itens"}</span>
    </div>
  );
}

function AccountButton({ isSelected, onSelect, walletAccount }: {
  isSelected: boolean;
  onSelect: () => void;
  walletAccount: WalletAccount;
}) {
  const { account, balance } = walletAccount;
  const AccountIcon = accountIcons[account.icon as keyof typeof accountIcons] ?? CircleDot;
  const accent = isSafeHexColor(account.color) ? account.color : undefined;
  const style = accent ? ({ "--wallet-accent": accent } as CSSProperties) : undefined;

  return (
    <button
      aria-pressed={isSelected}
      className={`wallet-account-button${isSelected ? " is-selected" : ""}`}
      onClick={onSelect}
      style={style}
      type="button"
    >
      <span className="wallet-account-icon" aria-hidden="true"><AccountIcon size={19} /></span>
      <span className="wallet-item-copy">
        <strong>{account.name}</strong>
        <span>{account.bank ?? getAccountTypeLabel(account.type)}</span>
      </span>
      <span className="wallet-item-value">
        <strong>{formatCurrency(balance.currentBalance)}</strong>
        <span>{getAccountTypeLabel(account.type)}</span>
      </span>
    </button>
  );
}

function AccountDetails({ walletAccount }: { walletAccount: WalletAccount | undefined }) {
  if (!walletAccount) return null;

  const { account, balance } = walletAccount;
  const values = [
    ["Saldo inicial", balance.initialBalance],
    ["Receitas", balance.income],
    ["Despesas", balance.expense],
    ["Transferências recebidas", balance.incomingTransfers],
    ["Transferências enviadas", balance.outgoingTransfers],
    ["Ajustes", balance.adjustments],
  ] as const;

  return (
    <aside className="wallet-detail-panel" aria-labelledby="account-detail-title">
      <p className="page-eyebrow">Detalhe da conta</p>
      <h3 id="account-detail-title">{account.name}</h3>
      <p className="wallet-detail-caption">Composição retornada pela API até {formatUtcDateTime(balance.asOf)}.</p>
      <dl className="wallet-breakdown-list">
        {values.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{formatCurrency(value)}</dd></div>
        ))}
        <div className="wallet-breakdown-total"><dt>Saldo atual</dt><dd>{formatCurrency(balance.currentBalance)}</dd></div>
      </dl>
    </aside>
  );
}

function CreditCardButton({ card, invoice, invoiceCount, isSelected, onSelect }: {
  card: CreditCardModel;
  invoice?: CreditCardInvoiceWithInstallments;
  invoiceCount: number;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  const accent = isSafeHexColor(card.color) ? card.color : undefined;
  const style = accent ? ({ "--wallet-accent": accent } as CSSProperties) : undefined;

  return (
    <button
      aria-pressed={isSelected}
      className={`wallet-credit-card${isSelected ? " is-selected" : ""}`}
      onClick={onSelect}
      style={style}
      type="button"
    >
      <span className="wallet-card-topline">
        <span><CreditCard aria-hidden="true" size={18} /> {card.name}</span>
        {card.lastFourDigits ? <strong>•••• {card.lastFourDigits}</strong> : null}
      </span>
      <span className="wallet-card-bank">{[card.bankName, card.brand].filter(Boolean).join(" · ") || "Cartão de crédito"}</span>
      <span className="wallet-card-limit">Limite configurado: <strong>{formatCurrency(card.limitAmount)}</strong></span>
      <span className="wallet-card-meta">{card.closingDay ? `Fecha dia ${card.closingDay}` : "Sem dia de fechamento"} · Vence dia {card.dueDay}</span>
      {invoice ? (
        <span className="wallet-card-invoice">
          <span><em>{getInvoiceStatusLabel(invoice.status)}</em> · Fatura do mês</span>
          <strong>{formatCurrency(invoice.totalAmount)}</strong>
        </span>
      ) : (
        <span className="wallet-card-no-invoice">
          {invoiceCount > 1 ? `${invoiceCount} faturas retornadas — escolha nos detalhes.` : "Sem fatura no mês UTC atual."}
        </span>
      )}
    </button>
  );
}

function InvoiceDetails({ creditCards, invoices, onSelectInvoice, selectedInvoice }: {
  creditCards: CreditCardModel[];
  invoices: CreditCardInvoiceWithInstallments[];
  onSelectInvoice: (id: string) => void;
  selectedInvoice: CreditCardInvoiceWithInstallments | undefined;
}) {
  if (invoices.length === 0 || !selectedInvoice) {
    return <InlineEmpty icon={ReceiptText} message="Não há fatura para o mês UTC atual." />;
  }

  const card = creditCards.find((candidate) => candidate.id === selectedInvoice.creditCardId);

  return (
    <aside className="wallet-detail-panel wallet-invoice-panel" aria-labelledby="invoice-detail-title">
      <p className="page-eyebrow">Fatura selecionada</p>
      <h3 id="invoice-detail-title">{card?.name ?? "Cartão associado"}</h3>
      {invoices.length > 1 ? (
        <div className="wallet-invoice-selector" aria-label="Faturas retornadas">
          {invoices.map((invoice) => (
            <button
              aria-pressed={invoice.id === selectedInvoice.id}
              key={invoice.id}
              onClick={() => onSelectInvoice(invoice.id)}
              type="button"
            >{invoice.month}/{invoice.year} · {formatCurrency(invoice.totalAmount)}</button>
          ))}
        </div>
      ) : null}
      <dl className="wallet-breakdown-list">
        <div><dt>Período</dt><dd>{String(selectedInvoice.month).padStart(2, "0")}/{selectedInvoice.year}</dd></div>
        <div><dt>Status</dt><dd>{getInvoiceStatusLabel(selectedInvoice.status)}</dd></div>
        <div><dt>Total da fatura</dt><dd>{formatCurrency(selectedInvoice.totalAmount)}</dd></div>
        {selectedInvoice.closingDate ? <div><dt>Fechamento</dt><dd>{formatUtcDate(selectedInvoice.closingDate)}</dd></div> : null}
        <div><dt>Vencimento</dt><dd>{formatUtcDate(selectedInvoice.dueDate)}</dd></div>
        {selectedInvoice.paidAt ? <div><dt>Pagamento</dt><dd>{formatUtcDate(selectedInvoice.paidAt)}</dd></div> : null}
        {selectedInvoice.paidAmount ? <div><dt>Valor pago</dt><dd>{formatCurrency(selectedInvoice.paidAmount)}</dd></div> : null}
      </dl>
      <div className="wallet-installments">
        <div className="wallet-installments-heading"><h4>Parcelas</h4><span>{selectedInvoice.installments.length} retornadas</span></div>
        {selectedInvoice.installments.length === 0 ? <p>Nenhuma parcela foi retornada para esta fatura.</p> : (
          <ul>
            {selectedInvoice.installments.map((installment) => (
              <li key={installment.id}>
                <div><strong>{installment.description}</strong><span>{installment.installmentNumber} de {installment.installmentCount} · vence {formatUtcDate(installment.dueDate)}</span></div>
                <div><strong>{formatCurrency(installment.installmentAmount)}</strong><span>{formatUnknownStatus(installment.status)}</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function InlineEmpty({ icon: Icon, message }: { icon: typeof Landmark; message: string }) {
  return <div className="wallet-inline-empty"><Icon aria-hidden="true" size={20} /><p>{message}</p></div>;
}

function EmptyWallet() {
  return (
    <section className="wallet-empty-state" aria-labelledby="wallet-empty-title">
      <span className="empty-state-icon" aria-hidden="true"><WalletCards size={24} /></span>
      <h2 id="wallet-empty-title">Sua Carteira ainda não tem itens</h2>
      <p>Quando contas ou cartões forem cadastrados pela experiência apropriada, eles aparecerão aqui para consulta.</p>
    </section>
  );
}

function WalletSkeleton() {
  return (
    <div className="wallet-skeleton" aria-label="Carregando Carteira">
      <div className="skeleton-card wallet-skeleton-summary" />
      <div className="wallet-skeleton-grid"><div className="skeleton-card" /><div className="skeleton-card" /></div>
      <div className="wallet-skeleton-grid"><div className="skeleton-card" /><div className="skeleton-card" /></div>
    </div>
  );
}
