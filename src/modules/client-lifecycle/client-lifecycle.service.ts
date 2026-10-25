import {
  ClaimStatus,
  Client,
  CreateClientInput,
  CreateMaintenanceContractInput,
  CreateWarrantyClaimInput,
  CreateWarrantyInput,
  MaintenanceContract,
  Warranty,
  WarrantyClaim,
} from "./types";
import { MaintenanceBillingType, MaintenanceContractStatus, ServiceTier } from "@/types/enums";
import { logActivity } from "@/lib/logger";

function calculateDaysRemaining(endDateStr: string): number {
  const end = new Date(endDateStr);
  const now = new Date();
  // Clear times for exact day difference
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function determineWarrantyStatus(daysRemaining: number): "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" {
  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
}

function determineMaintenanceStatus(
  daysRemaining: number,
  currentStatus: MaintenanceContractStatus
): MaintenanceContractStatus {
  if (currentStatus === "RENEWED" || currentStatus === "TERMINATED") {
    return currentStatus;
  }
  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
}

// In-memory data store with realistic initial data
let clientsData: Client[] = [
  {
    id: "p-001",
    name: "SMAN 2 NGAGLIK",
    industry: "Pendidikan & Sekolah",
    website: "https://sman2ngaglik.sch.id",
    address: "Jl. Sukoharjo, Ngaglik, Sleman, D.I. Yogyakarta",
    picName: "Drs. Budi Santoso, M.Pd",
    picPhone: "62895324069850",
    email: "info@sman2ngaglik.sch.id",
    position: "Kepala Sekolah & Penanggung Jawab IT",
    status: "ACTIVE",
    totalLtv: 950000,
    projectCount: 1,
    onboardingDate: "2026-02-12",
    notes: "Pengembangan sistem presensi digital dan landing page sekolah dengan dukungan multi-kiosk.",
    createdAt: "2026-02-12T00:00:00Z",
    updatedAt: "2026-10-25T00:00:00Z",
  },
  {
    id: "p-002",
    name: "PT Padma Widya Setiajaya",
    industry: "Konstruksi & Pengadaan LPSE",
    website: "https://padmawidyasetiajaya.com",
    address: "Jl. Pemuda No. 88, Semarang, Jawa Tengah",
    picName: "Bambang Widjanarko, S.T.",
    picPhone: "6281234567890",
    email: "direksi@padmawidyasetiajaya.com",
    position: "Direktur Utama",
    status: "ACTIVE",
    totalLtv: 4500000,
    projectCount: 1,
    onboardingDate: "2026-10-25",
    notes: "Klien korporat B2B. Membutuhkan portofolio tender resmi dan garansi uptime tinggi.",
    createdAt: "2026-10-25T00:00:00Z",
    updatedAt: "2026-10-25T00:00:00Z",
  },
  {
    id: "p-003",
    name: "Klinik Pratama Sehat Mandiri",
    industry: "Pelayanan Kesehatan",
    website: "https://sehatmandiriklinik.co.id",
    address: "Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta",
    picName: "dr. Hendra Kurniawan",
    picPhone: "6287890123456",
    email: "admin@sehatmandiriklinik.co.id",
    position: "Pemilik & Dokter Penanggung Jawab",
    status: "ACTIVE",
    totalLtv: 2500000,
    projectCount: 1,
    onboardingDate: "2026-08-10",
    notes: "Website profil klinik dengan modul jadwal praktek dokter terintegrasi WhatsApp pendaftaran.",
    createdAt: "2026-08-10T00:00:00Z",
    updatedAt: "2026-10-25T00:00:00Z",
  },
];

let warrantiesData: Warranty[] = [
  {
    id: "warr-001",
    clientId: "p-001",
    clientName: "SMAN 2 NGAGLIK",
    projectId: "proj-001",
    projectName: "Web App SIM-Presensi Siswa & Guru v1.0",
    tier: "BASIC",
    durationMonths: 3,
    startDate: "2026-02-12",
    endDate: "2026-05-12",
    status: "EXPIRED",
    daysRemaining: calculateDaysRemaining("2026-05-12"),
    scopeOfSupport:
      "Garansi teknis perbaikan bug script, perlindungan error fatal database, dan bantuan 1x revisi minor sistem.",
    claims: [
      {
        id: "claim-001",
        warrantyId: "warr-001",
        issueTitle: "Perbaikan format ekspor Excel rekap absensi harian",
        issueDescription:
          "Kolom tanggal pada lembar kerja kedua bergeser satu sel saat diekspor oleh operator TU.",
        reportedDate: "2026-03-05",
        status: "RESOLVED",
        reportedBy: "Operator TU SMAN 2 Ngaglik",
        resolutionNotes: "Patch v1.0.2 diterapkan dan formula cell disinkronkan kembali. Telah divalidasi normal.",
        resolvedAt: "2026-03-06T14:30:00Z",
      },
    ],
    createdAt: "2026-02-12T00:00:00Z",
  },
  {
    id: "warr-002",
    clientId: "p-002",
    clientName: "PT Padma Widya Setiajaya",
    projectId: "proj-002",
    projectName: "Business Website & Company Profile PT Padma Widya Setiajaya",
    tier: "BUSINESS",
    durationMonths: 6,
    startDate: "2026-10-25",
    endDate: "2027-04-25",
    status: "ACTIVE",
    daysRemaining: calculateDaysRemaining("2027-04-25"),
    scopeOfSupport:
      "Garansi teknis 6 bulan mencakup perbaikan bug CMS, monitoring stabilitas server NVMe, instalasi SSL berkala, dan penyesuaian konten minor 3x.",
    claims: [],
    createdAt: "2026-10-25T00:00:00Z",
  },
  {
    id: "warr-003",
    clientId: "p-003",
    clientName: "Klinik Pratama Sehat Mandiri",
    projectId: "proj-003",
    projectName: "Website Profil & Jadwal Dokter Klinik Pratama",
    tier: "BASIC",
    durationMonths: 3,
    startDate: "2026-08-10",
    endDate: "2026-11-10",
    status: "EXPIRING_SOON",
    daysRemaining: calculateDaysRemaining("2026-11-10"),
    scopeOfSupport:
      "Garansi teknis bug responsivitas layout mobile dan perlindungan keamanan formulir janji temu WhatsApp.",
    claims: [
      {
        id: "claim-002",
        warrantyId: "warr-003",
        issueTitle: "Tombol WhatsApp dokter jaga tidak merespons pada iOS Safari",
        issueDescription:
          "Saat diklik di browser Safari iPhone, tautan wa.me tidak memicu aplikasi WhatsApp secara langsung.",
        reportedDate: "2026-09-15",
        status: "RESOLVED",
        reportedBy: "Admin Klinik Sehat Mandiri",
        resolutionNotes: "Deep-link wa.me diperbarui dengan fallback universal link standar.",
        resolvedAt: "2026-09-15T16:00:00Z",
      },
    ],
    createdAt: "2026-08-10T00:00:00Z",
  },
];

let maintenanceContractsData: MaintenanceContract[] = [
  {
    id: "mnc-001",
    contractNumber: "MNC-202606-0001",
    clientId: "p-001",
    clientName: "SMAN 2 NGAGLIK",
    projectId: "proj-001",
    projectName: "Web App SIM-Presensi Siswa & Guru v1.0",
    billingType: "MONTHLY",
    price: 98000,
    startDate: "2026-06-01",
    endDate: "2026-11-30",
    daysRemaining: calculateDaysRemaining("2026-11-30"),
    status: "ACTIVE",
    terms:
      "Perawatan rutin bulanan pasca garansi: backup mingguan database presensi, monitoring SSL, dan asistensi teknis darurat via WhatsApp.",
    scopeItems: [
      "Backup mingguan database PostgreSQL",
      "Pembaruan berkala patch keamanan dependencies",
      "Monitoring uptime server dan sertifikat SSL",
      "Bantuan teknis minor 1x per bulan",
    ],
    renewalReminderDate: "2026-11-15",
    renewalAlertSent: false,
    createdAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "mnc-002",
    contractNumber: "MNC-202610-0002",
    clientId: "p-003",
    clientName: "Klinik Pratama Sehat Mandiri",
    projectId: "proj-003",
    projectName: "Website Profil & Jadwal Dokter Klinik Pratama",
    billingType: "ANNUAL",
    price: 1100000,
    startDate: "2026-11-11",
    endDate: "2027-11-10",
    daysRemaining: calculateDaysRemaining("2027-11-10"),
    status: "ACTIVE",
    terms:
      "Paket kontrak maintenance tahunan: garansi perbaikan bug berkelanjutan, update konten jadwal praktek dokter berkala, dan renewal hosting NVMe tahun ke-2.",
    scopeItems: [
      "Perpanjangan hosting NVMe 1 tahun",
      "Pembaruan jadwal dokter hingga 4x per kuartal",
      "Penyimpanan berkala backup cloud",
      "Prioritas penanganan bug teknis",
    ],
    renewalReminderDate: "2027-10-10",
    renewalAlertSent: false,
    createdAt: "2026-10-25T00:00:00Z",
  },
];

// Service Methods
export async function getAllClients(): Promise<Client[]> {
  return [...clientsData];
}

export async function getClientById(id: string): Promise<Client | null> {
  const c = clientsData.find((item) => item.id === id);
  return c ? { ...c } : null;
}

export async function createClient(
  input: CreateClientInput,
  actorUserId: string
): Promise<{ success: boolean; client?: Client; error?: string }> {
  if (!input.name.trim() || !input.picName.trim() || !input.picPhone.trim()) {
    return { success: false, error: "Nama instansi, nama PIC, dan nomor WhatsApp wajib diisi." };
  }

  // Normalize phone 628xxx
  let cleanPhone = input.picPhone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith("62")) {
    cleanPhone = "62" + cleanPhone;
  }

  const newClient: Client = {
    id: `client-${Date.now()}`,
    name: input.name.trim(),
    industry: input.industry?.trim(),
    website: input.website?.trim(),
    address: input.address?.trim(),
    picName: input.picName.trim(),
    picPhone: cleanPhone,
    email: input.email?.trim(),
    position: input.position?.trim(),
    status: "ACTIVE",
    totalLtv: 0,
    projectCount: 0,
    onboardingDate: new Date().toISOString().split("T")[0],
    notes: input.notes?.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clientsData.unshift(newClient);

  logActivity({
    category: "CRM",
    action: "CLIENT_CREATED",
    actorId: actorUserId,
    targetId: newClient.id,
    targetType: "CLIENT",
    metadata: { name: newClient.name, pic: newClient.picName, phone: newClient.picPhone },
  });

  return { success: true, client: newClient };
}

export async function getAllWarranties(): Promise<Warranty[]> {
  // Re-calculate daysRemaining & status dynamically
  return warrantiesData.map((w) => {
    const daysRemaining = calculateDaysRemaining(w.endDate);
    const status = determineWarrantyStatus(daysRemaining);
    return {
      ...w,
      daysRemaining,
      status,
    };
  });
}

export async function getWarrantyById(id: string): Promise<Warranty | null> {
  const w = warrantiesData.find((item) => item.id === id);
  if (!w) return null;
  const daysRemaining = calculateDaysRemaining(w.endDate);
  const status = determineWarrantyStatus(daysRemaining);
  return { ...w, daysRemaining, status };
}

export async function createWarranty(
  input: CreateWarrantyInput,
  actorUserId: string
): Promise<{ success: boolean; warranty?: Warranty; error?: string }> {
  const client = clientsData.find((c) => c.id === input.clientId);
  if (!client) {
    return { success: false, error: "Klien tidak valid." };
  }

  // Duration in months based on tier if not provided
  let duration = input.durationMonths;
  if (!duration) {
    if (input.tier === "BASIC") duration = 3;
    else if (input.tier === "BUSINESS") duration = 6;
    else if (input.tier === "ENTERPRISE") duration = 12;
    else duration = 3;
  }

  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + duration);
  const endDateStr = end.toISOString().split("T")[0];

  const daysRemaining = calculateDaysRemaining(endDateStr);
  const status = determineWarrantyStatus(daysRemaining);

  const newWarranty: Warranty = {
    id: `warr-${Date.now()}`,
    clientId: input.clientId,
    clientName: client.name,
    projectId: input.projectId,
    projectName: "Proyek Terkait Klien",
    tier: input.tier,
    durationMonths: duration,
    startDate: input.startDate,
    endDate: endDateStr,
    status,
    daysRemaining,
    scopeOfSupport:
      input.scopeOfSupport ||
      `Garansi teknis perbaikan bug dan stabilitas sistem selama ${duration} bulan.`,
    claims: [],
    createdAt: new Date().toISOString(),
  };

  warrantiesData.unshift(newWarranty);

  logActivity({
    category: "PROJECT",
    action: "WARRANTY_CREATED",
    actorId: actorUserId,
    targetId: newWarranty.id,
    targetType: "WARRANTY",
    metadata: { client: client.name, tier: input.tier, duration },
  });

  return { success: true, warranty: newWarranty };
}

export async function addWarrantyClaim(
  input: CreateWarrantyClaimInput,
  actorUserId: string
): Promise<{ success: boolean; claim?: WarrantyClaim; error?: string }> {
  const wIdx = warrantiesData.findIndex((w) => w.id === input.warrantyId);
  if (wIdx === -1) {
    return { success: false, error: "Data garansi tidak ditemukan." };
  }

  const newClaim: WarrantyClaim = {
    id: `claim-${Date.now()}`,
    warrantyId: input.warrantyId,
    issueTitle: input.issueTitle.trim(),
    issueDescription: input.issueDescription.trim(),
    reportedDate: new Date().toISOString().split("T")[0],
    status: "OPEN",
    reportedBy: input.reportedBy.trim(),
  };

  warrantiesData[wIdx].claims.unshift(newClaim);

  logActivity({
    category: "PROJECT",
    action: "WARRANTY_CLAIM_FILED",
    actorId: actorUserId,
    targetId: newClaim.id,
    targetType: "WARRANTY_CLAIM",
    metadata: { title: newClaim.issueTitle, client: warrantiesData[wIdx].clientName },
  });

  return { success: true, claim: newClaim };
}

export async function updateWarrantyClaimStatus(
  claimId: string,
  status: ClaimStatus,
  actorUserId: string,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  for (const w of warrantiesData) {
    const cIdx = w.claims.findIndex((c) => c.id === claimId);
    if (cIdx !== -1) {
      w.claims[cIdx].status = status;
      if (resolutionNotes) {
        w.claims[cIdx].resolutionNotes = resolutionNotes;
      }
      if (status === "RESOLVED") {
        w.claims[cIdx].resolvedAt = new Date().toISOString();
      }

      logActivity({
        category: "PROJECT",
        action: `CLAIM_STATUS_${status}`,
        actorId: actorUserId,
        targetId: claimId,
        metadata: { status, resolutionNotes },
      });

      return { success: true };
    }
  }

  return { success: false, error: "Klaim garansi tidak ditemukan." };
}

export async function getAllMaintenanceContracts(): Promise<MaintenanceContract[]> {
  return maintenanceContractsData.map((m) => {
    const daysRemaining = calculateDaysRemaining(m.endDate);
    const status = determineMaintenanceStatus(daysRemaining, m.status);
    return {
      ...m,
      daysRemaining,
      status,
    };
  });
}

export async function createMaintenanceContract(
  input: CreateMaintenanceContractInput,
  actorUserId: string
): Promise<{ success: boolean; contract?: MaintenanceContract; error?: string }> {
  const client = clientsData.find((c) => c.id === input.clientId);
  if (!client) {
    return { success: false, error: "Klien tidak valid." };
  }

  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + input.durationMonths);
  const endDateStr = end.toISOString().split("T")[0];

  // Renewal reminder 15 days before end
  const reminder = new Date(end);
  reminder.setDate(reminder.getDate() - 15);
  const reminderDateStr = reminder.toISOString().split("T")[0];

  const daysRemaining = calculateDaysRemaining(endDateStr);
  const status = determineMaintenanceStatus(daysRemaining, "ACTIVE");

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const seq = String(maintenanceContractsData.length + 1).padStart(4, "0");
  const contractNumber = `MNC-${yearMonth}-${seq}`;

  const newContract: MaintenanceContract = {
    id: `mnc-${Date.now()}`,
    contractNumber,
    clientId: input.clientId,
    clientName: client.name,
    projectId: input.projectId,
    projectName: "Layanan Pemeliharaan Website",
    billingType: input.billingType,
    price: input.price,
    startDate: input.startDate,
    endDate: endDateStr,
    daysRemaining,
    status,
    terms: input.terms || "Perawatan berkala backup dan keamanan sistem.",
    scopeItems: input.scopeItems || [
      "Backup mingguan server",
      "Pembaruan keamanan",
      "Monitoring uptime 24/7",
    ],
    renewalReminderDate: reminderDateStr,
    renewalAlertSent: false,
    createdAt: new Date().toISOString(),
  };

  maintenanceContractsData.unshift(newContract);

  logActivity({
    category: "FINANCE",
    action: "MAINTENANCE_CONTRACT_CREATED",
    actorId: actorUserId,
    targetId: newContract.id,
    targetType: "MAINTENANCE_CONTRACT",
    metadata: {
      contractNumber: newContract.contractNumber,
      client: client.name,
      price: newContract.price,
    },
  });

  return { success: true, contract: newContract };
}

export async function updateMaintenanceContractStatus(
  contractId: string,
  status: MaintenanceContractStatus,
  actorUserId: string
): Promise<{ success: boolean; error?: string }> {
  const idx = maintenanceContractsData.findIndex((m) => m.id === contractId);
  if (idx === -1) {
    return { success: false, error: "Kontrak pemeliharaan tidak ditemukan." };
  }

  maintenanceContractsData[idx].status = status;

  logActivity({
    category: "FINANCE",
    action: `MAINTENANCE_STATUS_${status}`,
    actorId: actorUserId,
    targetId: contractId,
    metadata: { status },
  });

  return { success: true };
}

export async function generateRenewalFollowUpDraft(
  type: "WARRANTY" | "MAINTENANCE",
  targetId: string
): Promise<{
  success: boolean;
  targetPhone: string;
  clientName: string;
  messageText: string;
  error?: string;
}> {
  if (type === "WARRANTY") {
    const w = warrantiesData.find((item) => item.id === targetId);
    if (!w) return { success: false, targetPhone: "", clientName: "", messageText: "", error: "Garansi tidak ditemukan." };

    const client = clientsData.find((c) => c.id === w.clientId);
    const picName = client?.picName || "Bapak/Ibu";
    const phone = client?.picPhone || "";

    const messageText = `Halo ${picName}, selamat pagi/siang. Salam dari tim Fynux Digital Solutions.\n\nKami ingin menginformasikan bahwa periode garansi teknis untuk sistem/website *${w.projectName}* akan berakhir pada *${w.endDate}* (${w.daysRemaining > 0 ? `sisa ${w.daysRemaining} hari lagi` : "telah berakhir"}).\n\nAgar performa website, pencadangan database rutin, dan keamanan server tetap terjamin optimal, kami menyediakan program *Maintenance & Monitoring Berkala* mulai dari Rp 98.000/bulan.\n\nApakah berkenan jika kami kirimkan ringkasan proposal pemeliharaannya, Pak/Bu? Terima kasih banyak.`;

    return {
      success: true,
      targetPhone: phone,
      clientName: w.clientName,
      messageText,
    };
  } else {
    const m = maintenanceContractsData.find((item) => item.id === targetId);
    if (!m) return { success: false, targetPhone: "", clientName: "", messageText: "", error: "Kontrak maintenance tidak ditemukan." };

    const client = clientsData.find((c) => c.id === m.clientId);
    const picName = client?.picName || "Bapak/Ibu";
    const phone = client?.picPhone || "";

    const messageText = `Halo ${picName}, salam dari Fynux Digital Solutions.\n\nKami menginformasikan bahwa kontrak pemeliharaan website (*${m.contractNumber}*) untuk *${m.clientName}* akan segera jatuh tempo pada *${m.endDate}* (${m.daysRemaining > 0 ? `sisa ${m.daysRemaining} hari lagi` : "telah jatuh tempo"}).\n\nUntuk memastikan kelanjutan backup database, monitoring uptime, dan asistensi teknis tanpa jeda, kami siap membantu proses perpanjangan (renewal) untuk periode berikutnya.\n\nMohon konfirmasinya apakah invoice perpanjangan dapat kami terbitkan seperti biasa. Terima kasih atas kerja samanya.`;

    return {
      success: true,
      targetPhone: phone,
      clientName: m.clientName,
      messageText,
    };
  }
}
