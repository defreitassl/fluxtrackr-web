import { CalendarClock, Landmark, Repeat2, WalletCards } from "lucide-react";

import type { MonthlySummary, SubscriptionsSummary } from "@/api/generated/client";
import { getFixedMonthlyTotals } from "@/features/recurrences/lib/recurrence-presentation";
import { formatCurrency } from "@/lib/format";
import { formatUtcDate } from "@/features/wallet/lib/wallet-presentation";

type RecurrencesHeroProps = {
  monthlySummary: MonthlySummary;
  summary: SubscriptionsSummary;
};

export function RecurrencesHero({ monthlySummary, summary }: RecurrencesHeroProps) {
  const fixedTotals = getFixedMonthlyTotals(monthlySummary);
  const nextCharge = summary.nextCharge;

  const tiles = [
    {
      label: "Assinaturas ativas",
      value: String(summary.activeSubscriptions),
      detail: "Templates em renovação",
      icon: <Repeat2 aria-hidden="true" size={17} />,
    },
    {
      label: "Equivalente mensal",
      value: formatCurrency(summary.monthlyEquivalent),
      detail: "Assinaturas ativas",
      icon: <WalletCards aria-hidden="true" size={17} />,
    },
    {
      label: "Pendente no mês",
      value: formatCurrency(summary.pendingThisMonth),
      detail: "Cobranças de assinatura",
      icon: <CalendarClock aria-hidden="true" size={17} />,
    },
    {
      label: "Próxima cobrança",
      value: nextCharge ? formatUtcDate(nextCharge.chargeDate) : "Nenhuma",
      detail: nextCharge ? `${nextCharge.name} · ${formatCurrency(nextCharge.amount)}` : "Sem pendências futuras",
      icon: <CalendarClock aria-hidden="true" size={17} />,
    },
    {
      label: "Fixos no mês",
      value: formatCurrency(fixedTotals.expenses),
      detail: `Rendas fixas: ${formatCurrency(fixedTotals.incomes)}`,
      icon: <Landmark aria-hidden="true" size={17} />,
    },
  ];

  return (
    <div className="rcx-hero" aria-label="Resumo de recorrências">
      {tiles.map((tile) => (
        <article className="rcx-hero-tile" key={tile.label}>
          <span className="rcx-hero-icon">{tile.icon}</span>
          <span>{tile.label}</span>
          <strong>{tile.value}</strong>
          <small>{tile.detail}</small>
        </article>
      ))}
    </div>
  );
}
