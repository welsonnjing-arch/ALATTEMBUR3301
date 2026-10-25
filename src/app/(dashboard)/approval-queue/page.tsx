import { getAllApprovalRequests } from "@/modules/approval/approval.service";
import { getSessionCookie } from "@/modules/auth/session";
import { ApprovalQueueList } from "@/components/approval/ApprovalQueueList";
import { ShieldAlert } from "lucide-react";

export default async function ApprovalQueuePage() {
  const session = await getSessionCookie();
  const requests = await getAllApprovalRequests();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-700">
          <ShieldAlert className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Approval Queue (Pusat Otorisasi Owner)
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Hanya Owner yang berwenang menyetujui komitmen komersial di luar katalog: diskon, harga khusus, perubahan termin pembayaran, refund, dan pembatalan proyek.
        </p>
      </div>

      <ApprovalQueueList
        initialRequests={requests}
        isOwner={session?.role === "OWNER"}
      />
    </div>
  );
}
