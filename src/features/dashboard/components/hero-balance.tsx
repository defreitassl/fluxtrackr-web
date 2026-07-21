"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import type { DashboardOverviewBalance } from "@/api/generated/client";
import { maskCurrency } from "@/features/dashboard/lib/dashboard-format";

type HeroBalanceProps = {
  balance: DashboardOverviewBalance;
};

const breakdownEntries = [
  { key: "creditCardInvoices", label: "Faturas de cartão", color: "var(--amber)" },
  { key: "fixedExpenses", label: "Gastos fixos", color: "var(--green)" },
  { key: "subscriptions", label: "Assinaturas", color: "var(--blue)" },
  { key: "financialEvents", label: "Eventos confirmados", color: "var(--danger)" },
] as const;

export function HeroBalance({ balance }: HeroBalanceProps) {
  const [hidden, setHidden] = useState(false);

  const committed = Number(balance.committed);
  const breakdown = breakdownEntries
    .map((entry) => ({ ...entry, amount: Number(balance.committedBreakdown[entry.key]) }))
    .filter((entry) => entry.amount > 0);

  return (
    <section className="dx-hero" aria-label="Disponível para gastar">
      <div className="dx-hero-inner">
        <div>
          <div className="dx-hero-topline">
            <span>Disponível para gastar</span>
            <button
              aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
              aria-pressed={hidden}
              className="dx-hero-eye"
              onClick={() => setHidden((value) => !value)}
              type="button"
            >
              {hidden ? <EyeOff aria-hidden="true" size={13} /> : <Eye aria-hidden="true" size={13} />}
            </button>
          </div>
          <p className="dx-hero-value">{maskCurrency(balance.availableToSpend, hidden)}</p>
          <div className="dx-hero-stats">
            <div className="dx-hero-stat">
              <span>Saldo total</span>
              <strong>{maskCurrency(balance.total, hidden)}</strong>
            </div>
            <div className="dx-hero-stat dx-hero-stat-danger">
              <span>Comprometido</span>
              <strong>{maskCurrency(balance.committed, hidden)}</strong>
            </div>
          </div>
        </div>

        <div className="dx-commit">
          <span className="dx-commit-title">Onde está comprometido</span>
          <div className="dx-commit-rows">
            {breakdown.length === 0 ? (
              <p className="dx-empty">Nenhum compromisso neste mês.</p>
            ) : (
              breakdown.map((entry) => (
                <div className="dx-commit-row" key={entry.key}>
                  <span>{entry.label}</span>
                  <strong>{maskCurrency(entry.amount, hidden)}</strong>
                </div>
              ))
            )}
            {breakdown.length > 0 && committed > 0 ? (
              <div className="dx-commit-bar" aria-hidden="true">
                {breakdown.map((entry) => (
                  <i
                    key={entry.key}
                    style={{ width: `${(entry.amount / committed) * 100}%`, background: entry.color }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
