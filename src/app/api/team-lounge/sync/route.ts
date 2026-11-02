import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "@/modules/auth/session";
import {
  consumeSignals,
  getMessages,
  getVoiceParticipants,
  joinVoiceChannel,
  leaveVoiceChannel,
  updateVoiceState,
} from "@/modules/team-lounge/team-lounge.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const textChannelId = searchParams.get("textChannelId");
    const lastMsgTime = searchParams.get("lastMsgTime");

    // Dapatkan sinyal WebRTC yang ditujukan untuk user ini
    const signals = consumeSignals(session.id);

    // Dapatkan seluruh partisipan voice saat ini
    const voiceParticipants = getVoiceParticipants();

    // Dapatkan pesan baru jika sedang aktif membuka channel teks
    let newMessages = undefined;
    if (textChannelId) {
      const allMsgs = getMessages(textChannelId, 50);
      if (lastMsgTime) {
        newMessages = allMsgs.filter(
          (m) => new Date(m.createdAt).getTime() > new Date(lastMsgTime).getTime()
        );
      } else {
        newMessages = allMsgs;
      }
    }

    return NextResponse.json({
      success: true,
      signals,
      voiceParticipants,
      newMessages,
      serverTime: Date.now(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal melakukan sync" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, channelId, state } = body;

    if (action === "join_voice") {
      if (!channelId) {
        return NextResponse.json({ error: "channelId diperlukan" }, { status: 400 });
      }
      const participant = joinVoiceChannel(channelId, {
        id: session.id,
        fullName: session.fullName,
        role: session.role,
        avatarUrl: session.avatarUrl,
      }, state);

      return NextResponse.json({ success: true, participant });
    }

    if (action === "leave_voice") {
      leaveVoiceChannel(session.id);
      return NextResponse.json({ success: true });
    }

    if (action === "state_change") {
      const updated = updateVoiceState(session.id, state || {});
      return NextResponse.json({ success: true, participant: updated });
    }

    if (action === "ping") {
      updateVoiceState(session.id, { pingOnly: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal memproses aksi" },
      { status: 500 }
    );
  }
}
