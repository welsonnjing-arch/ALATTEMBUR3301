import {
  getAllClients,
  getAllMaintenanceContracts,
  getAllWarranties,
} from "@/modules/client-lifecycle/client-lifecycle.service";
import { getSessionCookie } from "@/modules/auth/session";
import { ClientLifecycleView } from "@/components/client-lifecycle/ClientLifecycleView";
import { HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientLifecyclePage() {
  const session = await getSessionCookie();
  const isOwner = session?.role === "OWNER";

  const clients = await getAllClients();
  const warranties = await getAllWarranties();
  const contracts = await getAllMaintenanceContracts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-indigo-600" />
            Client Lifecycle, Warranty & Maintenance Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan menyeluruh data induk klien resmi, garansi teknis bertingkat (3, 6, 12 bulan), log klaim perbaikan, dan recurring maintenance renewal.
          </p>
        </div>
      </div>

      <ClientLifecycleView
        initialClients={clients}
        initialWarranties={warranties}
        initialContracts={contracts}
        userRole={session?.role}
        isOwner={isOwner}
      />
    </div>
  );
}
