import { getSessionCookie, getDefaultWorkspaceRoute } from "@/modules/auth/session";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getSessionCookie();

  if (!session) {
    redirect("/login");
  }

  redirect(getDefaultWorkspaceRoute(session.role));
}
