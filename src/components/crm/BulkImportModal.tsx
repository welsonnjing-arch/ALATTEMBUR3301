"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Info,
  RefreshCw,
} from "lucide-react";
import { CreateProspectInput, normalizeWhatsAppNumber } from "@/modules/crm/types";
import { bulkCreateProspectsAction } from "@/modules/crm/crm.actions";
import { readSheet } from "read-excel-file/universal";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingPhones?: string[];
}

interface ParsedRow {
  rowNumber: number;
  companyName: string;
  contactName: string;
  rawPhone: string;
  normalizedPhone: string;
  website: string;
  industry: string;
  potentialServices: string;
  researchNotes: string;
  painPoints: string;
  status: "VALID" | "DUPLICATE" | "INVALID";
  errorMessage?: string;
}

// Helper parsing CSV robustly handling commas, semicolons, quotes, and newlines
function parseCsvContent(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  // Detect delimiter: count commas vs semicolons in first line
  const firstLine = text.split("\n")[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\r") {
        // ignore CR
      } else if (char === "\n") {
        row.push(cell.trim());
        if (row.some((c) => c !== "")) {
          lines.push(row);
        }
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== "")) {
      lines.push(row);
    }
  }

  return lines;
}

export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
  existingPhones = [],
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [filterView, setFilterView] = useState<"ALL" | "VALID" | "ISSUES">("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download template CSV function
  const handleDownloadTemplate = () => {
    const headers = [
      "Nama Bisnis",
      "Nama Kontak",
      "Nomor WA",
      "Website",
      "Niche",
      "Layanan Potensi",
      "Catatan Riset",
      "Peluang Spesifik",
    ];

    const sampleRow1 = [
      "PT Padma Widya Konstruksi",
      "Ibu Rina",
      "081298765432",
      "padmakonstruksi.com",
      "Konstruksi",
      "Basic Website",
      "Perusahaan rekanan butuh company profile kredibel untuk tender",
      "Tender proyek mensyaratkan website resmi",
    ];

    const sampleRow2 = [
      "Klinik Sehat Mandiri",
      "dr. Hendra",
      "6285712345678",
      "sehatmandiri.id",
      "Kesehatan",
      "Web App Development",
      "Antrean pasien manual dan rekap rekam medis kertas",
      "Butuh sistem reservasi dan presensi digital",
    ];

    const csvContent =
      "\uFEFF" + // UTF-8 BOM for Excel
      [headers, sampleRow1, sampleRow2]
        .map((row) =>
          row
            .map((field) => {
              const str = String(field).replace(/"/g, '""');
              return str.includes(",") || str.includes(";") || str.includes("\n") || str.includes('"')
                ? `"${str}"`
                : str;
            })
            .join(",")
        )
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_import_prospek_fynux.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Match column header to field
  const matchColumnIndex = (headers: string[]) => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    const getIdx = (candidates: string[]) =>
      headers.findIndex((h) => {
        const nh = normalize(h);
        return candidates.some((cand) => nh.includes(cand));
      });

    return {
      companyNameIdx: getIdx(["bisnis", "perusahaan", "company", "nama"]),
      contactNameIdx: getIdx(["kontak", "pic", "contact", "namaorang"]),
      phoneIdx: getIdx(["wa", "whatsapp", "telepon", "phone", "hp", "nohp"]),
      websiteIdx: getIdx(["website", "domain", "url", "web"]),
      industryIdx: getIdx(["niche", "industri", "industry", "kategori"]),
      servicesIdx: getIdx(["layanan", "services", "potensi", "service"]),
      notesIdx: getIdx(["catatan", "riset", "notes", "analisis"]),
      painPointsIdx: getIdx(["peluang", "masalah", "painpoints", "pain", "kendala"]),
    };
  };

  // Process rows matrix into structured ParsedRow
  const processMatrix = (matrix: string[][]) => {
    if (matrix.length < 2) {
      setSubmitError("File tidak memiliki baris data (hanya header atau kosong).");
      setIsParsing(false);
      return;
    }

    const headers = matrix[0].map((h) => String(h || "").trim());
    const mapping = matchColumnIndex(headers);

    const rows: ParsedRow[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (let i = 1; i < matrix.length; i++) {
      const rawRow = matrix[i];
      if (!rawRow || rawRow.every((c) => !c || String(c).trim() === "")) continue;

      const getVal = (idx: number) => (idx !== -1 && rawRow[idx] ? String(rawRow[idx]).trim() : "");

      const companyName = getVal(mapping.companyNameIdx);
      const contactName = getVal(mapping.contactNameIdx) || companyName;
      const rawPhone = getVal(mapping.phoneIdx);
      const website = getVal(mapping.websiteIdx);
      const industry = getVal(mapping.industryIdx);
      const potentialServices = getVal(mapping.servicesIdx) || "Basic Website Development";
      const researchNotes = getVal(mapping.notesIdx);
      const painPoints = getVal(mapping.painPointsIdx);

      const { formatted: normalizedPhone, isValid } = normalizeWhatsAppNumber(rawPhone);

      let status: ParsedRow["status"] = "VALID";
      let errorMessage: string | undefined;

      if (!companyName) {
        status = "INVALID";
        errorMessage = "Nama bisnis kosong";
      } else if (!isValid) {
        status = "INVALID";
        errorMessage = `Nomor WA "${rawPhone}" tidak valid (harus 10-15 digit diawali 08 atau 628)`;
      } else if (existingPhones.includes(normalizedPhone)) {
        status = "DUPLICATE";
        errorMessage = "Nomor WA sudah terdaftar di database CRM";
      } else if (seenPhonesInBatch.has(normalizedPhone)) {
        status = "DUPLICATE";
        errorMessage = "Nomor WA duplikat di file yang sama";
      } else {
        seenPhonesInBatch.add(normalizedPhone);
      }

      rows.push({
        rowNumber: i + 1,
        companyName,
        contactName,
        rawPhone,
        normalizedPhone,
        website,
        industry,
        potentialServices,
        researchNotes,
        painPoints,
        status,
        errorMessage,
      });
    }

    setParsedRows(rows);
    setIsParsing(false);
  };

  // Handle file select & parse
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsParsing(true);
    setSubmitError(null);
    setImportSummary(null);

    const ext = selected.name.split(".").pop()?.toLowerCase();

    try {
      if (ext === "xlsx" || ext === "xls") {
        const rows = await readSheet(selected);
        const matrix = rows.map((r) =>
          r.map((c) => (c === null || c === undefined ? "" : String(c)))
        );
        processMatrix(matrix);
      } else {
        const text = await selected.text();
        const matrix = parseCsvContent(text);
        processMatrix(matrix);
      }
    } catch (err: unknown) {
      console.error("Gagal membaca file spreadsheet:", err);
      const msg = err instanceof Error ? err.message : "Format file tidak valid atau rusak.";
      setSubmitError(`Gagal membaca file: ${msg}`);
      setIsParsing(false);
    }
  };

  // Submit valid rows
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.status === "VALID");
    if (validRows.length === 0) {
      setSubmitError("Tidak ada data valid yang dapat di-import.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const inputs: CreateProspectInput[] = validRows.map((r) => ({
      companyName: r.companyName,
      contactName: r.contactName,
      whatsappNumber: r.normalizedPhone,
      website: r.website || undefined,
      industry: r.industry || undefined,
      potentialServices: r.potentialServices || "Basic Website Development",
      researchNotes: r.researchNotes || "Di-import dari Excel/CSV",
      painPoints: r.painPoints || undefined,
    }));

    try {
      const res = await bulkCreateProspectsAction(inputs);
      if (res.success) {
        setImportSummary({
          imported: res.importedCount,
          skipped: res.skippedCount,
        });
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSubmitError("Gagal mengimpor data ke CRM.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === "VALID").length;
  const duplicateCount = parsedRows.filter((r) => r.status === "DUPLICATE").length;
  const invalidCount = parsedRows.filter((r) => r.status === "INVALID").length;

  const displayedRows = parsedRows.filter((r) => {
    if (filterView === "VALID") return r.status === "VALID";
    if (filterView === "ISSUES") return r.status === "DUPLICATE" || r.status === "INVALID";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Bulk Import Prospek CRM</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload data prospek sekaligus untuk mempercepat pipeline sales outreach.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {importSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>
                  Berhasil mengimpor {importSummary.imported} prospek baru ke dalam CRM!
                </span>
              </div>
              <span className="text-emerald-700 text-[11px]">Menutup modal...</span>
            </div>
          )}

          {/* Action Row: Download Template & Upload Area */}
          {!file && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600" />
                    Belum punya format tabel yang sesuai?
                  </h4>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    Unduh template CSV yang sudah kami siapkan dengan format 8 kolom dan contoh data yang benar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-sm transition-all hover:scale-105 shrink-0"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50/80 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Pilih atau seret berkas spreadsheet Anda ke sini
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Mendukung format berkas <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm">
                  Pilih File dari Komputer
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Column Mapping Guide */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">
                  Variabel Kolom yang Dikenali Otomatis:
                </span>
                <p>
                  <strong>1. Nama Bisnis</strong> (Wajib) &bull;{" "}
                  <strong>2. Nama Kontak</strong> (Opsional) &bull;{" "}
                  <strong>3. Nomor WA</strong> (Wajib, diawali 08/628) &bull;{" "}
                  <strong>4. Website</strong> (Opsional) &bull;{" "}
                  <strong>5. Niche/Industri</strong> (Opsional) &bull;{" "}
                  <strong>6. Layanan Potensi</strong> (Opsional) &bull;{" "}
                  <strong>7. Catatan Riset</strong> (Opsional) &bull;{" "}
                  <strong>8. Peluang Spesifik</strong> (Opsional)
                </p>
              </div>
            </div>
          )}

          {/* Parsing State */}
          {isParsing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-800">
                Memproses dan memvalidasi data spreadsheet...
              </p>
              <p className="text-xs text-slate-500">
                Menormalisasi nomor WhatsApp dan memeriksa duplikasi kontak CRM.
              </p>
            </div>
          )}

          {/* Preview & Validation Results Table */}
          {file && !isParsing && parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Summary Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                    {file.name}
                  </span>
                  <span className="text-slate-400">({parsedRows.length} baris terbaca)</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {validCount} Siap Import
                  </span>
                  {duplicateCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {duplicateCount} Duplikat
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-[11px]">
                      <XCircle className="w-3.5 h-3.5" />
                      {invalidCount} Tidak Valid
                    </span>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterView("ALL")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      filterView === "ALL"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView("VALID")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      filterView === "VALID"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    Hanya Valid ({validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterView("ISSUES")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      filterView === "ISSUES"
                        ? "bg-white text-rose-700 shadow-sm"
                        : "text-slate-600 hover:text-rose-700"
                    }`}
                  >
                    Bermasalah ({duplicateCount + invalidCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                >
                  Ganti File Spreadsheet
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-72 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Nama Bisnis & Kontak</th>
                      <th className="py-2.5 px-3">WhatsApp</th>
                      <th className="py-2.5 px-3">Niche / Layanan</th>
                      <th className="py-2.5 px-3">Catatan / Peluang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          r.status === "INVALID"
                            ? "bg-rose-50/40"
                            : r.status === "DUPLICATE"
                            ? "bg-amber-50/40"
                            : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 align-top whitespace-nowrap">
                          {r.status === "VALID" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle className="w-3 h-3" /> Siap
                            </span>
                          )}
                          {r.status === "DUPLICATE" && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3" /> Duplikat
                              </span>
                              <p className="text-[10px] text-amber-700 max-w-[140px] leading-tight">
                                {r.errorMessage}
                              </p>
                            </div>
                          )}
                          {r.status === "INVALID" && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <XCircle className="w-3 h-3" /> Gagal
                              </span>
                              <p className="text-[10px] text-rose-700 max-w-[140px] leading-tight">
                                {r.errorMessage}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-slate-900">{r.companyName || "—"}</div>
                          <div className="text-[11px] text-slate-500">{r.contactName || "—"}</div>
                          {r.website && (
                            <div className="text-[10px] text-indigo-600 font-mono truncate max-w-[160px]">
                              {r.website}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 align-top font-mono whitespace-nowrap">
                          <div className="text-slate-900 font-semibold">{r.normalizedPhone || r.rawPhone || "—"}</div>
                          {r.normalizedPhone !== r.rawPhone && (
                            <div className="text-[10px] text-slate-400">Asal: {r.rawPhone}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 align-top">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium mb-1">
                            {r.industry || "Umum"}
                          </span>
                          <div className="text-[11px] text-slate-600 truncate max-w-[160px]">
                            {r.potentialServices}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 align-top max-w-xs">
                          <p className="text-slate-700 line-clamp-2 text-[11px]">
                            {r.researchNotes || "—"}
                          </p>
                          {r.painPoints && (
                            <p className="text-brand-orange text-[10px] italic mt-0.5 line-clamp-1">
                              Peluang: {r.painPoints}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>

          {file && !isParsing && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isSubmitting || validCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Mengimpor Data...</span>
                </>
              ) : (
                <>
                  <span>Import {validCount} Prospek Valid Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
