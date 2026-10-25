import { getRecentAuditLogs } from "@/lib/logger";
import { getSessionCookie } from "@/modules/auth/session";
import { SettingsAndAuditView } from "@/components/settings/SettingsAndAuditView";
import { Sliders } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionCookie();
  const logs = getRecentAuditLogs("ALL", 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-600" />
            Sistem, Business Rules & Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan terpusat aturan operasional bisnis Fynux, jadwal kalender follow-up, rekening pembayaran, dan audit trail seluruh aktivitas.
          </p>
        </div>
      </div>

      <SettingsAndAuditView
        initialLogs={logs}
        currentUserRole={session?.role}
      />
    </div>
  );
}
