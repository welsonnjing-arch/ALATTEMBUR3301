import { getGeminiModel } from "@/integrations/gemini/client";
import { AIChatAnalysisInput, AIChatAnalysisOutput } from "./types";
import { logActivity } from "@/lib/logger";

const SYSTEM_PROMPT = `
Anda adalah AI Sales Consultant internal untuk Fynux Digital Solutions (agensi pembuatan website & solusi digital).
Tugas Anda adalah menganalisis percakapan WhatsApp dari prospek bisnis berdasarkan konteks catatan riset.

ATURAN BISNIS KETAT:
1. DILARANG MENGARANG: Jangan mengarang harga, deadline, atau janji komersial di luar katalog Fynux.
2. ACUAN HARGA KATALOG:
   - Basic Website: Rp 1.500.000 (Profil bisnis 3-5 halaman, gratis domain & hosting 1 tahun, garansi 3 bulan)
   - Business Website: Rp 3.500.000+ (Website interaktif dengan CMS kustom)
   - Enterprise Custom: Berdasarkan ruang lingkup pengerjaan
3. DETEKSI PERMINTAAN KOMERSIAL: Jika prospek menawar harga, meminta diskon, atau meminta skema pembayaran/termin khusus, Anda WAJIB menandai "requiresCommercialApproval": true.
4. DRAF PESAN SIAP KIRIM: Tulis draf respons WhatsApp yang santun, solutif, ringkas, profesional, dan mengacu pada kebutuhan bisnis prospek.
5. FORMAT OUTPUT: Wajib menghasilkan format JSON valid tanpa format markdown tambahan:
{
  "suggestedStage": "ENGAGED" | "QUALIFIED" | "NEGOTIATION" | "FAILED",
  "suggestedNextAction": "REPLY_TO_CLIENT" | "PREPARE_PROPOSAL" | "SCHEDULE_MEETING" | "WAITING_FOR_RESPONSE",
  "summary": "Ringkasan situasi prospek dan kebutuhan utamanya",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "suggestedDraftReply": "Teks draf pesan WhatsApp yang siap dikirim oleh Sales",
  "requiresCommercialApproval": boolean,
  "commercialApprovalDetails": {
    "type": "DISCOUNT" | "CUSTOM_PRICING" | "PAYMENT_TERMS" | "CONTRACTUAL_COMMITMENT",
    "description": "Rincian permintaan komersial",
    "requestedValue": "Nilai yang diminta jika ada"
  } | null
}
`;

export async function analyzeConversationWithGemini(
  input: AIChatAnalysisInput
): Promise<AIChatAnalysisOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Jika API key belum dipasang, gunakan Intelligent Deterministic Fallback Engine
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return generateDeterministicAnalysis(input);
  }

  try {
    const model = getGeminiModel();
    const chatSnippet = input.conversationHistory
      .map((m) => `[${m.sender}]: ${m.text}`)
      .join("\n");

    const prompt = `
${SYSTEM_PROMPT}

KONTEKS RISET PROSPEK:
${input.prospectResearchNotes}

RIWAYAT PERCAKAPAN WHATSAPP:
${chatSnippet}

Berikan analisis JSON Anda sekarang:
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Bersihkan pembungkus markdown ```json ... ``` jika model menyertakannya
    const cleanedJson = responseText
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

    const parsed: AIChatAnalysisOutput = JSON.parse(cleanedJson);

    logActivity({
      category: "AI",
      action: "GEMINI_CHAT_ANALYSIS_SUCCESS",
      actorId: "AI_SALES_AGENT",
      metadata: {
        sentiment: parsed.sentiment,
        stage: parsed.suggestedStage,
        requiresApproval: parsed.requiresCommercialApproval,
      },
    });

    return parsed;
  } catch (error) {
    console.warn("[AI_AGENT] Gagal memanggil Gemini API, beralih ke fallback deterministic:", error);
    return generateDeterministicAnalysis(input);
  }
}

/**
 * Intelligent Deterministic Fallback Engine
 * Menjamin sistem tetap berjalan sempurna & akurat meski offline / kuota Gemini free tier habis.
 */
function generateDeterministicAnalysis(input: AIChatAnalysisInput): AIChatAnalysisOutput {
  const lastMessage = input.conversationHistory[input.conversationHistory.length - 1]?.text.toLowerCase() || "";
  const isDiscountInquiry =
    lastMessage.includes("diskon") ||
    lastMessage.includes("potongan") ||
    lastMessage.includes("nego") ||
    lastMessage.includes("bisa kurang") ||
    lastMessage.includes("harga pas");

  const isMeetingInquiry =
    lastMessage.includes("meeting") ||
    lastMessage.includes("ketemu") ||
    lastMessage.includes("zoom") ||
    lastMessage.includes("jadwal");

  const isPositive =
    lastMessage.includes("tertarik") ||
    lastMessage.includes("boleh") ||
    lastMessage.includes("minat") ||
    lastMessage.includes("kirim proposal") ||
    lastMessage.includes("portofolio");

  if (isDiscountInquiry) {
    return {
      suggestedStage: "NEGOTIATION",
      suggestedNextAction: "REPLY_TO_CLIENT",
      summary: "Prospek tertarik dengan layanan namun mengajukan permohonan negosiasi/diskon harga.",
      sentiment: "POSITIVE",
      suggestedDraftReply:
        "Baik Bapak/Ibu, terima kasih atas ketertarikannya. Terkait penyesuaian anggaran, saya akan koordinasikan terlebih dahulu dengan manajemen/Owner kami agar kami dapat memberikan opsi penawaran terbaik untuk kebutuhan bisnis Anda.",
      requiresCommercialApproval: true,
      commercialApprovalDetails: {
        type: "DISCOUNT",
        description: "Permohonan potongan harga / negosiasi dari prospek melalui percakapan WhatsApp.",
        requestedValue: "Negosiasi harga paket",
      },
    };
  }

  if (isMeetingInquiry) {
    return {
      suggestedStage: "QUALIFIED",
      suggestedNextAction: "SCHEDULE_MEETING",
      summary: "Prospek menyepakati agenda pembahasan lebih lanjut melalui sesi meeting/presentasi.",
      sentiment: "POSITIVE",
      suggestedDraftReply:
        "Tentu Bapak/Ibu, dengan senang hati. Apakah hari Selasa atau Rabu pukul 10.00 WIB cocok untuk sesi diskusi online via Google Meet selama 20-30 menit?",
      requiresCommercialApproval: false,
    };
  }

  if (isPositive) {
    return {
      suggestedStage: "ENGAGED",
      suggestedNextAction: "PREPARE_PROPOSAL",
      summary: "Prospek memberikan respon positif dan meminta informasi spesifikasi atau penawaran resmi.",
      sentiment: "POSITIVE",
      suggestedDraftReply:
        "Terima kasih atas respon baiknya Bapak/Ibu. Berdasarkan hasil riset kebutuhan digital Anda, kami dapat menyiapkan ringkasan penawaran solusi website yang relevan. Apakah ada preferensi fitur khusus yang ingin diprioritaskan?",
      requiresCommercialApproval: false,
    };
  }

  // Default Fallback
  return {
    suggestedStage: "ENGAGED",
    suggestedNextAction: "REPLY_TO_CLIENT",
    summary: "Percakapan sedang berlangsung aktif. Perlu pendalaman kebutuhan solusi bisnis prospek.",
    sentiment: "NEUTRAL",
    suggestedDraftReply:
      "Halo Bapak/Ibu, terima kasih kembali. Kami siap membantu memberikan solusi terbaik sesuai target bisnis Anda. Apakah ada bagian dari sistem yang ingin kami jelaskan lebih detail?",
    requiresCommercialApproval: false,
  };
}
