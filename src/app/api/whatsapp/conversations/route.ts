import { NextResponse } from "next/server";
import { getAllConversations } from "@/modules/inbox/inbox.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const conversations = await getAllConversations();
  return NextResponse.json(conversations, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
