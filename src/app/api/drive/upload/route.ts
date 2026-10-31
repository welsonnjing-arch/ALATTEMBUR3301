import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getSessionCookie } from "@/modules/auth/session";
import {
  DRIVE_STORAGE_DIR,
  ensureDriveDirs,
  registerUploadedFile,
} from "@/modules/drive/drive.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Sesi tidak valid." },
        { status: 401 }
      );
    }

    ensureDriveDirs();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const parentId = (formData.get("parentId") as string) || null;
    const tagsRaw = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    const originalName = file.name || "unnamed-file";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ekstrak ekstensi dan sanitasi nama penyimpanan yang aman dari path traversal
    const ext = path.extname(originalName).replace(".", "").toLowerCase() || "bin";
    const safeBaseName = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
      .slice(0, 80);

    const storageFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 6)}-${safeBaseName}.${ext}`;

    const targetFullPath = path.join(DRIVE_STORAGE_DIR, storageFileName);
    fs.writeFileSync(targetFullPath, buffer);

    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const res = await registerUploadedFile(
      {
        name: originalName,
        parentId,
        size: buffer.length,
        mimeType: file.type || "application/octet-stream",
        extension: ext,
        storagePath: storageFileName,
        tags,
      },
      {
        id: session.id,
        name: session.fullName,
        role: session.role,
      }
    );

    return NextResponse.json(res);
  } catch (err: unknown) {
    console.error("[DRIVE_UPLOAD_ERROR]:", err);
    const msg = err instanceof Error ? err.message : "Gagal mengunggah file.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
