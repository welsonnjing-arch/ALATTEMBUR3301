import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { getSessionCookie } from "@/modules/auth/session";
import { getDriveItemFilePath } from "@/modules/drive/drive.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const fileData = getDriveItemFilePath(params.id);
    if (!fileData) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const { filePath, item } = fileData;
    const isInline = req.nextUrl.searchParams.get("inline") === "true";

    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    // Escape and quote filename according to RFC standards
    const safeEncodedName = encodeURIComponent(item.name);
    const dispositionType = isInline ? "inline" : "attachment";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": item.mimeType || "application/octet-stream",
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `${dispositionType}; filename="${safeEncodedName}"; filename*=UTF-8''${safeEncodedName}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: unknown) {
    console.error("[DRIVE_DOWNLOAD_ERROR]:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
