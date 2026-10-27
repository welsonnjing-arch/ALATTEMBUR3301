"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Flame, Smile, ThumbsUp, Briefcase, Lightbulb, Heart } from "lucide-react";

interface EmojiItem {
  char: string;
  name: string;
  keywords: string[];
  category: "POPULAR" | "SMILEYS" | "HANDS" | "WORK" | "SYMBOLS" | "HEARTS";
}

const EMOJI_DATABASE: EmojiItem[] = [
  // POPULAR / QUICK SALES EMOJIS
  { char: "👋", name: "Lambaian Tangan", keywords: ["halo", "hai", "salam", "wave", "lambaian"], category: "POPULAR" },
  { char: "🙏", name: "Terima Kasih / Mohon", keywords: ["terima kasih", "makasih", "tolong", "pray", "thanks"], category: "POPULAR" },
  { char: "👍", name: "Jempol / Setuju", keywords: ["ok", "siap", "mantap", "setuju", "thumbs", "good"], category: "POPULAR" },
  { char: "😊", name: "Senyum Ramah", keywords: ["senyum", "smile", "ramah", "senang", "happy"], category: "POPULAR" },
  { char: "🚀", name: "Roket / Meluncur", keywords: ["roket", "cepat", "launch", "meluncur", "gas"], category: "POPULAR" },
  { char: "💼", name: "Koper Bisnis", keywords: ["bisnis", "kerja", "proyek", "briefcase", "kantor"], category: "POPULAR" },
  { char: "✅", name: "Centang Hijau", keywords: ["selesai", "sukses", "done", "check", "benar"], category: "POPULAR" },
  { char: "🤝", name: "Jabat Tangan / Deal", keywords: ["deal", "jabat", "sepakat", "partner", "handshake"], category: "POPULAR" },
  { char: "📞", name: "Telepon", keywords: ["telepon", "call", "hubungi", "kontak", "phone"], category: "POPULAR" },
  { char: "💬", name: "Pesan Chat", keywords: ["chat", "pesan", "obrolan", "tanya", "message"], category: "POPULAR" },
  { char: "⭐", name: "Bintang", keywords: ["bintang", "favorit", "star", "terbaik"], category: "POPULAR" },
  { char: "💡", name: "Ide / Solusi", keywords: ["ide", "solusi", "lampu", "idea", "tips"], category: "POPULAR" },
  { char: "📌", name: "Pin Catatan", keywords: ["pin", "catatan", "penting", "tandai"], category: "POPULAR" },
  { char: "✨", name: "Kilauan / Spesial", keywords: ["spesial", "kilau", "sparkle", "keren", "magic"], category: "POPULAR" },
  { char: "🎉", name: "Pesta / Selamat", keywords: ["selamat", "congrats", "party", "rayakan"], category: "POPULAR" },
  { char: "🔥", name: "Api / Panas", keywords: ["api", "fire", "hot", "laris", "semangat"], category: "POPULAR" },
  { char: "💯", name: "Seratus Poin", keywords: ["100", "sempurna", "mantul", "perfect"], category: "POPULAR" },
  { char: "🎯", name: "Target / Sasaran", keywords: ["target", "fokus", "tujuan", "goal"], category: "POPULAR" },
  { char: "❤️", name: "Hati Merah", keywords: ["hati", "love", "suka", "heart"], category: "POPULAR" },
  { char: "👌", name: "Tangan OK", keywords: ["ok", "siap", "bagus", "fine"], category: "POPULAR" },
  { char: "☕", name: "Kopi Santai", keywords: ["kopi", "rehat", "coffee", "santai"], category: "POPULAR" },
  { char: "💻", name: "Laptop Developer", keywords: ["laptop", "coding", "web", "komputer"], category: "POPULAR" },
  { char: "🏢", name: "Gedung Kantor", keywords: ["kantor", "gedung", "perusahaan", "pt", "office"], category: "POPULAR" },
  { char: "💰", name: "Kantong Uang / Budget", keywords: ["uang", "budget", "biaya", "harga", "money"], category: "POPULAR" },

  // SMILEYS & FACES
  { char: "😀", name: "Tertawa Lebar", keywords: ["senyum", "grinning", "tertawa"], category: "SMILEYS" },
  { char: "😃", name: "Senyum Ceria", keywords: ["senyum", "happy", "ceria"], category: "SMILEYS" },
  { char: "😄", name: "Tertawa Mata Tertutup", keywords: ["lucu", "laugh", "senang"], category: "SMILEYS" },
  { char: "😁", name: "Tersenyum Menyeringai", keywords: ["beam", "gigi", "senyum"], category: "SMILEYS" },
  { char: "😆", name: "Tertawa Terbahak", keywords: ["ngakak", "gembira", "lol"], category: "SMILEYS" },
  { char: "😅", name: "Senyum Keringat Dingin", keywords: ["keringat", "lega", "sweat"], category: "SMILEYS" },
  { char: "🤣", name: "Tertawa Terguling", keywords: ["rofl", "ngakak", "lucu"], category: "SMILEYS" },
  { char: "😂", name: "Tertawa Menangis", keywords: ["joy", "lucu", "lawak"], category: "SMILEYS" },
  { char: "🙂", name: "Senyum Tipis", keywords: ["senyum", "sopan", "slight"], category: "SMILEYS" },
  { char: "🙃", name: "Wajah Terbalik", keywords: ["terbalik", "iseng", "upside"], category: "SMILEYS" },
  { char: "😉", name: "Kedipan Mata", keywords: ["kedip", "wink", "kode"], category: "SMILEYS" },
  { char: "😇", name: "Wajah Malaikat", keywords: ["baik", "angel", "suci"], category: "SMILEYS" },
  { char: "🥰", name: "Penuh Cinta", keywords: ["cinta", "love", "senang"], category: "SMILEYS" },
  { char: "😍", name: "Mata Hati", keywords: ["suka", "kagum", "terpukau"], category: "SMILEYS" },
  { char: "🤩", name: "Mata Bintang", keywords: ["terpukau", "keren", "kagum"], category: "SMILEYS" },
  { char: "😘", name: "Cium Mesra", keywords: ["cium", "kiss", "ramah"], category: "SMILEYS" },
  { char: "😋", name: "Lezat / Menikmati", keywords: ["lezat", "enak", "yum"], category: "SMILEYS" },
  { char: "😜", name: "Melet Kedip", keywords: ["melet", "canda", "joke"], category: "SMILEYS" },
  { char: "🤪", name: "Gila / Heboh", keywords: ["heboh", "gokil", "crazy"], category: "SMILEYS" },
  { char: "🤑", name: "Mata Duitan", keywords: ["cuan", "uang", "untung", "rich"], category: "SMILEYS" },
  { char: "🤗", name: "Pelukan Hangat", keywords: ["peluk", "hug", "hangat"], category: "SMILEYS" },
  { char: "🤫", name: "Rahasia", keywords: ["diam", "shh", "rahasia"], category: "SMILEYS" },
  { char: "🤔", name: "Berpikir", keywords: ["pikir", "tanya", "think", "ragu"], category: "SMILEYS" },
  { char: "🤐", name: "Bungkam", keywords: ["diam", "kunci", "silent"], category: "SMILEYS" },
  { char: "🤨", name: "Alis Terangkat", keywords: ["curiga", "ragu", "skeptic"], category: "SMILEYS" },
  { char: "😐", name: "Datar", keywords: ["datar", "neutral", "biasa"], category: "SMILEYS" },
  { char: "😏", name: "Senyum Nakal", keywords: ["smirk", "paham", "licik"], category: "SMILEYS" },
  { char: "🙄", name: "Putar Bola Mata", keywords: ["capek", "bosen", "roll"], category: "SMILEYS" },
  { char: "😬", name: "Meringis", keywords: ["canggung", "grimace", "aduh"], category: "SMILEYS" },
  { char: "😌", name: "Lega", keywords: ["tenang", "lega", "relieved"], category: "SMILEYS" },
  { char: "😴", name: "Tidur", keywords: ["ngantuk", "tidur", "sleep"], category: "SMILEYS" },
  { char: "😷", name: "Masker", keywords: ["sakit", "masker", "flu"], category: "SMILEYS" },
  { char: "😎", name: "Kacamata Hitam / Keren", keywords: ["keren", "cool", "boss"], category: "SMILEYS" },
  { char: "🤓", name: "Kacamata / Pintar", keywords: ["kutu buku", "nerd", "ahli"], category: "SMILEYS" },
  { char: "🧐", name: "Kaca Pembesar / Menyelidiki", keywords: ["analisis", "riset", "cek"], category: "SMILEYS" },
  { char: "🥺", name: "Memohon Harap", keywords: ["harap", "please", "mohon"], category: "SMILEYS" },
  { char: "😮", name: "Terkejut", keywords: ["kaget", "wow", "oh"], category: "SMILEYS" },
  { char: "😱", name: "Histeris", keywords: ["kaget", "shock", "panik"], category: "SMILEYS" },
  { char: "😭", name: "Menangis Kencang", keywords: ["sedih", "nangis", "cry"], category: "SMILEYS" },

  // GESTURES & HANDS
  { char: "👏", name: "Tepuk Tangan", keywords: ["applause", "hebat", "salut"], category: "HANDS" },
  { char: "🙌", name: "Dua Tangan Terangkat", keywords: ["alhamdulillah", "hore", "syukur"], category: "HANDS" },
  { char: "👐", name: "Tangan Terbuka", keywords: ["buka", "welcome", "terbuka"], category: "HANDS" },
  { char: "🤲", name: "Tadah Tangan Doa", keywords: ["doa", "harap", "amin"], category: "HANDS" },
  { char: "✍️", name: "Menulis", keywords: ["tulis", "catat", "write"], category: "HANDS" },
  { char: "💪", name: "Otot Lengan / Semangat", keywords: ["semangat", "kuat", "power"], category: "HANDS" },
  { char: "🤙", name: "Tangan Telepon / Santai", keywords: ["call", "santai", "shaka"], category: "HANDS" },
  { char: "✌️", name: "Tanda Damai / Peace", keywords: ["peace", "damai", "dua"], category: "HANDS" },
  { char: "🤞", name: "Jari Silang / Berharap", keywords: ["berharap", "hope", "luck"], category: "HANDS" },
  { char: "🤟", name: "I Love You Hand", keywords: ["love", "sayang", "metal"], category: "HANDS" },
  { char: "🤘", name: "Rock On", keywords: ["rock", "mantap", "metal"], category: "HANDS" },
  { char: "🤌", name: "Jari Menguncup", keywords: ["tunggu", "detail", "maksud"], category: "HANDS" },
  { char: "🤏", name: "Sedikit", keywords: ["sedikit", "kecil", "pinch"], category: "HANDS" },
  { char: "👈", name: "Tunjuk Kiri", keywords: ["kiri", "left", "sini"], category: "HANDS" },
  { char: "👉", name: "Tunjuk Kanan", keywords: ["kanan", "right", "sana"], category: "HANDS" },
  { char: "👆", name: "Tunjuk Atas", keywords: ["atas", "up", "lihat"], category: "HANDS" },
  { char: "👇", name: "Tunjuk Bawah", keywords: ["bawah", "down", "berikut"], category: "HANDS" },
  { char: "☝️", name: "Satu Jari Telunjuk", keywords: ["satu", "penting", "poin"], category: "HANDS" },
  { char: "✋", name: "Tangan Angkat / Stop", keywords: ["stop", "tunggu", "halo"], category: "HANDS" },

  // WORK, OFFICE & TECH
  { char: "📊", name: "Grafik Batang", keywords: ["statistik", "data", "chart", "laporan"], category: "WORK" },
  { char: "📈", name: "Grafik Naik", keywords: ["omset", "naik", "growth", "tumbuh"], category: "WORK" },
  { char: "📉", name: "Grafik Turun", keywords: ["turun", "evaluasi", "loss"], category: "WORK" },
  { char: "📋", name: "Papan Klip / To-Do", keywords: ["clipboard", "tugas", "prospek", "list"], category: "WORK" },
  { char: "📁", name: "Folder Berkas", keywords: ["folder", "berkas", "file", "dokumen"], category: "WORK" },
  { char: "📂", name: "Folder Terbuka", keywords: ["folder", "buka", "dokumen"], category: "WORK" },
  { char: "📑", name: "Tab Dokumen", keywords: ["halaman", "tab", "berkas"], category: "WORK" },
  { char: "🗞️", name: "Koran Berita", keywords: ["berita", "news", "koran"], category: "WORK" },
  { char: "📰", name: "Surat Kabar", keywords: ["artikel", "media", "pers"], category: "WORK" },
  { char: "🏷️", name: "Label Harga / Tag", keywords: ["harga", "tag", "diskon", "label"], category: "WORK" },
  { char: "✉️", name: "Amplop Surat", keywords: ["surat", "mail", "inbox"], category: "WORK" },
  { char: "📧", name: "Email", keywords: ["email", "surat", "surel"], category: "WORK" },
  { char: "📦", name: "Paket Pengiriman", keywords: ["paket", "kirim", "delivery", "box"], category: "WORK" },
  { char: "🖥️", name: "Monitor Desktop", keywords: ["komputer", "pc", "layar"], category: "WORK" },
  { char: "🖨️", name: "Printer Cetak", keywords: ["print", "cetak", "invoice"], category: "WORK" },
  { char: "⌨️", name: "Keyboard", keywords: ["ketik", "keyboard", "coding"], category: "WORK" },
  { char: "📱", name: "Smartphone", keywords: ["hp", "handphone", "mobile", "wa"], category: "WORK" },
  { char: "💵", name: "Uang Dolar / Rupiah", keywords: ["uang", "cash", "tunai", "bayar"], category: "WORK" },
  { char: "💳", name: "Kartu Kredit / Debit", keywords: ["kartu", "transfer", "qris", "payment"], category: "WORK" },
  { char: "🧾", name: "Struk Pembayaran / Nota", keywords: ["nota", "kuitansi", "invoice", "struk"], category: "WORK" },
  { char: "🪙", name: "Koin Emas", keywords: ["koin", "saldo", "poin"], category: "WORK" },
  { char: "💎", name: "Berlian Premium", keywords: ["berlian", "diamond", "mewah", "premium"], category: "WORK" },
  { char: "🛠️", name: "Alat Perbaikan / Setting", keywords: ["setting", "konfigurasi", "tools", "reparasi"], category: "WORK" },
  { char: "🔧", name: "Kunci Pas", keywords: ["bengkel", "teknis", "fix"], category: "WORK" },
  { char: "🔒", name: "Tergembok Aman", keywords: ["aman", "privasi", "lock", "ssl"], category: "WORK" },
  { char: "🔑", name: "Kunci Akses", keywords: ["kunci", "key", "password", "akses"], category: "WORK" },

  // SYMBOLS & STATUS
  { char: "❌", name: "Silang Merah", keywords: ["batal", "salah", "cross", "cancel"], category: "SYMBOLS" },
  { char: "⚠️", name: "Peringatan", keywords: ["warning", "awas", "hati-hati", "perhatian"], category: "SYMBOLS" },
  { char: "⛔", name: "Dilarang Masuk", keywords: ["stop", "larang", "no"], category: "SYMBOLS" },
  { char: "❓", name: "Tanda Tanya", keywords: ["tanya", "apa", "question"], category: "SYMBOLS" },
  { char: "❗", name: "Tanda Seru", keywords: ["seru", "perhatian", "alert"], category: "SYMBOLS" },
  { char: "🔔", name: "Lonceng Notifikasi", keywords: ["notif", "pengingat", "bell"], category: "SYMBOLS" },
  { char: "🔕", name: "Senyapkan Notifikasi", keywords: ["mute", "senyap"], category: "SYMBOLS" },
  { char: "📢", name: "Pengeras Suara", keywords: ["pengumuman", "broadcast", "info"], category: "SYMBOLS" },
  { char: "⏰", name: "Jam Beker / Alarm", keywords: ["jam", "waktu", "jadwal", "alarm"], category: "SYMBOLS" },
  { char: "⏳", name: "Jam Pasir / Menunggu", keywords: ["tunggu", "proses", "loading", "waiting"], category: "SYMBOLS" },
  { char: "📅", name: "Kalender", keywords: ["kalender", "tanggal", "jadwal", "date"], category: "SYMBOLS" },
  { char: "⚡", name: "Kilat Cepat", keywords: ["cepat", "flash", "kilat", "listrik"], category: "SYMBOLS" },
  { char: "💥", name: "Ledakan", keywords: ["boom", "heboh", "promo"], category: "SYMBOLS" },
  { char: "🏆", name: "Piala Juara", keywords: ["juara", "piala", "trophy", "prestasi"], category: "SYMBOLS" },
  { char: "🎁", name: "Hadiah / Kado", keywords: ["hadiah", "kado", "bonus", "gift"], category: "SYMBOLS" },

  // HEARTS & REACTIONS
  { char: "💖", name: "Hati Berkilau", keywords: ["sparkle", "love", "terima kasih"], category: "HEARTS" },
  { char: "💙", name: "Hati Biru", keywords: ["blue", "fynux", "loyal"], category: "HEARTS" },
  { char: "💚", name: "Hati Hijau", keywords: ["green", "whatsapp", "sukses"], category: "HEARTS" },
  { char: "🧡", name: "Hati Oranye", keywords: ["orange", "hangat"], category: "HEARTS" },
  { char: "💜", name: "Hati Ungu", keywords: ["purple", "istimewa"], category: "HEARTS" },
  { char: "🖤", name: "Hati Hitam", keywords: ["black", "elegan"], category: "HEARTS" },
  { char: "🤍", name: "Hati Putih", keywords: ["white", "tulus"], category: "HEARTS" },
  { char: "💔", name: "Hati Patah", keywords: ["sedih", "batal", "break"], category: "HEARTS" },
];

const CATEGORIES = [
  { id: "ALL", label: "Semua", icon: Flame },
  { id: "POPULAR", label: "Populer", icon: Flame },
  { id: "SMILEYS", label: "Ekspresi", icon: Smile },
  { id: "HANDS", label: "Isyarat", icon: ThumbsUp },
  { id: "WORK", label: "Bisnis", icon: Briefcase },
  { id: "SYMBOLS", label: "Simbol", icon: Lightbulb },
  { id: "HEARTS", label: "Hati", icon: Heart },
];

interface WhatsAppEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

export function WhatsAppEmojiPicker({
  isOpen,
  onClose,
  onSelectEmoji,
}: WhatsAppEmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Filter Emojis
  const filteredEmojis = useMemo(() => {
    let list = EMOJI_DATABASE;
    if (activeCategory !== "ALL") {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  // Click Outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-14 left-4 z-40 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
      style={{ maxHeight: "360px" }}
    >
      {/* Search Header */}
      <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari emoji (jempol, halo, ok, api, bisnis)..."
            className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          title="Tutup Emoji"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery("");
              }}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "bg-[#00a884] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 md:grid-cols-9 gap-1.5 max-h-56">
        {filteredEmojis.length > 0 ? (
          filteredEmojis.map((e, idx) => (
            <button
              key={`${e.char}-${idx}`}
              type="button"
              onClick={() => onSelectEmoji(e.char)}
              title={`${e.name} (${e.char})`}
              className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 rounded-lg transition-transform hover:scale-125 select-none"
            >
              {e.char}
            </button>
          ))
        ) : (
          <div className="col-span-8 md:col-span-9 py-8 text-center text-xs text-slate-400">
            Emoji tidak ditemukan. Coba kata kunci lain.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span>Klik emoji untuk memasukkan ke chat</span>
        <span className="font-semibold text-slate-500">{filteredEmojis.length} emoji</span>
      </div>
    </div>
  );
}
