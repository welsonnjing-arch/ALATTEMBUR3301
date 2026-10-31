import { redirect } from "next/navigation";
import { getSessionCookie } from "@/modules/auth/session";
import { getDriveItems, getDriveStats } from "@/modules/drive/drive.service";
import { DriveView } from "@/components/drive/DriveView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shared Drive HQ — FYNUX OS",
  description: "Pusat penyimpanan & direktori file bersama internal tim HQ Fynux.",
};

export default async function DrivePage() {
  const session = await getSessionCookie();
  if (!session) {
    redirect("/login");
  }

  const initialItems = await getDriveItems({ parentId: null });
  const initialStats = await getDriveStats();

  return (
    <DriveView
      initialItems={initialItems}
      initialStats={initialStats}
      currentUser={{
        id: session.id,
        name: session.fullName,
        role: session.role,
      }}
    />
  );
}
