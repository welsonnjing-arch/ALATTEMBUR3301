import crypto from "node:crypto";

/**
 * Menghasilkan salt acak 16 byte heksadesimal.
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Menghasilkan hash kata sandi menggunakan PBKDF2 dengan SHA-512.
 * Standar industri tanpa membutuhkan dependensi biner pihak ketiga.
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

/**
 * Memverifikasi kesesuaian kata sandi dengan hash tersimpan secara timing-safe.
 */
export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  try {
    const computedHash = hashPassword(password, salt);
    const computedBuffer = Buffer.from(computedHash, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
