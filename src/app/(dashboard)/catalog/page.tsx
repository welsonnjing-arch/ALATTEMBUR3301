import { BookOpen, Layers, Check, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Katalog Layanan & Komponen Harga
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Paket standar Fynux Digital Solutions sebagai acuan penawaran komersial dan kesepakatan deal
          </p>
        </div>
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          Lihat Invoice Diterbitkan <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Tier 1 — Basic
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-3">
              Basic Website
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Website profil bisnis profesional 3–5 halaman untuk meningkatkan kredibilitas dan eksistensi digital instan.
            </p>
            <div className="mt-4 text-2xl font-black text-slate-900 font-mono">
              Rp 1.500.000
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Estimasi modal ~Rp 400rb · Margin ~Rp 1.1jt</p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                3–5 Halaman utama responsif mobile & desktop
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Gratis domain (.com / .id) & hosting 1 tahun
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                3 Bulan garansi teknis berat & pemeliharaan
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Integrasi WhatsApp floating CTA
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Terms of Service:</span>
            <span className="font-semibold text-indigo-600 flex items-center gap-1">
              Doc Attached <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Business Plan */}
        <div className="bg-white rounded-2xl border-2 border-indigo-600 shadow-lg p-6 flex flex-col justify-between relative hover:shadow-xl transition-shadow">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            Most Recommended
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Tier 2 — Business
              </span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-3">
              Business Website
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Website interaktif dengan integrasi CMS kustom, galeri portofolio tender, dan form pesanan langsung.
            </p>
            <div className="mt-4 text-2xl font-black text-slate-900 font-mono">
              Rp 3.500.000+
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Estimasi modal ~Rp 900rb · Margin ~Rp 2.6jt</p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Semua fitur paket Basic Website
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Admin Panel / CMS Kustom manajemen konten
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                6 Bulan garansi pemeliharaan & monitoring
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Optimasi SEO on-page & kecepatan tinggi
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Terms of Service:</span>
            <span className="font-semibold text-slate-700">T&C Standar B2B</span>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Tier 3 — Custom
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-3">
              Enterprise Web App
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sistem web terdedikasi, portal presensi digital, integrasi payment gateway, dan otomasi bisnis berskala.
            </p>
            <div className="mt-4 text-2xl font-black text-slate-900 font-mono">
              Custom Quote
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Berdasarkan ruang lingkup & SLA teknis</p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Arsitektur khusus & database PostgreSQL Supabase
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Integrasi API Duitku Payment Gateway & Webhook
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                12 Bulan garansi & Service Level Agreement (SLA)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Pelatihan operasional tim internal
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Kontrak Kerja Sama:</span>
            <span className="font-semibold text-slate-700">Custom Agreement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
