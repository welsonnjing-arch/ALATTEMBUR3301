import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "@/modules/auth/session";
import {
  createMessage,
  getMessages,
  getTextChannels,
  getVoiceChannels,
  toggleReaction,
} from "@/modules/team-lounge/team-lounge.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    // Jika tidak ada channelId, kembalikan daftar textChannels & voiceChannels
    if (!channelId) {
      const textChannels = getTextChannels();
      const voiceChannels = getVoiceChannels();
      return NextResponse.json({ success: true, textChannels, voiceChannels });
    }

    const messages = getMessages(channelId, 100);
    return NextResponse.json({ success: true, messages });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal mengambil pesan" },
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
    const { channelId, content } = body;

    if (!channelId || !content) {
      return NextResponse.json(
        { error: "channelId dan content diperlukan" },
        { status: 400 }
      );
    }

    const newMsg = createMessage(
      channelId,
      {
        id: session.id,
        fullName: session.fullName,
        role: session.role,
        avatarUrl: session.avatarUrl,
      },
      content
    );

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal mengirim pesan" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, emoji } = body;

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: "messageId dan emoji diperlukan" },
        { status: 400 }
      );
    }

    const updated = toggleReaction(messageId, session.id, emoji);
    if (!updated) {
      return NextResponse.json({ error: "Pesan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal memperbarui reaksi" },
      { status: 500 }
    );
  }
}
