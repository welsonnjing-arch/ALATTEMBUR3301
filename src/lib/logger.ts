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

export interface AuditLogEntry extends LogActivityParams {
  id: string;
  timestamp: string;
}

// In-memory store for audit trail (latest 200 logs)
const auditLogsStore: AuditLogEntry[] = [];

export function resetAuditLogsForTesting(): void {
  auditLogsStore.length = 0;
}

export function logActivity(params: LogActivityParams): void {
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    ...params,
  };

  auditLogsStore.unshift(entry);
  if (auditLogsStore.length > 200) {
    auditLogsStore.pop();
  }

  // Structured stdout log (siap ditangkap platform observability / docker / server log)
  console.log(`[ACTIVITY_LOG][${params.category}]`, JSON.stringify(entry));
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

export function getRecentAuditLogs(
  category?: ActivityCategory | "ALL",
  limit = 50
): AuditLogEntry[] {
  let list = [...auditLogsStore];
  if (category && category !== "ALL") {
    list = list.filter((l) => l.category === category);
  }
  return list.slice(0, limit);
}
