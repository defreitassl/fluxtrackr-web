import type { BalanceForecast, TimelineItem } from "@/api/generated/client";

export type SeriesPoint = {
  date: Date;
  balance: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function realizedNetChange(item: TimelineItem) {
  if (item.balanceImpact !== "realized") return 0;

  const amount = Number(item.amount);
  if (!Number.isFinite(amount)) return 0;

  switch (item.type) {
    case "income":
      return amount;
    case "expense":
      return -amount;
    case "adjustment":
      return amount;
    default:
      return 0;
  }
}

/**
 * Reconstrói o saldo diário realizado caminhando para trás a partir do saldo
 * atual: o saldo no fim de cada dia anterior é o saldo do dia seguinte menos a
 * variação líquida realizada daquele dia seguinte.
 */
export function buildRealizedSeries(
  items: TimelineItem[],
  currentBalance: number,
  historyDays: number,
  today: Date,
): SeriesPoint[] {
  const netByDay = new Map<string, number>();
  for (const item of items) {
    const change = realizedNetChange(item);
    if (change === 0) continue;
    const key = dayKey(new Date(item.date));
    netByDay.set(key, (netByDay.get(key) ?? 0) + change);
  }

  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const series: SeriesPoint[] = [{ date: todayStart, balance: currentBalance }];

  let balance = currentBalance;
  for (let back = 0; back < historyDays; back += 1) {
    const day = new Date(todayStart.getTime() - back * DAY_IN_MS);
    balance -= netByDay.get(dayKey(day)) ?? 0;
    series.unshift({ date: new Date(day.getTime() - DAY_IN_MS), balance });
  }

  return series;
}

export function buildProjectionSeries(forecast: BalanceForecast): SeriesPoint[] {
  return forecast.points.map((point) => ({
    date: new Date(`${point.date.slice(0, 10)}T00:00:00.000Z`),
    balance: Number(point.balance),
  }));
}
