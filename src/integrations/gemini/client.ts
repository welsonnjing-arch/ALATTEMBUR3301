import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * FYNUX OS — Google Gemini Adapter (Free Tier)
 * Digunakan untuk:
 * 1. Menganalisis percakapan WA yang di-paste ke sistem.
 * 2. Mengklasifikasikan respons & sentimen prospek.
 * 3. Menyusun draf pesan respons (manusia yang tetap mengirim).
 * 4. Menyimpulkan ringkasan riset prospek.
 */

let genAIInstance: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

export function getGeminiModel(modelName: string = "gemini-1.5-flash") {
  const client = getGeminiClient();
  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2, // Rendah untuk menghindari halusinasi / menjaga kepatuhan aturan bisnis
      maxOutputTokens: 1024,
    },
  });
}
