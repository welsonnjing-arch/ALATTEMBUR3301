import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSessionCookie } from "@/modules/auth/session";
import { queueSignal } from "@/modules/team-lounge/team-lounge.service";
import { SignalingMessage } from "@/modules/team-lounge/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { toUserId, channelId, type, payload } = body;

    if (!channelId || !type) {
      return NextResponse.json(
        { error: "channelId dan type diperlukan" },
        { status: 400 }
      );
    }

    const signal: SignalingMessage = {
      id: crypto.randomUUID(),
      fromUserId: session.id,
      toUserId,
      channelId,
      type,
      payload,
      timestamp: Date.now(),
    };

    queueSignal(signal);

    return NextResponse.json({ success: true, signalId: signal.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal mengirim sinyal WebRTC" },
      { status: 500 }
    );
  }
}
