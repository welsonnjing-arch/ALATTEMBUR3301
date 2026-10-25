import { getAllProspects } from "@/modules/crm/crm.service";
import { getSessionCookie } from "@/modules/auth/session";
import { ProspectListTable } from "@/components/crm/ProspectListTable";
import { Users, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

export default async function CRMPage() {
  const session = await getSessionCookie();

  // Filter based on role & permissions
  const assignedSalesId =
    session?.role === "OWNER" || session?.permissions.includes("crm.view_all")
      ? undefined
      : session?.id;

  const prospects = await getAllProspects({ assignedSalesId });

  const total = prospects.length;
  const inPipeline = prospects.filter(
    (p) => p.stage !== "CLOSED_WON" && p.stage !== "FAILED"
  ).length;
  const won = prospects.filter((p) => p.stage === "CLOSED_WON").length;
  const failed = prospects.filter((p) => p.stage === "FAILED").length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          CRM & Prospect Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Database prospek berbasis riset bisnis, status pipeline terpisah dari next action, dan mesin follow-up hari kalender
        </p>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Prospek Riset</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-indigo-600">Pipeline Aktif</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{inPipeline}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600">Deal Closed Won</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{won}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-rose-600">Failed / Tersimpan</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{failed}</div>
        </div>
      </div>

      {/* Interactive Table with Search, Tabs, Modals */}
      <ProspectListTable
        initialProspects={prospects}
        userRole={session?.role || "OWNER"}
      />
    </div>
  );
}
