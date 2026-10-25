import { BookOpen, Layers, Check } from "lucide-react";

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Katalog Layanan & Komponen Harga
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Paket standar Fynux Digital Solutions sebagai acuan penawaran dan kesepakatan deal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Plan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Tier 1
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-3">Basic Website</h2>
            <p className="text-xs text-slate-500 mt-1">
              Website profil bisnis elegan untuk meningkatkan kredibilitas & eksistensi digital.
            </p>
            <div className="mt-4 text-2xl font-extrabold text-slate-900">
              Rp 1.500.000
            </div>
            <p className="text-[10px] text-slate-400">Harga acuan penawaran standar</p>

            <ul className="mt-6 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Desain responsif mobile & desktop
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Domain & hosting 1 tahun
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Garansi perbaikan bug standar
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Terms: DATA INTI/Cover Terms & Services – Fynux Basic Website.pdf
          </div>
        </div>

        {/* Business Plan */}
        <div className="bg-white rounded-xl border-2 border-indigo-500 shadow-md p-6 flex flex-col justify-between relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Most Popular
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Tier 2
              </span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-3">Business Website</h2>
            <p className="text-xs text-slate-500 mt-1">
              Website interaktif dengan CMS kustom untuk pengelolaan konten bisnis mandiri.
            </p>
            <div className="mt-4 text-2xl font-extrabold text-slate-900">
              Rp 3.500.000+
            </div>
            <p className="text-[10px] text-slate-400">Harga acuan penawaran standar</p>

            <ul className="mt-6 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Semua fitur Basic Website
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Integrasi Admin Panel / CMS
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                SEO On-Page & WhatsApp floating CTA
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Terms: Dokumen T&C menyusul
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Tier 3
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-3">Enterprise Custom</h2>
            <p className="text-xs text-slate-500 mt-1">
              Aplikasi web kompleks, integrasi API, sistem internal, atau e-commerce kustom.
            </p>
            <div className="mt-4 text-2xl font-extrabold text-slate-900">
              Custom Quote
            </div>
            <p className="text-[10px] text-slate-400">Berdasarkan ruang lingkup & durasi</p>

            <ul className="mt-6 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Arsitektur khusus & database terdedikasi
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                Integrasi payment gateway & API pihak ketiga
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                SLA pengerjaan & maintenance khusus
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Terms: Custom proposal & contract
          </div>
        </div>
      </div>
    </div>
  );
}
