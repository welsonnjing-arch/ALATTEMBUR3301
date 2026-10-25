import { MessageSquare, ExternalLink, Bot, Sparkles, Send } from "lucide-react";

export default function WhatsAppInboxPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            WhatsApp Shared Inbox
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Komunikasi bersama prospek/client, sinkronisasi pesan, dan draf AI Sales Agent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://web.whatsapp.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka WhatsApp Web
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Percakapan Aktif */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Percakapan Berjalan
          </h2>
          <div className="text-center py-12 text-xs text-slate-400">
            Belum ada percakapan aktif yang disinkronkan.
          </div>
        </div>

        {/* Center Column: Thread Chat & Riwayat */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between min-h-[400px]">
          <div className="text-center py-16 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">Pilih percakapan di sebelah kiri untuk melihat riwayat pesan.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              disabled
              placeholder="Paste atau ketik pesan client untuk dianalisis..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"
            />
            <button
              type="button"
              disabled
              className="p-2 bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Sales Agent Assistant (Gemini) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <Bot className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              AI Sales Agent (Gemini)
            </h3>
          </div>
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Status Asisten
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              AI membantu menganalisis pesan prospek dan menyusun draf respons. Pengiriman ke WhatsApp tetap dilakukan manual oleh Sales.
            </p>
          </div>
          <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            Menunggu percakapan dipilih
          </div>
        </div>
      </div>
    </div>
  );
}
