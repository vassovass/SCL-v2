export type StepWeekStart = "mon" | "sun";

export function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function getStepWeekRange(date: Date, start: StepWeekStart): { start: Date; end: Date } {
  const day = date.getUTCDay();
  const offset = start === "mon" ? ((day + 6) % 7) : day;

  const startDate = new Date(date);
  startDate.setUTCDate(date.getUTCDate() - offset);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  return { start: startDate, end: endDate };
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}