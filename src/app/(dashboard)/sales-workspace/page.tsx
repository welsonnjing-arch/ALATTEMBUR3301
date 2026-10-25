import { getAllProspects } from "@/modules/crm/crm.service";
import { getSessionCookie } from "@/modules/auth/session";
import { FollowUpQueueCard } from "@/components/crm/FollowUpQueueCard";
import { ProspectListTable } from "@/components/crm/ProspectListTable";
import { Flame, Calendar, MessageCircle, Target, Users } from "lucide-react";
import { isFollowUpDueTodayOrOverdue } from "@/modules/follow-up/follow-up.service";

export default async function SalesWorkspacePage() {
  const session = await getSessionCookie();

  const assignedSalesId =
    session?.role === "OWNER" || session?.permissions.includes("crm.view_all")
      ? undefined
      : session?.id;

  const prospects = await getAllProspects({ assignedSalesId });

  const assignedCount = prospects.length;
  const dueTodayCount = prospects.filter((p) =>
    isFollowUpDueTodayOrOverdue(p.nextFollowUpDate)
  ).length;
  const needReplyCount = prospects.filter(
    (p) => p.stage === "RESPONDED" || p.nextAction === "REPLY_TO_CLIENT"
  ).length;
  const wonCount = prospects.filter((p) => p.stage === "CLOSED_WON").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sales Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Area kerja operasional: antrean outreach WhatsApp hari ini, tindak lanjut respon prospek, dan pencapaian closing
        </p>
      </div>

      {/* Target Pribadi & Indikator Harian */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Prospek Tanggung Jawab</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {assignedCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Prospek dalam assignment Anda</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Follow-Up Hari Ini</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {dueTodayCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Jatuh tempo jadwal kalender</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Respon Masuk (Perlu Balas)</span>
            <MessageCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {needReplyCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Client merespons pesan outreach</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Deals Closed Won</span>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700">
            {wonCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Bulan kalender berjalan</p>
        </div>
      </div>

      {/* Antrean Follow-up Jatuh Tempo */}
      <FollowUpQueueCard prospects={prospects} />

      {/* Tabel Prospek Sales */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-slate-900">
          Daftar Seluruh Prospek Penjualan
        </h2>
        <ProspectListTable
          initialProspects={prospects}
          userRole={session?.role || "SALES"}
        />
      </div>
    </div>
  );
}
