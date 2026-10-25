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
const auditLogsStore: AuditLogEntry[] = [
  {
    id: "log-001",
    timestamp: "2026-10-25T14:30:00Z",
    category: "CRM",
    action: "PROSPECT_RESEARCH_COMPLETED",
    actorId: "22222222-2222-2222-2222-222222222222",
    actorEmail: "sales@fynux.co",
    targetId: "p-002",
    targetType: "PROSPECT",
    metadata: { name: "PT Padma Widya Setiajaya", website: "padmawidyasetiajaya.com" },
  },
  {
    id: "log-002",
    timestamp: "2026-10-25T14:45:00Z",
    category: "FINANCE",
    action: "INVOICE_GENERATED",
    actorId: "11111111-1111-1111-1111-111111111111",
    actorEmail: "faiz@fynux.co",
    targetId: "inv-001",
    targetType: "INVOICE",
    metadata: { invoiceNumber: "FYN-202602-0003", client: "SMAN 2 NGAGLIK", amount: 950000 },
  },
  {
    id: "log-003",
    timestamp: "2026-10-25T15:00:00Z",
    category: "PROJECT",
    action: "PROJECT_CREATED",
    actorId: "11111111-1111-1111-1111-111111111111",
    actorEmail: "faiz@fynux.co",
    targetId: "proj-002",
    targetType: "PROJECT",
    metadata: { name: "Company Profile PT Padma Widya Setiajaya", client: "PT Padma Widya Setiajaya" },
  },
  {
    id: "log-004",
    timestamp: "2026-10-25T15:15:00Z",
    category: "PROJECT",
    action: "TASK_CREATED",
    actorId: "33333333-3333-3333-3333-333333333333",
    actorEmail: "developer@fynux.co",
    targetId: "task-01",
    targetType: "TASK",
    metadata: { title: "Slicing UI Header & Banner Promo", project: "PT Padma Widya Setiajaya" },
  },
  {
    id: "log-005",
    timestamp: "2026-10-25T15:30:00Z",
    category: "PROJECT",
    action: "WARRANTY_ACTIVATED",
    actorId: "11111111-1111-1111-1111-111111111111",
    actorEmail: "faiz@fynux.co",
    targetId: "warr-002",
    targetType: "WARRANTY",
    metadata: { client: "PT Padma Widya Setiajaya", tier: "BUSINESS", durationMonths: 6 },
  },
];

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
