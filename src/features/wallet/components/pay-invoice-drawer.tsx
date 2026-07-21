"use client";

import { Check, Info, X } from "lucide-react";
import { useState } from "react";

import type {
  CreditCard,
  CreditCardInvoiceWithInstallments,
  PaidCreditCardInvoice,
} from "@/api/generated/client";
import type { WalletAccount } from "@/features/wallet/api/get-wallet-overview";
import { usePayCreditCardInvoice } from "@/features/wallet/credit-cards/mutations/use-pay-credit-card-invoice";
import { isSafeHexColor } from "@/features/wallet/lib/wallet-presentation";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/http";

const dueFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function accountInitials(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type PayInvoiceDrawerProps = {
  open: boolean;
  invoice: CreditCardInvoiceWithInstallments | null;
  card: CreditCard | null;
  accounts: WalletAccount[];
  onClose: () => void;
  onPaid: (invoice: PaidCreditCardInvoice) => void;
};

export function PayInvoiceDrawer({
  open,
  invoice,
  card,
  accounts,
  onClose,
  onPaid,
}: PayInvoiceDrawerProps) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = usePayCreditCardInvoice();

  // Reinicia a seleção quando o drawer abre para outra fatura.
  const session = open ? (invoice?.id ?? null) : null;
  const [lastSession, setLastSession] = useState<string | null>(null);
  if (session !== lastSession) {
    setLastSession(session);
    setAccountId(null);
    setError(null);
  }

  const activeAccounts = accounts.filter(({ account }) => account.isActive);
  const selectedAccount = activeAccounts.find(({ account }) => account.id === accountId) ?? null;
  const total = invoice ? Number(invoice.totalAmount) : 0;
  const resultingBalance = selectedAccount
    ? Number(selectedAccount.balance.currentBalance) - total
    : null;

  function confirm() {
    if (!invoice) return;
    if (!accountId) {
      setError("Escolha a conta que pagará a fatura.");
      return;
    }
    setError(null);
    mutation.mutate(
      { id: invoice.id, payload: { accountId } },
      {
        onSuccess: (paid) => onPaid(paid),
        onError: (mutationError) => {
          setError(
            mutationError instanceof ApiError && mutationError.status === 409
              ? "A fatura foi alterada durante a operação. Atualize e tente novamente."
              : "Não foi possível registrar o pagamento. Tente novamente.",
          );
        },
      },
    );
  }

  const monthLabel = invoice
    ? monthYearFormatter.format(new Date(Date.UTC(invoice.year, invoice.month - 1, 1)))
    : "";

  return (
    <>
      <div aria-hidden="true" className={cn("txx-backdrop", open && "txx-backdrop-open")} onClick={onClose} />
      <aside
        aria-hidden={!open}
        aria-label="Pagar fatura"
        className={cn("txx-drawer", open && "txx-drawer-open")}
        role="dialog"
      >
        <div className="txx-drawer-head">
          <div>
            <strong>Pagar fatura</strong>
            <p>{card ? `${card.name} · ${monthLabel}` : ""}</p>
          </div>
          <button aria-label="Fechar" className="txx-drawer-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={15} />
          </button>
        </div>

        <div className="txx-drawer-body">
          {invoice ? (
            <>
              <div className="wlx-pay-summary">
                <span>Valor a pagar</span>
                <strong>{formatCurrency(invoice.totalAmount)}</strong>
                <span>
                  Fatura {card?.name ?? ""} · vence {dueFormatter.format(new Date(invoice.dueDate))}
                </span>
              </div>

              <span className="txx-field-label">Debitar da conta</span>
              <div className="wlx-account-options">
                {activeAccounts.map(({ account, balance }) => (
                  <button
                    aria-pressed={account.id === accountId}
                    className="wlx-account-option"
                    key={account.id}
                    onClick={() => {
                      setAccountId(account.id);
                      setError(null);
                    }}
                    type="button"
                  >
                    <span
                      className="wlx-avatar"
                      style={
                        isSafeHexColor(account.color)
                          ? { background: account.color ?? undefined, color: "#fff" }
                          : undefined
                      }
                    >
                      {accountInitials(account.name)}
                    </span>
                    <span className="wlx-account-option-info">
                      <strong>{account.name}</strong>
                      <span>{formatCurrency(balance.currentBalance)}</span>
                    </span>
                    <span className="wlx-radio">
                      <Check aria-hidden="true" size={11} strokeWidth={3} />
                    </span>
                  </button>
                ))}
              </div>

              {selectedAccount && resultingBalance !== null ? (
                <div className="wlx-drawer-banner">
                  <Info aria-hidden="true" size={14} style={{ flex: "0 0 auto", marginTop: 1 }} />
                  <span>
                    O saldo de {selectedAccount.account.name} passará de{" "}
                    {formatCurrency(selectedAccount.balance.currentBalance)} para{" "}
                    {formatCurrency(resultingBalance)} após a confirmação.
                  </span>
                </div>
              ) : null}

              {error ? (
                <p className="txx-form-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="txx-drawer-foot">
          <button className="txx-drawer-cancel" disabled={mutation.isPending} onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="txx-drawer-save"
            disabled={mutation.isPending || !invoice}
            onClick={confirm}
            type="button"
          >
            {mutation.isPending ? "Confirmando…" : "Confirmar pagamento"}
          </button>
        </div>
      </aside>
    </>
  );
}
