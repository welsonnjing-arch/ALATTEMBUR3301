"use server";

import { getAllApprovalRequests } from "../approval/approval.service";
import { getAllTasks } from "../projects/projects.service";
import { getAllWarranties } from "../client-lifecycle/client-lifecycle.service";
import { getAllProspects } from "../crm/crm.service";
import { isFollowUpDueTodayOrOverdue } from "../follow-up/follow-up.service";

export interface SystemNotificationItem {
  id: string;
  type: "APPROVAL" | "TASK_BLOCKED" | "WARRANTY_EXPIRING" | "FOLLOW_UP";
  title: string;
  description: string;
  timestamp: string;
  url: string;
  severity: "URGENT" | "WARNING" | "INFO";
}

export async function fetchSystemNotificationsAction(): Promise<SystemNotificationItem[]> {
  const notifications: SystemNotificationItem[] = [];

  // 1. Pending Approvals
  try {
    const approvals = await getAllApprovalRequests("PENDING");
    for (const app of approvals) {
      notifications.push({
        id: `notif-app-${app.id}`,
        type: "APPROVAL",
        title: "Persetujuan Komersial Diperlukan",
        description: `${app.requestedByUserName} mengajukan ${app.type}: ${app.title}`,
        timestamp: app.createdAt,
        url: "/approval-queue",
        severity: "URGENT",
      });
    }
  } catch {}

  // 2. Blocked Tasks
  try {
    const tasks = await getAllTasks({ status: "BLOCKED" });
    for (const t of tasks) {
      notifications.push({
        id: `notif-task-${t.id}`,
        type: "TASK_BLOCKED",
        title: "Task Operasional Terkendala (Blocked)",
        description: `"${t.title}" pada ${t.projectName || "Proyek"}: ${t.blockedReason || "Menunggu data"}`,
        timestamp: t.updatedAt,
        url: "/tasks",
        severity: "WARNING",
      });
    }
  } catch {}

  // 3. Warranties Expiring Soon
  try {
    const warranties = await getAllWarranties();
    const expiring = warranties.filter((w) => w.status === "EXPIRING_SOON");
    for (const w of expiring) {
      notifications.push({
        id: `notif-warr-${w.id}`,
        type: "WARRANTY_EXPIRING",
        title: "Masa Garansi Segera Berakhir",
        description: `Garansi ${w.clientName} (${w.projectName}) sisa ${w.daysRemaining} hari lagi.`,
        timestamp: w.createdAt,
        url: "/client-lifecycle",
        severity: "WARNING",
      });
    }
  } catch {}

  // 4. Follow-up Due Today
  try {
    const prospects = await getAllProspects();
    const dueToday = prospects.filter((p) =>
      isFollowUpDueTodayOrOverdue(p.nextFollowUpDate)
    );
    if (dueToday.length > 0) {
      notifications.push({
        id: `notif-fu-summary`,
        type: "FOLLOW_UP",
        title: `${dueToday.length} Prospek Perlu Follow-Up Hari Ini`,
        description: `Terdapat prospek yang masuk jadwal kalender follow-up harian (Day 0, +1, +3, +5, +10).`,
        timestamp: new Date().toISOString(),
        url: "/crm",
        severity: "INFO",
      });
    }
  } catch {}

  return notifications;
}
