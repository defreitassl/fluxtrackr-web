"use client";

import { ChevronDown, ShoppingBag } from "lucide-react";

import { useCreditCardPurchases } from "@/features/wallet/credit-cards/queries/use-credit-card-purchases";
import { formatCurrency } from "@/lib/format";
import { formatUtcDate } from "@/features/wallet/lib/wallet-presentation";

type WalletPurchasesSectionProps = {
  creditCardId: string | null;
};

const installmentStatusLabels = {
  pending: "Pendente",
  paid: "Paga",
  canceled: "Cancelada",
} as const;

export function WalletPurchasesSection({ creditCardId }: WalletPurchasesSectionProps) {
  const purchases = useCreditCardPurchases(creditCardId);

  return (
    <section aria-label="Compras do cartão" className="wlx-purchases-section">
      <div className="wlx-invoice-items-head">
        <span>Compras</span>
        <span>{purchases.data?.length ?? 0} {(purchases.data?.length ?? 0) === 1 ? "compra" : "compras"}</span>
      </div>
      {purchases.isPending ? <div aria-busy="true" className="wlx-purchases-skeleton" role="status"><span /><span /></div> : null}
      {purchases.isError && !purchases.isPending ? <p className="wlx-purchases-state" role="alert">Não foi possível carregar as compras deste cartão.</p> : null}
      {!purchases.isPending && !purchases.isError && purchases.data?.length === 0 ? <p className="wlx-purchases-state">Nenhuma compra encontrada para este cartão.</p> : null}
      {!purchases.isPending && !purchases.isError ? (
        <div className="wlx-purchases-list">
          {(purchases.data ?? []).map((purchase) => (
            <article className="wlx-purchase-row" key={purchase.id}>
              <span className="wlx-purchase-icon"><ShoppingBag aria-hidden="true" size={15} /></span>
              <div className="wlx-purchase-copy">
                <strong>{purchase.description}</strong>
                <span>{formatUtcDate(purchase.purchaseDate)} · {purchase.installmentCount}x de {formatCurrency(purchase.installments[0]?.installmentAmount ?? purchase.totalAmount)}</span>
              </div>
              <b>{formatCurrency(purchase.totalAmount)}</b>
              <details className="wlx-installments">
                <summary><span>Ver parcelas ({purchase.installments.length})</span><ChevronDown aria-hidden="true" size={14} /></summary>
                <div>
                  {purchase.installments.map((installment) => (
                    <p key={installment.id}>
                      <span>{installment.installmentNumber}/{installment.installmentCount} · vence {formatUtcDate(installment.dueDate)}</span>
                      <span>{formatCurrency(installment.installmentAmount)} · {installmentStatusLabels[installment.status]}</span>
                    </p>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
