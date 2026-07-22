"use client";

import { ChartNoAxesColumn, ShieldCheck } from "lucide-react";

import type { CategoryBudgetOverview } from "@/api/generated/client";
import { formatCurrency } from "@/lib/format";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

type BudgetHeroProps = {
  overview: CategoryBudgetOverview;
};

export function BudgetHero({ overview }: BudgetHeroProps) {
  const totalLimit = Number(overview.summary.totalLimit);
  const totalSpent = Number(overview.summary.totalSpent);
  const usage = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;
  const monthLabel = monthFormatter.format(new Date(Date.UTC(overview.year, overview.month - 1, 1)));

  const onTrack = overview.budgets.filter((budget) => budget.status === "within_budget").length;
  const nearLimit = overview.summary.nearLimitCount;
  const exceeded = overview.summary.exceededCount;

  return (
    <div className="plx-hero">
      <div className="plx-hero-inner">
        <div style={{ minWidth: 0 }}>
          <div className="tlx-card-title">
            <ChartNoAxesColumn aria-hidden="true" color="var(--blue)" size={15} />
            Orçamento de {monthLabel}
          </div>
          <div className="plx-hero-value">
            <strong>{formatCurrency(overview.summary.totalSpent)}</strong>
            <span>de {formatCurrency(overview.summary.totalLimit)} orçados</span>
          </div>
          <div className="plx-hero-bar" aria-hidden="true">
            <i style={{ width: `${usage}%` }} />
          </div>
          <div className="plx-hero-meta">
            <span>{Math.round(usage)}% utilizado</span>
            <span>{formatCurrency(overview.summary.totalRemaining)} disponíveis</span>
          </div>
        </div>
        <div className="plx-hero-chips">
          <span className="plx-status-chip tlx-tone-green">
            <i aria-hidden="true" />
            {onTrack} no ritmo
          </span>
          <span className="plx-status-chip tlx-tone-amber">
            <i aria-hidden="true" />
            {nearLimit} em atenção
          </span>
          <span className="plx-status-chip tlx-tone-red">
            <i aria-hidden="true" />
            {exceeded} {exceeded === 1 ? "ultrapassado" : "ultrapassados"}
          </span>
        </div>
      </div>
      <div className="plx-hero-note">
        <ShieldCheck aria-hidden="true" color="var(--blue)" size={15} />
        <span>
          Orçamentos são <strong>apenas avisos</strong>. O FluxTrackr nunca bloqueia um lançamento por
          estourar o limite — você continua registrando normalmente.
        </span>
      </div>
    </div>
  );
}
