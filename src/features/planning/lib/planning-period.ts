export type PlanningPeriod = {
  year: number;
  month: number;
};

const planningMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const planningAsOfFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Período corrente calculado em UTC, igual ao contrato do overview. */
export function getCurrentPlanningPeriod(reference = new Date()): PlanningPeriod {
  return {
    year: reference.getUTCFullYear(),
    month: reference.getUTCMonth() + 1,
  };
}

/** Move o período sem depender do fuso local do navegador. */
export function movePlanningPeriod(period: PlanningPeriod, months: number): PlanningPeriod {
  const reference = new Date(Date.UTC(period.year, period.month - 1 + months, 1));

  return {
    year: reference.getUTCFullYear(),
    month: reference.getUTCMonth() + 1,
  };
}

export function formatPlanningPeriod(period: PlanningPeriod): string {
  const formatted = planningMonthFormatter.format(Date.UTC(period.year, period.month - 1, 1));
  return `${formatted.slice(0, 1).toLocaleUpperCase("pt-BR")}${formatted.slice(1)}`;
}

export function formatPlanningAsOf(value: string): string {
  return `${planningAsOfFormatter.format(new Date(value))} UTC`;
}
