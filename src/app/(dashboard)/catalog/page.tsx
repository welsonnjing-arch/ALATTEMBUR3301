import { BookOpen, Layers, Check, ExternalLink, ArrowRight, FileText, Download, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface CatalogPackage {
  id: string;
  tier: string;
  name: string;
  recommended?: boolean;
  description: string;
  price: string;
  marginNote: string;
  features: string[];
  attachment: {
    status: "available" | "upcoming";
    fileName: string;
    fileUrl?: string;
    label: string;
    badgeText: string;
  };
}

const CATALOG_PACKAGES: CatalogPackage[] = [
  {
    id: "basic",
    tier: "Tier 1 — Basic",
    name: "Basic Website",
    recommended: false,
    description: "Website profil bisnis profesional 3–5 halaman untuk meningkatkan kredibilitas dan eksistensi digital instan.",
    price: "Rp 1.500.000",
    marginNote: "Estimasi modal ~Rp 400rb · Margin ~Rp 1.1jt",
    features: [
      "3–5 Halaman utama responsif mobile & desktop",
      "Gratis domain (.com / .id) & hosting 1 tahun",
      "3 Bulan garansi teknis berat & pemeliharaan",
      "Integrasi WhatsApp floating CTA",
    ],
    attachment: {
      status: "available",
      fileName: "Cover Terms & Services – Fynux Basic Website.pdf",
      fileUrl: "/Cover Terms & Services – Fynux Basic Website.pdf",
      label: "Cover Terms & Services (Basic)",
      badgeText: "PDF Tersedia",
    },
  },
  {
    id: "business",
    tier: "Tier 2 — Business",
    name: "Business Website",
    recommended: true,
    description: "Website interaktif dengan integrasi CMS kustom, galeri portofolio tender, dan form pesanan langsung.",
    price: "Rp 3.500.000+",
    marginNote: "Estimasi modal ~Rp 900rb · Margin ~Rp 2.6jt",
    features: [
      "Semua fitur paket Basic Website",
      "Admin Panel / CMS Kustom manajemen konten",
      "6 Bulan garansi pemeliharaan & monitoring",
      "Optimasi SEO on-page & kecepatan tinggi",
    ],
    attachment: {
      status: "available",
      fileName: "Cover Terms & Services – Fynux Business Website.pdf",
      fileUrl: "/Cover Terms & Services – Fynux Business Website.pdf",
      label: "Cover Terms & Services (Business)",
      badgeText: "PDF Tersedia",
    },
  },
  {
    id: "enterprise",
    tier: "Tier 3 — Custom",
    name: "Enterprise Web App",
    recommended: false,
    description: "Sistem web terdedikasi, portal presensi digital, integrasi payment gateway, dan otomasi bisnis berskala.",
    price: "Custom Quote",
    marginNote: "Berdasarkan ruang lingkup & SLA teknis",
    features: [
      "Arsitektur khusus & database PostgreSQL Supabase",
      "Integrasi API Duitku Payment Gateway & Webhook",
      "12 Bulan garansi & Service Level Agreement (SLA)",
      "Pelatihan operasional tim internal",
    ],
    attachment: {
      status: "upcoming",
      fileName: "Cover Terms & Services – Fynux Enterprise.pdf",
      fileUrl: undefined,
      label: "Cover Terms & Services (Enterprise)",
      badgeText: "Dokumen Menyusul",
    },
  },
];

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Katalog Layanan & Komponen Harga
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Paket standar Fynux Digital Solutions sebagai acuan penawaran komersial, proposal, dan dokumen kesepakatan deal
          </p>
        </div>
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          Lihat Invoice Diterbitkan <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {CATALOG_PACKAGES.map((pkg) => {
          const isBusiness = pkg.recommended;
          const isAvailable = pkg.attachment.status === "available" && !!pkg.attachment.fileUrl;

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg p-6 flex flex-col justify-between relative transition-all ${
                isBusiness
                  ? "border-2 border-slate-900 shadow-sm"
                  : "border border-slate-200/80 shadow-2xs"
              }`}
            >
              {isBusiness && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold font-mono px-3 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  Most Recommended
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md font-mono ${
                      isBusiness
                        ? "text-blue-700 bg-blue-50 border border-blue-200"
                        : pkg.id === "basic"
                        ? "text-blue-700 bg-blue-50 border border-blue-200"
                        : "text-slate-700 bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {pkg.tier}
                  </span>
                  <Layers className={`w-4 h-4 ${isBusiness ? "text-blue-600" : "text-slate-400"}`} />
                </div>

                <h2 className="text-lg font-bold text-slate-900 mt-3">{pkg.name}</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>

                <div className="mt-4 text-2xl font-black text-slate-900 font-mono">
                  {pkg.price}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{pkg.marginNote}</p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Attachment / Lampiran Dokumen Section */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Lampiran Dokumen:
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                      isAvailable
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200/80"
                        : "text-amber-700 bg-amber-50 border-amber-200/80"
                    }`}
                  >
                    {pkg.attachment.badgeText}
                  </span>
                </div>

                {isAvailable ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={pkg.attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-800 transition-colors group"
                      title={`Buka ${pkg.attachment.fileName}`}
                    >
                      <span className="truncate">{pkg.attachment.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 flex-shrink-0 ml-1.5" />
                    </a>
                    <a
                      href={pkg.attachment.fileUrl}
                      download={pkg.attachment.fileName}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 transition-colors"
                      title={`Unduh ${pkg.attachment.fileName}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50/70 border border-dashed border-slate-200 rounded-md text-xs text-slate-400 select-none">
                    <div className="flex items-center gap-2 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{pkg.attachment.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 ml-1.5">Menyusul</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
