import { CreditCard } from "lucide-react";

import type {
  CreditCard as CreditCardModel,
  CreditCardInvoiceWithInstallments,
} from "@/api/generated/client";
import { CreditCardItem } from "@/features/wallet/components/credit-card-item";
import { InvoiceDetails } from "@/features/wallet/components/invoice-details";
import { OrphanInvoices } from "@/features/wallet/components/orphan-invoices";
import { InlineEmpty } from "@/features/wallet/components/wallet-empty-states";
import { WalletSectionHeading } from "@/features/wallet/components/wallet-section-heading";

type CreditCardsSectionProps = {
  creditCards: CreditCardModel[];
  invoices: CreditCardInvoiceWithInstallments[];
  selectedCard: CreditCardModel | undefined;
  cardInvoices: CreditCardInvoiceWithInstallments[];
  selectedInvoice: CreditCardInvoiceWithInstallments | undefined;
  orphanInvoices: CreditCardInvoiceWithInstallments[];
  onSelectCard: (id: string) => void;
  onSelectInvoice: (id: string) => void;
};

export function CreditCardsSection({
  creditCards,
  invoices,
  selectedCard,
  cardInvoices,
  selectedInvoice,
  orphanInvoices,
  onSelectCard,
  onSelectInvoice,
}: CreditCardsSectionProps) {
  return (
    <section className="wallet-section wallet-cards-section" aria-labelledby="wallet-cards-title">
      <WalletSectionHeading count={creditCards.length} id="wallet-cards-title" title="Cartões ativos" />

      {creditCards.length === 0 ? (
        <InlineEmpty icon={CreditCard} message="Nenhum cartão ativo foi retornado pela API." />
      ) : (
        <div className="wallet-card-layout">
          <ul className="wallet-credit-card-list">
            {creditCards.map((card) => (
              <li key={card.id}>
                <CreditCardItem
                  card={card}
                  invoiceCount={invoices.filter((invoice) => invoice.creditCardId === card.id).length}
                  isSelected={selectedCard?.id === card.id}
                  onSelect={() => onSelectCard(card.id)}
                />
              </li>
            ))}
          </ul>
          <InvoiceDetails
            cardInvoices={cardInvoices}
            onSelectInvoice={onSelectInvoice}
            selectedCard={selectedCard}
            selectedInvoice={selectedInvoice}
          />
        </div>
      )}

      <OrphanInvoices invoices={orphanInvoices} />
    </section>
  );
}
