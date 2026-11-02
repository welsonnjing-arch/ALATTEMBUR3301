import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const DATA_AVATARS_DIR = path.join(process.cwd(), "data", "uploads", "avatars");
const PUBLIC_AVATARS_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const rawFilename = resolvedParams.filename || "";
    const filename = path.basename(rawFilename);

    if (!filename) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Cek di data/uploads/avatars terlebih dahulu, lalu fallback ke public/uploads/avatars
    let filePath = path.join(DATA_AVATARS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_AVATARS_DIR, filename);
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Avatar Not Found", { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || "image/webp";
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
    console.error("[AVATAR_GET] Gagal membaca berkas avatar:", err);
    return new NextResponse("Gagal membaca foto profil", { status: 500 });
  }
}
