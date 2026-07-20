const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type TimelineDateRange = {
  startDate: string;
  endDate: string;
};

export function getUtcMonthStart(reference = new Date()) {
  return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
}

export function moveUtcMonth(monthStart: Date, amount: number) {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + amount, 1));
}

export function getUtcMonthRange(monthStart: Date): TimelineDateRange {
  const start = getUtcMonthStart(monthStart);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1);

  return createTimelineDateRange(start, end);
}

export function createTimelineDateRange(start: Date, end: Date): TimelineDateRange {
  if (start.getTime() > end.getTime()) {
    throw new RangeError("A data inicial precisa ser anterior ou igual à data final.");
  }

  if (end.getTime() - start.getTime() > 366 * DAY_IN_MS) {
    throw new RangeError("O período da Timeline não pode ultrapassar 366 dias.");
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function getUtcDayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatUtcMonth(value: Date) {
  return monthFormatter.format(value).replace(/^./, (letter) => letter.toUpperCase());
}

export function formatUtcDay(value: string) {
  return dayFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function formatUtcTime(value: string) {
  return timeFormatter.format(new Date(value));
}
