import { ActivityCategory } from "@/types/enums";

/**
 * FYNUX OS — Structured Activity & Audit Logger
 * Sesuai mainproject.txt (Bab 17) & businesslogic.txt (Bab 18.6):
 * Mencatat: Aktor, Jenis Tindakan, Waktu, Objek yang terpengaruh, dan Detail aman.
 * PENTING: Dilarang keras mencatat password, token, atau secret ke dalam log.
 */

export interface LogActivityParams {
  category: ActivityCategory;
  action: string;
  actorId: string;
  actorEmail?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export function logActivity(params: LogActivityParams): void {
  const payload = {
    timestamp: new Date().toISOString(),
    ...params,
  };

  // Structured stdout log (siap ditangkap platform observability / docker / server log)
  console.log(`[ACTIVITY_LOG][${params.category}]`, JSON.stringify(payload));
}

export function logSecurityEvent(
  action: string,
  actorId: string,
  details: Record<string, unknown>
): void {
  logActivity({
    category: "SECURITY",
    action,
    actorId,
    metadata: details,
  });
}
