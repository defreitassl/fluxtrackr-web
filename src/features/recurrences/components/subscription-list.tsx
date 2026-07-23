import { Archive, Pencil, Power, Repeat2 } from "lucide-react";

import type { Account, Category, CreditCard as CreditCardType, Subscription } from "@/api/generated/client";
import {
  recurrenceLabel,
  resolveRecurrenceCategory,
  resolveRecurrenceDestination,
} from "@/features/recurrences/lib/recurrence-presentation";
import { formatCurrency } from "@/lib/format";
import { formatUtcDate } from "@/features/wallet/lib/wallet-presentation";

type SubscriptionListProps = {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCardType[];
  items: Subscription[];
  onArchive: (subscription: Subscription) => void;
  onEdit: (subscription: Subscription) => void;
  onToggle: (subscription: Subscription) => void;
};

export function SubscriptionList({
  accounts,
  categories,
  creditCards,
  items,
  onArchive,
  onEdit,
  onToggle,
}: SubscriptionListProps) {
  return (
    <div className="rcx-card-list">
      {items.map((subscription) => (
        <article className="rcx-card" key={subscription.id}>
          <div className="rcx-card-head">
            <span className="rcx-card-icon"><Repeat2 aria-hidden="true" size={17} /></span>
            <div>
              <strong>{subscription.name}</strong>
              <span>{recurrenceLabel(subscription.recurrence as "monthly" | "semiannual" | "yearly")}</span>
            </div>
            <span className="rcx-status-pill">{subscription.isActive ? "Ativa" : "Pausada"}</span>
          </div>
          <p className="rcx-card-amount">{formatCurrency(subscription.amount)}</p>
          <dl className="rcx-card-details">
            <div><dt>Próxima</dt><dd>{formatUtcDate(subscription.nextChargeDate)}</dd></div>
            <div><dt>Destino</dt><dd>{resolveRecurrenceDestination(subscription, accounts, creditCards)}</dd></div>
            <div><dt>Categoria</dt><dd>{resolveRecurrenceCategory(subscription.categoryId, categories)}</dd></div>
            <div><dt>Renovação</dt><dd>{subscription.autoRenew ? "Automática" : "Manual"}</dd></div>
          </dl>
          <div className="rcx-card-actions">
            <button aria-pressed={subscription.isActive} onClick={() => onToggle(subscription)} type="button">
              <Power aria-hidden="true" size={14} /> {subscription.isActive ? "Pausar" : "Ativar"}
            </button>
            <button onClick={() => onEdit(subscription)} type="button"><Pencil aria-hidden="true" size={14} /> Editar</button>
            <button className="rcx-danger-action" onClick={() => onArchive(subscription)} type="button"><Archive aria-hidden="true" size={14} /> Arquivar</button>
          </div>
        </article>
      ))}
    </div>
  );
}
