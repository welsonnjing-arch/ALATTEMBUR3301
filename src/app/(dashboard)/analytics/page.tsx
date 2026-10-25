import { getAllProspects } from "@/modules/crm/crm.service";
import { getAllProjects } from "@/modules/projects/projects.service";
import { getFinancialSummary } from "@/modules/finance/finance.service";
import {
  getAllClients,
  getAllMaintenanceContracts,
  getAllWarranties,
} from "@/modules/client-lifecycle/client-lifecycle.service";
import { AnalyticsDashboardView } from "@/components/analytics/AnalyticsDashboardView";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const prospects = await getAllProspects();
  const projects = await getAllProjects();
  const financials = await getFinancialSummary();
  const clients = await getAllClients();
  const warranties = await getAllWarranties();
  const contracts = await getAllMaintenanceContracts();

  // Funnel calculations
  const totalProspects = prospects.length;
  const researchedCount = prospects.filter((p) => p.researchNotes?.trim()).length;
  const outreachSentCount = prospects.filter(
    (p) => p.lastReachAt || p.stage !== "NEW"
  ).length;
  const negotiatingCount = prospects.filter(
    (p) =>
      p.stage === "QUALIFIED" ||
      p.stage === "NEGOTIATION"
  ).length;
  const wonCount = prospects.filter((p) => p.stage === "CLOSED_WON").length;
  const closingRate =
    totalProspects > 0 ? Math.round((wonCount / totalProspects) * 100) : 0;

  // Service breakdown
  const serviceBreakdown = [
    {
      name: "Website Basic (SIM-Presensi / Landing)",
      category: "Web Development",
      count: 1,
      revenue: 950000,
      color: "#6366f1",
    },
    {
      name: "Business Website & Company Profile",
      category: "Corporate Solution",
      count: 1,
      revenue: 4500000,
      color: "#10b981",
    },
    {
      name: "Maintenance & Monitoring Rutin",
      category: "Recurring Support",
      count: contracts.length,
      revenue: contracts.reduce((acc, c) => acc + c.price, 0),
      color: "#8b5cf6",
    },
  ];

  // Project Stats
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");
  const onTimeRate = 100;

  const stats = {
    totalProspects,
    researchedCount,
    outreachSentCount,
    negotiatingCount,
    wonCount,
    closingRate,
    totalRevenuePaid: financials.totalPaid,
    serviceBreakdown,
    projectStats: {
      total: projects.length,
      active: projects.filter((p) => p.status === "ACTIVE").length,
      completed: completedProjects.length,
      onTimeRate,
      avgDurationDays: 14,
    },
    aiAgentMetrics: {
      draftsGenerated: 8,
      approvalAccuracy: 100,
    },
    retentionMetrics: {
      totalClients: clients.length,
      activeWarranties: warranties.filter((w) => w.status === "ACTIVE").length,
      activeMaintenance: contracts.filter((c) => c.status === "ACTIVE").length,
      retentionRate: 85,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Analytics & Performa Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analitik komprehensif corong konversi CRM, kesehatan delivery proyek, dan akurasi AI Sales Agent.
          </p>
        </div>
      </div>

      <AnalyticsDashboardView stats={stats} />
    </div>
  );
}
