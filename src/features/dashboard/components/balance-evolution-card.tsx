"use client";

import { useMemo, useState } from "react";

import { useBalanceForecast } from "@/features/dashboard/queries/use-balance-forecast";
import { useDashboardTimeline } from "@/features/dashboard/queries/use-dashboard-timeline";
import {
  buildProjectionSeries,
  buildRealizedSeries,
  type SeriesPoint,
} from "@/features/dashboard/lib/balance-series";

const RANGES = [30, 60, 90] as const;

const VIEW = {
  width: 820,
  height: 210,
  left: 54,
  right: 812,
  top: 26,
  bottom: 180,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatAxisValue(value: number) {
  const rounded = Math.round(value);
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(rounded);
}

function buildPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

type BalanceEvolutionCardProps = {
  historyWindow: { startDate: string; endDate: string };
  currentBalance: number;
  today: Date;
};

export function BalanceEvolutionCard({ historyWindow, currentBalance, today }: BalanceEvolutionCardProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const { data: forecast } = useBalanceForecast(range);
  const { data: history } = useDashboardTimeline(historyWindow);

  const historyDays = Math.max(
    1,
    Math.round(
      (new Date(historyWindow.endDate).getTime() - new Date(historyWindow.startDate).getTime()) / DAY_IN_MS,
    ),
  );

  const chart = useMemo(() => {
    if (!forecast) return null;

    const realized: SeriesPoint[] = history
      ? buildRealizedSeries(history.items, currentBalance, historyDays, today)
      : [];
    const projection = buildProjectionSeries(forecast);
    if (realized.length + projection.length < 2) return null;

    const all = [...realized, ...projection];
    const minDate = all[0].date.getTime();
    const maxDate = all[all.length - 1].date.getTime();
    const values = all.map((point) => point.balance);
    let min = Math.min(...values, 0);
    let max = Math.max(...values);
    if (max - min < 1) max = min + 1;
    const pad = (max - min) * 0.08;
    min -= pad;
    max += pad;

    const x = (date: Date) =>
      VIEW.left + ((date.getTime() - minDate) / Math.max(1, maxDate - minDate)) * (VIEW.right - VIEW.left);
    const y = (value: number) =>
      VIEW.bottom - ((value - min) / (max - min)) * (VIEW.bottom - VIEW.top);

    const realizedPoints = realized.map((point) => ({ x: x(point.date), y: y(point.balance) }));
    const projectionPoints = projection.map((point) => ({ x: x(point.date), y: y(point.balance) }));
    if (realizedPoints.length > 0 && projectionPoints.length > 0) {
      projectionPoints.unshift(realizedPoints[realizedPoints.length - 1]);
    }

    const todayX = realizedPoints.length > 0 ? realizedPoints[realizedPoints.length - 1].x : VIEW.left;
    const gridLines = [VIEW.top, (VIEW.top + VIEW.bottom) / 2, VIEW.bottom - 42];
    const gridLabels = gridLines.map((lineY) => ({
      y: lineY,
      label: formatAxisValue(min + ((VIEW.bottom - lineY) / (VIEW.bottom - VIEW.top)) * (max - min)),
    }));

    const areaPath =
      realizedPoints.length > 1
        ? `${buildPath(realizedPoints)} L${realizedPoints[realizedPoints.length - 1].x.toFixed(1)},${VIEW.bottom} L${realizedPoints[0].x.toFixed(1)},${VIEW.bottom} Z`
        : null;

    return {
      realizedPoints,
      projectionPoints,
      todayX,
      gridLabels,
      areaPath,
      lastProjection: projectionPoints[projectionPoints.length - 1] ?? null,
      todayPoint: realizedPoints[realizedPoints.length - 1] ?? null,
    };
  }, [forecast, history, currentBalance, historyDays, today]);

  return (
    <section className="dx-panel">
      <div className="dx-panel-head">
        <div>
          <h2>Evolução e previsão do saldo</h2>
          <p>Realizado e compromissos projetados · próximos {range} dias.</p>
        </div>
        <div className="dx-range" role="group" aria-label="Horizonte da projeção">
          {RANGES.map((value) => (
            <button
              aria-pressed={range === value}
              key={value}
              onClick={() => setRange(value)}
              type="button"
            >
              {value}d
            </button>
          ))}
        </div>
      </div>
      <div className="dx-chart">
        {chart ? (
          <svg preserveAspectRatio="none" role="img" aria-label="Gráfico de evolução do saldo" viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}>
            {chart.gridLabels.map((line) => (
              <g key={line.y}>
                <line
                  stroke="var(--line)"
                  strokeDasharray={line.y === VIEW.bottom ? undefined : "3 5"}
                  strokeWidth="1"
                  x1={VIEW.left}
                  x2={VIEW.right}
                  y1={line.y}
                  y2={line.y}
                />
                <text className="dx-chart-axis" x="10" y={line.y + 4}>
                  {line.label}
                </text>
              </g>
            ))}
            <line
              stroke="var(--line)"
              strokeWidth="1"
              x1={VIEW.left}
              x2={VIEW.right}
              y1={VIEW.bottom}
              y2={VIEW.bottom}
            />
            {chart.areaPath ? <path d={chart.areaPath} fill="color-mix(in srgb, var(--green) 12%, transparent)" /> : null}
            {chart.realizedPoints.length > 1 ? (
              <path
                d={buildPath(chart.realizedPoints)}
                fill="none"
                stroke="var(--green)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            ) : null}
            {chart.projectionPoints.length > 1 ? (
              <path
                d={buildPath(chart.projectionPoints)}
                fill="none"
                stroke="var(--blue)"
                strokeDasharray="7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            ) : null}
            <line
              stroke="var(--line-strong)"
              strokeDasharray="4 4"
              strokeWidth="1"
              x1={chart.todayX}
              x2={chart.todayX}
              y1={VIEW.top}
              y2={VIEW.bottom}
            />
            <text className="dx-chart-flag" x={chart.todayX + 6} y={VIEW.top + 12}>
              hoje
            </text>
            {chart.todayPoint ? (
              <circle cx={chart.todayPoint.x} cy={chart.todayPoint.y} fill="var(--surface)" r="4" stroke="var(--green)" strokeWidth="2" />
            ) : null}
            {chart.lastProjection ? (
              <circle cx={chart.lastProjection.x} cy={chart.lastProjection.y} fill="var(--surface)" r="4" stroke="var(--blue)" strokeWidth="2" />
            ) : null}
          </svg>
        ) : (
          <div className="dx-chart-empty">Sem dados suficientes para projetar o saldo.</div>
        )}
      </div>
    </section>
  );
}
