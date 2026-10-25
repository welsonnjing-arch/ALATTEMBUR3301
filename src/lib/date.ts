/**
 * FYNUX OS — Date & Follow-Up Engine Time Calculations
 * Berbasis hari kalender (akhir pekan & hari libur tetap dihitung)
 * Penyimpanan waktu standar UTC, tampilan zona waktu Asia/Jakarta (WIB).
 */

export const JAKARTA_TZ = "Asia/Jakarta";

export function formatDateTimeWIB(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDateWIB(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    dateStyle: "medium",
  }).format(d);
}

/**
 * Menambahkan sejumlah hari kalender ke tanggal referensi.
 */
export function addCalendarDays(baseDate: Date, days: number): Date {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Default Follow-up Intervals sesuai blueprint:
 * FU 1: +1 hari setelah initial reach
 * FU 2: +3 hari setelah FU 1
 * FU 3: +5 hari setelah FU 2
 * Failed: +10 hari setelah FU 3 tanpa respons
 */
export const DEFAULT_FOLLOW_UP_INTERVALS = {
  FU1_DAYS: 1,
  FU2_DAYS: 3,
  FU3_DAYS: 5,
  FAILED_NO_RESPONSE_DAYS: 10,
} as const;

export function getNextFollowUpSchedule(
  currentStep: "INITIAL" | "FU1" | "FU2" | "FU3",
  lastActionDate: Date
): { nextStep: "FU1" | "FU2" | "FU3" | "FAILED"; dueDate: Date } {
  switch (currentStep) {
    case "INITIAL":
      return {
        nextStep: "FU1",
        dueDate: addCalendarDays(lastActionDate, DEFAULT_FOLLOW_UP_INTERVALS.FU1_DAYS),
      };
    case "FU1":
      return {
        nextStep: "FU2",
        dueDate: addCalendarDays(lastActionDate, DEFAULT_FOLLOW_UP_INTERVALS.FU2_DAYS),
      };
    case "FU2":
      return {
        nextStep: "FU3",
        dueDate: addCalendarDays(lastActionDate, DEFAULT_FOLLOW_UP_INTERVALS.FU3_DAYS),
      };
    case "FU3":
      return {
        nextStep: "FAILED",
        dueDate: addCalendarDays(
          lastActionDate,
          DEFAULT_FOLLOW_UP_INTERVALS.FAILED_NO_RESPONSE_DAYS
        ),
      };
  }
}
