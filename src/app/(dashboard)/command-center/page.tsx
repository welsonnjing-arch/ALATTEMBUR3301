import { getFinancialSummary } from "@/modules/finance/finance.service";
import { getAllProspects } from "@/modules/crm/crm.service";
import { isFollowUpDueTodayOrOverdue } from "@/modules/follow-up/follow-up.service";
import { getAllProjects, getAllTasks } from "@/modules/projects/projects.service";
import { getAllApprovalRequests } from "@/modules/approval/approval.service";
import {
  getAllClients,
  getAllMaintenanceContracts,
  getAllWarranties,
} from "@/modules/client-lifecycle/client-lifecycle.service";
import { CommandCenterView } from "@/components/dashboard/CommandCenterView";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const financials = await getFinancialSummary();
  const prospects = await getAllProspects();
  const projects = await getAllProjects();
  const tasks = await getAllTasks();
  const pendingApprovals = await getAllApprovalRequests("PENDING");
  const clients = await getAllClients();
  const warranties = await getAllWarranties();
  const contracts = await getAllMaintenanceContracts();

  // CRM Calculations
  const followUpDueToday = prospects.filter((p) =>
    isFollowUpDueTodayOrOverdue(p.nextFollowUpDate)
  );
  const activeDeals = prospects.filter(
    (p) =>
      p.stage === "QUALIFIED" ||
      p.stage === "NEGOTIATION" ||
      p.stage === "CLOSED_WON"
  );
  // Estimate pipeline value based on deals/prospects
  const pipelineValue = activeDeals.reduce((sum, p) => {
    const services = p.potentialServices || "";
    if (services.includes("Business")) return sum + 4500000;
    if (services.includes("Custom") || services.includes("Enterprise"))
      return sum + 12000000;
    return sum + 2500000;
  }, 0);

  // Projects Calculations
  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((acc, p) => acc + p.progressPercent, 0) / projects.length
        )
      : 0;

  // Retention Calculations
  const expiringWarranties = warranties.filter(
    (w) => w.status === "EXPIRING_SOON"
  );
  const activeContracts = contracts.filter((c) => c.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <CommandCenterView
        financials={financials}
        crmMetrics={{
          totalProspects: prospects.length,
          activeDealsCount: activeDeals.length,
          pipelineValue,
          followUpDueTodayCount: followUpDueToday.length,
        }}
        projectsMetrics={{
          activeProjectsCount: activeProjects.length,
          blockedTasksCount: blockedTasks.length,
          avgProgress,
        }}
        governanceMetrics={{
          pendingApprovalsCount: pendingApprovals.length,
        }}
        retentionMetrics={{
          activeClientsCount: clients.length,
          warrantiesExpiringCount: expiringWarranties.length,
          maintenanceActiveCount: activeContracts.length,
        }}
      />
    </div>
  );
}
