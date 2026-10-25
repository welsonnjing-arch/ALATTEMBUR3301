import { addCalendarDays, DEFAULT_FOLLOW_UP_INTERVALS } from "@/lib/date";

export interface NextFollowUpSchedule {
  nextStep: "FU1" | "FU2" | "FU3" | "FAILED";
  nextDueDate: string; // ISO date string YYYY-MM-DD
  daysInterval: number;
}

/**
 * Menghitung jadwal follow-up berikutnya berdasarkan hari kalender (akhir pekan/libur tetap dihitung).
 */
export function calculateNextFollowUp(
  currentStep: "INITIAL" | "FU1" | "FU2" | "FU3",
  baseDate: Date = new Date()
): NextFollowUpSchedule {
  let days = 1;
  let nextStep: "FU1" | "FU2" | "FU3" | "FAILED" = "FU1";

  switch (currentStep) {
    case "INITIAL":
      days = DEFAULT_FOLLOW_UP_INTERVALS.FU1_DAYS; // +1 hari
      nextStep = "FU1";
      break;
    case "FU1":
      days = DEFAULT_FOLLOW_UP_INTERVALS.FU2_DAYS; // +3 hari
      nextStep = "FU2";
      break;
    case "FU2":
      days = DEFAULT_FOLLOW_UP_INTERVALS.FU3_DAYS; // +5 hari
      nextStep = "FU3";
      break;
    case "FU3":
      days = DEFAULT_FOLLOW_UP_INTERVALS.FAILED_NO_RESPONSE_DAYS; // +10 hari
      nextStep = "FAILED";
      break;
  }

  const dueDate = addCalendarDays(baseDate, days);
  const formattedDate = dueDate.toISOString().split("T")[0];

  return {
    nextStep,
    nextDueDate: formattedDate,
    daysInterval: days,
  };
}

/**
 * Memeriksa apakah follow-up jatuh tempo hari ini atau sebelumnya
 */
export function isFollowUpDueTodayOrOverdue(dueDateStr?: string | null): boolean {
  if (!dueDateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dueDateStr <= today;
}

export function isFollowUpOverdue(dueDateStr?: string | null): boolean {
  if (!dueDateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dueDateStr < today;
}
