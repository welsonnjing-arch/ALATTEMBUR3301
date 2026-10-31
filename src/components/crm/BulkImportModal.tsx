"use client";

import { useState, useRef, useEffect } from "react";
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
  Users,
  Shuffle,
  UserCheck,
} from "lucide-react";
import {
  CreateProspectInput,
  normalizeWhatsAppNumber,
  SalesUserOption,
  LeadDistributionMode,
  BulkDistributionConfig,
} from "@/modules/crm/types";
import {
  bulkCreateProspectsAction,
  fetchAvailableSalesAction,
} from "@/modules/crm/crm.actions";
import { readSheet } from "read-excel-file/universal";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useToast } from "@/components/common/Toast";

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
  const { toast } = useToast();
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

  // Pengaturan Distribusi Tim Sales
  const [salesUsers, setSalesUsers] = useState<SalesUserOption[]>([]);
  const [distributionMode, setDistributionMode] = useState<LeadDistributionMode>("ROUND_ROBIN");
  const [selectedSalesIds, setSelectedSalesIds] = useState<string[]>([]);
  const [singleSalesId, setSingleSalesId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSalesAction().then((users) => {
        setSalesUsers(users);
        if (users.length > 0) {
          setSelectedSalesIds(users.map((u) => u.id));
          setSingleSalesId(users[0].id);
        }
      });
    }
  }, [isOpen]);

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

    if (distributionMode === "ROUND_ROBIN" && selectedSalesIds.length === 0) {
      setSubmitError("Pilih minimal 1 akun sales untuk pembagian rata (Round-Robin).");
      setIsSubmitting(false);
      return;
    }

    const distributionConfig: BulkDistributionConfig = {
      mode: distributionMode,
      targetSalesIds: distributionMode === "ROUND_ROBIN" ? selectedSalesIds : undefined,
      singleSalesId: distributionMode === "SINGLE_SALES" ? singleSalesId : undefined,
    };

    try {
      const res = await bulkCreateProspectsAction(inputs, distributionConfig);
      if (res.success) {
        setImportSummary({
          imported: res.importedCount,
          skipped: res.skippedCount,
        });
        toast.success(
          `${res.importedCount} prospek berhasil diimpor${
            res.skippedCount > 0 ? ` (${res.skippedCount} duplikat dilewati)` : ""
          }`
        );
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
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
        <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-ios-scale relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Bulk Import Prospek CRM</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-mono">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    Belum punya format tabel yang sesuai?
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unduh template CSV yang sudah kami siapkan dengan format 8 kolom dan contoh data yang benar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-sm transition-colors shrink-0"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50/80 transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-200 text-slate-700 flex items-center justify-center mb-3 transition-colors">
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
                  <strong>1. Nama Bisnis</strong> (Wajib) /{" "}
                  <strong>2. Nama Kontak</strong> (Opsional) /{" "}
                  <strong>3. Nomor WA</strong> (Wajib, diawali 08/628) /{" "}
                  <strong>4. Website</strong> (Opsional) /{" "}
                  <strong>5. Niche/Industri</strong> (Opsional) /{" "}
                  <strong>6. Layanan Potensi</strong> (Opsional) /{" "}
                  <strong>7. Catatan Riset</strong> (Opsional) /{" "}
                  <strong>8. Peluang Spesifik</strong> (Opsional)
                </p>
              </div>
            </div>
          )}

          {/* Parsing State */}
          {isParsing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-slate-700 animate-spin" />
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
                  <FileSpreadsheet className="w-4 h-4 text-slate-700" />
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
              <div className="table-container-clean w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs max-h-80 overflow-y-auto text-xs">
                <table className="w-full text-left min-w-[760px]">
                  <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-semibold text-[10px] uppercase sticky top-0 z-10 backdrop-blur-xs">
                    <tr>
                      <th className="py-3 px-3.5 min-w-[100px]">Status</th>
                      <th className="py-3 px-3.5 min-w-[190px]">Nama Bisnis & Kontak</th>
                      <th className="py-3 px-3.5 min-w-[130px]">WhatsApp</th>
                      <th className="py-3 px-3.5 min-w-[130px]">Niche / Layanan</th>
                      <th className="py-3 px-3.5 min-w-[210px] pr-6">Catatan / Peluang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`table-row-hover hover:bg-slate-50/80 transition-colors ${
                          r.status === "INVALID"
                            ? "bg-rose-50/40"
                            : r.status === "DUPLICATE"
                            ? "bg-amber-50/40"
                            : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 align-top whitespace-nowrap">
                          {r.status === "VALID" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle className="w-3 h-3" /> Siap
                            </span>
                          )}
                          {r.status === "DUPLICATE" && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertTriangle className="w-3 h-3" /> Duplikat
                              </span>
                              <p className="text-[10px] text-amber-700 max-w-[140px] leading-tight">
                                {r.errorMessage}
                              </p>
                            </div>
                          )}
                          {r.status === "INVALID" && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
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
                            <p className="text-slate-600 text-[10px] italic mt-0.5 line-clamp-1">
                              Peluang: {r.painPoints}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pengaturan Pembagian Prospek ke Tim Sales */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold">
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Metode Distribusi Prospek ke Tim Sales
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Tentukan bagaimana {validCount} prospek valid akan dibagikan ke akun sales
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDistributionMode("ROUND_ROBIN")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      distributionMode === "ROUND_ROBIN"
                        ? "bg-white border-blue-500 ring-2 ring-blue-500/15 shadow-2xs"
                        : "bg-white/70 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Bagi Rata (Round-Robin)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Membagi sama rata ke akun-akun sales yang dipilih
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistributionMode("SINGLE_SALES")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      distributionMode === "SINGLE_SALES"
                        ? "bg-white border-blue-500 ring-2 ring-blue-500/15 shadow-2xs"
                        : "bg-white/70 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tugaskan ke 1 Sales</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Seluruh prospek diserahkan ke satu sales spesifik
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistributionMode("OWNER")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      distributionMode === "OWNER"
                        ? "bg-white border-blue-500 ring-2 ring-blue-500/15 shadow-2xs"
                        : "bg-white/70 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                        O
                      </span>
                      <span>Tugaskan ke Saya (Owner)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Masuk ke antrean akun Owner tanpa dibagi
                    </p>
                  </button>
                </div>

                {/* Detail Kontrol untuk ROUND_ROBIN */}
                {distributionMode === "ROUND_ROBIN" && (
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        Pilih Akun Sales Penerima:
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedSalesIds(salesUsers.map((u) => u.id))}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSalesIds([])}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          Batal Semua
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {salesUsers.map((sales) => {
                        const isChecked = selectedSalesIds.includes(sales.id);
                        return (
                          <label
                            key={sales.id}
                            className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-blue-50/50 border-blue-200 text-slate-900 font-medium"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSalesIds([...selectedSalesIds, sales.id]);
                                } else {
                                  setSelectedSalesIds(
                                    selectedSalesIds.filter((id) => id !== sales.id)
                                  );
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500/20"
                            />
                            <div className="truncate">
                              <div className="truncate text-xs">{sales.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {sales.email}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {selectedSalesIds.length > 0 ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200/70 rounded-md text-[11px] text-emerald-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <strong>Estimasi Pembagian:</strong> {validCount} prospek dibagi ke{" "}
                          {selectedSalesIds.length} sales
                        </span>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-emerald-700 border border-emerald-200">
                          ~{Math.ceil(validCount / selectedSalesIds.length)} prospek / sales
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Silakan centang minimal 1 akun sales untuk pembagian rata.
                      </div>
                    )}
                  </div>
                )}

                {/* Detail Kontrol untuk SINGLE_SALES */}
                {distributionMode === "SINGLE_SALES" && (
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-700">Pilih Sales Penerima:</span>
                    <select
                      value={singleSalesId}
                      onChange={(e) => setSingleSalesId(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {salesUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-between bg-slate-50/90 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-lg transition-colors"
          >
            Tutup
          </button>

          {file && !isParsing && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isSubmitting || validCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Mengimpor Data...</span>
                </>
              ) : (
                <>
                  <span>
                    {distributionMode === "ROUND_ROBIN" && selectedSalesIds.length > 0
                      ? `Import & Bagi Rata ${validCount} Prospek (${selectedSalesIds.length} Sales)`
                      : `Import ${validCount} Prospek Valid Sekarang`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
