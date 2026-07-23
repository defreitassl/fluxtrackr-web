import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CalendarClock,
  CreditCard,
  Play,
  Repeat,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type { Account, Category, PaymentMethod, TimelineItem } from "@/api/generated/client";
import { categoryPresentation } from "@/features/categories/lib/category-presentation";
import {
  paymentMethodLabels,
  transactionAccountLabel,
} from "@/features/transactions/lib/transaction-presentation";
import { formatCurrency } from "@/lib/format";

export type TimelineTone = "green" | "red" | "amber" | "blue";

export type TimelineItemView = {
  tone: TimelineTone;
  Icon: LucideIcon;
  /** cat · conta · método, já resolvidos */
  metaParts: string[];
  methodLabel: string | null;
  /** valor formatado com sinal (− R$ x / + R$ x / R$ x) */
  value: string;
  valueTone: TimelineTone | "text";
  isInvoice: boolean;
  isRecurring: boolean;
  isProjectedEvent: boolean;
  note: string | null;
  /** link de foco na tela da origem (hoje só eventos financeiros) */
  href: string | null;
};

const recurringSources = new Set(["fixed_expense", "fixed_income", "subscription"]);

const sourceCategoryLabels: Record<string, string> = {
  credit_card_invoice: "Cartão de crédito",
  fixed_expense: "Gasto fixo",
  fixed_income: "Receita fixa",
  subscription: "Assinatura",
  financial_event: "Evento financeiro",
  account_transfer: "Entre contas",
  account_balance_adjustment: "Ajuste de saldo",
};

function metadataString(item: TimelineItem, key: string): string | null {
  const value = item.metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function invoiceCardName(item: TimelineItem): string | null {
  const card = item.metadata?.creditCard;
  if (card && typeof card === "object" && "name" in card && typeof card.name === "string") {
    return card.name;
  }
  return null;
}

export function timelineItemTone(item: TimelineItem): TimelineTone {
  if (item.sourceType === "credit_card_invoice") return "amber";
  if (item.type === "transfer" || item.type === "adjustment") return "blue";
  if (item.sourceType === "subscription" || item.sourceType === "financial_event") {
    return item.type === "income" ? "green" : "blue";
  }
  return item.type === "income" ? "green" : "red";
}

function timelineItemIcon(item: TimelineItem, categoriesById: Map<string, Category>): LucideIcon {
  if (item.sourceType === "credit_card_invoice") return CreditCard;
  if (item.sourceType === "subscription") return Play;
  if (item.sourceType === "account_transfer") return ArrowLeftRight;
  if (item.sourceType === "account_balance_adjustment") return SlidersHorizontal;
  if (item.sourceType === "financial_event") return CalendarClock;
  if (recurringSources.has(item.sourceType)) return Repeat;

  const category = item.categoryId ? categoriesById.get(item.categoryId) : undefined;
  if (category) return categoryPresentation(category).Icon;
  return item.type === "income" ? TrendingUp : TrendingDown;
}

function timelineItemValue(item: TimelineItem): { value: string; valueTone: TimelineTone | "text" } {
  const amount = Number(item.amount);

  if (item.type === "transfer") {
    return { value: formatCurrency(Math.abs(amount)), valueTone: "text" };
  }
  if (item.type === "adjustment") {
    if (amount === 0) return { value: formatCurrency(0), valueTone: "text" };
    return {
      value: `${amount > 0 ? "+" : "−"} ${formatCurrency(Math.abs(amount))}`,
      valueTone: amount > 0 ? "green" : "red",
    };
  }
  if (item.type === "income") {
    return { value: `+ ${formatCurrency(Math.abs(amount))}`, valueTone: "green" };
  }
  return {
    value: `− ${formatCurrency(Math.abs(amount))}`,
    valueTone: item.sourceType === "credit_card_invoice" ? "amber" : "red",
  };
}

export function timelineItemView(
  item: TimelineItem,
  categoriesById: Map<string, Category>,
  accountsById: Map<string, Account>,
): TimelineItemView {
  const isInvoice = item.sourceType === "credit_card_invoice";
  const isRecurring = recurringSources.has(item.sourceType);

  const paymentMethod = metadataString(item, "paymentMethod") as PaymentMethod | null;
  const methodLabel = paymentMethod ? (paymentMethodLabels[paymentMethod] ?? paymentMethod) : null;

  const metaParts: string[] = [];
  if (item.sourceType === "transaction") {
    const category = item.categoryId ? categoriesById.get(item.categoryId) : undefined;
    metaParts.push(category?.name ?? "Sem categoria");
    if (item.accountId) metaParts.push(transactionAccountLabel(item.accountId, accountsById));
  } else if (item.sourceType === "account_transfer") {
    metaParts.push(sourceCategoryLabels[item.sourceType]);
    const source = metadataString(item, "sourceAccountId");
    const destination = metadataString(item, "destinationAccountId");
    if (source && destination) {
      metaParts.push(
        `${transactionAccountLabel(source, accountsById)} → ${transactionAccountLabel(destination, accountsById)}`,
      );
    }
  } else if (isInvoice) {
    metaParts.push(sourceCategoryLabels[item.sourceType]);
    const cardName = invoiceCardName(item);
    if (cardName) metaParts.push(cardName);
  } else {
    metaParts.push(sourceCategoryLabels[item.sourceType] ?? item.sourceType);
    if (item.accountId) metaParts.push(transactionAccountLabel(item.accountId, accountsById));
  }

  const note =
    item.type === "transfer"
      ? "Transferência não conta como receita nem despesa."
      : isInvoice && item.balanceImpact === "projected"
        ? "Vence neste dia. O saldo só é debitado quando você paga a fatura."
        : null;

  return {
    tone: timelineItemTone(item),
    Icon: timelineItemIcon(item, categoriesById),
    metaParts,
    methodLabel,
    ...timelineItemValue(item),
    isInvoice,
    isRecurring,
    isProjectedEvent: item.sourceType === "financial_event" && item.balanceImpact === "projected",
    note,
    href: item.sourceType === "financial_event" ? `/events?focus=${item.sourceId}` : null,
  };
}

export type TimelineChipFilter = "all" | "income" | "expense" | "invoices" | "recurring";

export function matchesChipFilter(item: TimelineItem, filter: TimelineChipFilter) {
  switch (filter) {
    case "income":
      return item.type === "income";
    case "expense":
      return item.type === "expense" && item.sourceType !== "credit_card_invoice";
    case "invoices":
      return item.sourceType === "credit_card_invoice";
    case "recurring":
      return recurringSources.has(item.sourceType);
    default:
      return true;
  }
}
