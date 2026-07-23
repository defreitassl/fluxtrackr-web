import type {
  Account,
  Category,
  CreditCard,
  FixedOccurrence,
  MonthlySummary,
  SubscriptionCharge,
} from "@/api/generated/client";

export const recurrenceLabels = {
  monthly: "Mensal",
  semiannual: "Semestral",
  yearly: "Anual",
} as const;

export const pendingStatusLabel = "Pendente";

export type RecurrenceRailItem =
  | {
      id: string;
      source: "subscription";
      templateId: string;
      type: "expense";
      name: string;
      amount: string;
      date: string;
      categoryId: string | null;
      accountId: string | null;
      creditCardId: string | null;
      paymentMethod: SubscriptionCharge["paymentMethod"];
      raw: SubscriptionCharge;
    }
  | {
      id: string;
      source: "fixed";
      templateId: string;
      type: FixedOccurrence["type"];
      name: string;
      amount: string;
      date: string;
      categoryId: string | null;
      accountId: string | null;
      creditCardId: null;
      paymentMethod: FixedOccurrence["paymentMethod"];
      raw: FixedOccurrence;
    };

export type RecurrenceRailSources = {
  subscriptionCharges: SubscriptionCharge[];
  fixedOccurrences: FixedOccurrence[];
  activeSubscriptionIds: Set<string>;
  activeFixedExpenseIds: Set<string>;
  activeFixedIncomeIds: Set<string>;
};

export function recurrenceLabel(value: "monthly" | "semiannual" | "yearly") {
  return recurrenceLabels[value];
}

export function fixedKindLabel(kind: "expense" | "income") {
  return kind === "expense" ? "Gasto fixo" : "Renda fixa";
}

export function fixedDayLabel(kind: "expense" | "income", day: number | null) {
  if (!day) return "Dia não definido";
  return kind === "expense" ? `Vence dia ${day}` : `Recebe dia ${day}`;
}

export function resolveRecurrenceDestination(
  value: Pick<RecurrenceRailItem, "accountId" | "creditCardId">,
  accounts: Account[],
  creditCards: CreditCard[],
) {
  if (value.creditCardId) {
    return creditCards.find((card) => card.id === value.creditCardId)?.name ?? "Cartão indisponível";
  }
  if (value.accountId) {
    return accounts.find((account) => account.id === value.accountId)?.name ?? "Conta indisponível";
  }
  return "Destino não definido";
}

export function resolveRecurrenceCategory(categoryId: string | null, categories: Category[]) {
  if (!categoryId) return "Sem categoria";
  return categories.find((category) => category.id === categoryId)?.name ?? "Categoria indisponível";
}

export function getFixedMonthlyTotals(summary: MonthlySummary) {
  return {
    expenses: summary.fixedExpenseTotal,
    incomes: summary.fixedIncomeTotal,
  };
}

export function toRecurrenceRailItems({
  subscriptionCharges,
  fixedOccurrences,
  activeSubscriptionIds,
  activeFixedExpenseIds,
  activeFixedIncomeIds,
}: RecurrenceRailSources): RecurrenceRailItem[] {
  const subscriptionItems: RecurrenceRailItem[] = subscriptionCharges
    .filter((charge) => charge.status === "pending" && activeSubscriptionIds.has(charge.subscriptionId))
    .map((charge) => ({
      id: charge.id,
      source: "subscription" as const,
      templateId: charge.subscriptionId,
      type: "expense" as const,
      name: charge.name,
      amount: charge.amount,
      date: charge.chargeDate,
      categoryId: charge.categoryId,
      accountId: charge.accountId,
      creditCardId: charge.creditCardId,
      paymentMethod: charge.paymentMethod,
      raw: charge,
    }));

  const fixedItems: RecurrenceRailItem[] = fixedOccurrences
    .filter((occurrence) => {
      if (occurrence.status !== "pending") return false;
      return occurrence.type === "expense"
        ? Boolean(occurrence.fixedExpenseId && activeFixedExpenseIds.has(occurrence.fixedExpenseId))
        : Boolean(occurrence.fixedIncomeId && activeFixedIncomeIds.has(occurrence.fixedIncomeId));
    })
    .map((occurrence) => ({
      id: occurrence.id,
      source: "fixed" as const,
      templateId: occurrence.type === "expense" ? occurrence.fixedExpenseId! : occurrence.fixedIncomeId!,
      type: occurrence.type,
      name: occurrence.name,
      amount: occurrence.amount,
      date: occurrence.occurrenceDate,
      categoryId: occurrence.categoryId,
      accountId: occurrence.accountId,
      creditCardId: null,
      paymentMethod: occurrence.paymentMethod,
      raw: occurrence,
    }));

  return [...subscriptionItems, ...fixedItems].sort((left, right) => {
    const dateDiff = new Date(left.date).getTime() - new Date(right.date).getTime();
    return dateDiff || left.id.localeCompare(right.id);
  });
}

export function recurrenceRailDateRange(reference = new Date()) {
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 45);
  end.setUTCHours(23, 59, 59, 999);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function currentRecurrencePeriod(reference = new Date()) {
  return { year: reference.getUTCFullYear(), month: reference.getUTCMonth() + 1 };
}
