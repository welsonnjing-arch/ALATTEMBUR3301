import { ShieldAlert, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function ApprovalQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Approval Queue (Persetujuan Owner)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pusat otorisasi Owner untuk komitmen komersial di luar ketentuan: diskon, harga khusus, termin, dan refund
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-800">
          Antrean persetujuan kosong
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          AI atau Sales tidak dapat memberikan diskon atau janji komersial tanpa permohonan persetujuan masuk ke antrean ini.
        </p>
      </div>
    </div>
  );
}
