"use server";

import fs from "node:fs";
import path from "node:path";
import { getSessionCookie, setSessionCookie } from "./session";
import { getUserById, toSessionData, updateUser } from "./user.service";
import { verifyPassword } from "./crypto";
import { logSecurityEvent } from "@/lib/logger";

export interface ChangePasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UpdateAvatarResult {
  success: boolean;
  avatarUrl?: string;
  message?: string;
  error?: string;
}

/**
 * Server Action untuk pengguna mengubah kata sandi mereka sendiri
 */
export async function changePasswordAction(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const session = await getSessionCookie();
  if (!session) {
    return {
      success: false,
      error: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
    };
  }

  const user = getUserById(session.id);
  if (!user) {
    return {
      success: false,
      error: "Akun pengguna tidak ditemukan di database.",
    };
  }

  // Jika akun sudah memiliki password, wajib verifikasi password saat ini
  if (user.passwordHash && user.salt && input.currentPassword) {
    const isCurrentValid = verifyPassword(
      input.currentPassword,
      user.salt,
      user.passwordHash
    );
    if (!isCurrentValid) {
      logSecurityEvent("PASSWORD_CHANGE_FAILED_WRONG_CURRENT", session.id, {
        email: session.email,
      });
      return {
        success: false,
        error: "Kata sandi saat ini yang Anda masukkan salah.",
      };
    }
  }

  if (!input.newPassword || input.newPassword.trim().length < 6) {
    return {
      success: false,
      error: "Kata sandi baru minimal harus 6 karakter.",
    };
  }

  try {
    updateUser(
      session.id,
      {
        password: input.newPassword.trim(),
      },
      session.id
    );

    logSecurityEvent("PASSWORD_CHANGED_BY_USER", session.id, {
      email: session.email,
    });

    return {
      success: true,
      message: "Kata sandi berhasil diperbarui dengan aman.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Gagal memperbarui kata sandi.",
    };
  }
}

/**
 * Server Action untuk pengguna mengunggah / memperbarui foto profil mereka
 */
export async function updateAvatarAction(input: {
  avatarUrl: string;
}): Promise<UpdateAvatarResult> {
  const session = await getSessionCookie();
  if (!session) {
    return {
      success: false,
      error: "Sesi tidak valid atau telah berakhir. Silakan login kembali.",
    };
  }

  try {
    let finalAvatarUrl: string | undefined = undefined;

    if (input.avatarUrl && input.avatarUrl.trim().length > 0) {
      if (input.avatarUrl.startsWith("data:image/")) {
        // Simpan file gambar fisik ke disk di public/uploads/avatars/ dan data/uploads/avatars/
        const publicDir = path.join(process.cwd(), "public", "uploads", "avatars");
        const dataDir = path.join(process.cwd(), "data", "uploads", "avatars");
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

        // Ekstrak tipe dan buffer gambar base64
        const match = input.avatarUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        const rawExt = match ? match[1].toLowerCase() : "webp";
        const ext = rawExt === "png" ? "png" : rawExt === "jpeg" || rawExt === "jpg" ? "jpg" : "webp";
        const base64Data = match ? match[2] : input.avatarUrl.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const fileName = `avatar-${session.id}.${ext}`;
        fs.writeFileSync(path.join(publicDir, fileName), buffer);
        fs.writeFileSync(path.join(dataDir, fileName), buffer);

        // URL publik ringkas dengan cache-buster
        finalAvatarUrl = `/api/avatar/${fileName}?v=${Date.now()}`;
      } else {
        finalAvatarUrl = input.avatarUrl.trim();
      }
    } else {
      // Hapus avatar jika ada
      finalAvatarUrl = undefined;
      const dirs = [
        path.join(process.cwd(), "public", "uploads", "avatars"),
        path.join(process.cwd(), "data", "uploads", "avatars"),
      ];
      dirs.forEach((d) => {
        if (!fs.existsSync(d)) return;
        ["webp", "png", "jpg", "jpeg"].forEach((ext) => {
          const p = path.join(d, `avatar-${session.id}.${ext}`);
          if (fs.existsSync(p)) {
            try {
              fs.unlinkSync(p);
            } catch {}
          }
        });
      });
    }

    const updated = updateUser(
      session.id,
      {
        avatarUrl: finalAvatarUrl,
      },
      session.id
    );

    // Perbarui sesi cookie secara langsung agar avatar ter-update seketika
    const sessionData = toSessionData(updated);
    await setSessionCookie(sessionData);

    logSecurityEvent("AVATAR_UPDATED_BY_USER", session.id, {
      email: session.email,
    });

    return {
      success: true,
      avatarUrl: finalAvatarUrl,
      message: finalAvatarUrl
        ? "Foto profil berhasil diperbarui."
        : "Foto profil telah dihapus.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || "Gagal memperbarui foto profil.",
    };
  }
}
