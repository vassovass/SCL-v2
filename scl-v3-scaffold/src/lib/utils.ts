import { type ClassValue, clsx } from "clsx";

// Simple cn utility for conditional class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get today's date in UTC
export function getTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Calculate step week range based on start day
export function getStepWeekRange(
  today: Date,
  startDay: string
): { start: Date; end: Date } {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDay = dayMap[startDay.toLowerCase()] ?? 1; // Default to Monday
  const currentDay = today.getUTCDay();

  let daysBack = currentDay - targetDay;
  if (daysBack < 0) daysBack += 7;

  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - daysBack);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return { start, end };
}
