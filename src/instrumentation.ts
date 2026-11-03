/**
 * Next.js Server Lifecycle Instrumentation Hook
 * Berjalan satu kali saat server Node.js Next.js booting (npm start / pm2 start).
 * Digunakan untuk mengaktifkan WhatsApp Keep-Alive 24/7 di background secara otomatis.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    console.log("[SERVER_BOOT] Mengaktifkan Fynux OS 24/7 Background Services...");
    try {
      const { initWhatsAppKeepAlive } = await import(
        "@/modules/whatsapp/whatsapp.service"
      );
      initWhatsAppKeepAlive();
    } catch (err) {
      console.error(
        "[SERVER_BOOT_ERROR] Gagal menginisialisasi WhatsApp keep-alive service:",
        err
      );
    }
  }
}
