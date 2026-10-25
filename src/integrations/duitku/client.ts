import crypto from "crypto";

/**
 * FYNUX OS — Duitku Payment Gateway Adapter (QRIS & Virtual Account)
 * Mengelola kalkulasi signature, pembuatan URL pembayaran, dan verifikasi callback webhook.
 */

export interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  env: "sandbox" | "production";
  callbackUrl: string;
  returnUrl: string;
}

export function getDuitkuConfig(): DuitkuConfig {
  return {
    merchantCode: process.env.DUITKU_MERCHANT_CODE || "",
    apiKey: process.env.DUITKU_API_KEY || "",
    env: (process.env.DUITKU_ENV as "sandbox" | "production") || "sandbox",
    callbackUrl: process.env.DUITKU_CALLBACK_URL || "",
    returnUrl: process.env.DUITKU_RETURN_URL || "",
  };
}

/**
 * Menghasilkan signature MD5 untuk transaksi Duitku
 * Format: MD5(merchantCode + orderId + amount + apiKey)
 */
export function generateDuitkuSignature(
  merchantCode: string,
  orderId: string,
  amount: number,
  apiKey: string
): string {
  const raw = `${merchantCode}${orderId}${amount}${apiKey}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

/**
 * Verifikasi callback webhook dari Duitku
 * Format: MD5(merchantCode + amount + orderId + apiKey)
 */
export function verifyDuitkuCallbackSignature(
  merchantCode: string,
  amount: string | number,
  orderId: string,
  incomingSignature: string,
  apiKey: string
): boolean {
  const raw = `${merchantCode}${amount}${orderId}${apiKey}`;
  const calculated = crypto.createHash("md5").update(raw).digest("hex");
  return calculated.toLowerCase() === incomingSignature.toLowerCase();
}
