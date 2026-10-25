import {
  CanvasViewportState,
  CreateProjectInput,
  CreateTaskInput,
  ExternalLink,
  Project,
  ProjectChatMessage,
  Task,
  TeamBoardItem,
} from "./types";
import { ProjectStatus, TaskPriority, TaskStatus } from "@/types/enums";
import { logActivity } from "@/lib/logger";

let projectsData: Project[] = [
  {
    id: "proj-002",
    name: "Business Website & Company Profile PT Padma Widya Setiajaya",
    clientId: "p-002",
    clientName: "PT Padma Widya Setiajaya",
    dealId: "deal-002",
    status: "ACTIVE",
    progressPercent: 35,
    scopeDescription:
      "Pembuatan website profil perusahaan konstruksi B2B dengan CMS kustom untuk galeri tender LPSE, domain .com 1 tahun, hosting NVMe, dan garansi teknis 6 bulan.",
    startDate: "2026-10-25",
    deadline: "2026-11-10",
    externalLinks: [
      {
        id: "link-01",
        title: "Google Drive: Aset Logo & Legalitas Perusahaan",
        url: "https://drive.google.com/drive/folders/example-padma-assets",
        category: "DOCUMENT",
      },
      {
        id: "link-02",
        title: "Figma: Mockup UI Company Profile",
        url: "https://figma.com/design/example-padma-ui",
        category: "DESIGN",
      },
    ],
    assignedMemberIds: [
      "33333333-3333-3333-3333-333333333333", // Eko (Dev)
      "11111111-1111-1111-1111-111111111111", // Faiz (Owner/Lead)
    ],
    assignedMemberNames: ["Eko Pratama (Developer)", "Faiz Aditama (Lead)"],
    chatMessages: [
      {
        id: "pchat-01",
        projectId: "proj-002",
        senderUserId: "11111111-1111-1111-1111-111111111111",
        senderName: "Faiz Aditama",
        text: "Mas Eko, tolong prioritaskan modul galeri proyek konstruksinya ya, klien butuh tautan portofolio untuk upload tender tanggal 12 November.",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "pchat-02",
        projectId: "proj-002",
        senderUserId: "33333333-3333-3333-3333-333333333333",
        senderName: "Eko Pratama",
        text: "Siap Mas Faiz, saat ini slicing landing page sudah 80%, sore ini saya lanjutkan integrasi upload foto proyek dan sertifikat ISO.",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj-001",
    name: "SIM-Presensi Digital Web App v1.0 SMAN 2 Ngaglik",
    clientId: "p-001",
    clientName: "SMAN 2 NGAGLIK",
    dealId: "deal-001",
    status: "COMPLETED",
    progressPercent: 100,
    scopeDescription:
      "Aplikasi presensi digital web-based multi-device support, kiosk absensi siswa/guru, anti brute-force, dan rekap otomatis laporan Excel multi-sheet.",
    startDate: "2026-02-01",
    deadline: "2026-02-12",
    externalLinks: [
      {
        id: "link-03",
        title: "Google Drive: Dokumentasi API Kiosk & Manual Book",
        url: "https://drive.google.com/drive/folders/example-sman2-docs",
        category: "DOCUMENT",
      },
    ],
    assignedMemberIds: [
      "11111111-1111-1111-1111-111111111111",
      "33333333-3333-3333-3333-333333333333",
    ],
    assignedMemberNames: ["Faiz Aditama", "Eko Pratama"],
    chatMessages: [],
    createdAt: "2026-02-01T08:00:00Z",
    updatedAt: "2026-02-12T10:00:00Z",
  },
];

let tasksData: Task[] = [
  {
    id: "task-001",
    projectId: "proj-002",
    projectName: "Business Website PT Padma",
    title: "Slicing Landing Page & Galeri Proyek Konstruksi",
    description: "Implementasi desain responsif mobile & desktop menggunakan Tailwind CSS.",
    primaryPicId: "33333333-3333-3333-3333-333333333333",
    primaryPicName: "Eko Pratama (Developer)",
    collaboratorIds: [],
    status: "IN_PROGRESS",
    priority: "HIGH",
    deadline: "2026-11-02",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-002",
    projectId: "proj-002",
    projectName: "Business Website PT Padma",
    title: "Integrasi CMS Kustom Portofolio Tender",
    description: "Sistem upload foto proyek, deskripsi tender, dan filter kategori konstruksi.",
    primaryPicId: "33333333-3333-3333-3333-333333333333",
    primaryPicName: "Eko Pratama (Developer)",
    collaboratorIds: ["11111111-1111-1111-1111-111111111111"],
    collaboratorNames: ["Faiz Aditama"],
    status: "TODO",
    priority: "HIGH",
    deadline: "2026-11-05",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-003",
    projectId: "proj-002",
    projectName: "Business Website PT Padma",
    title: "Menunggu Konten Sertifikat ISO & Foto High-Res Klien",
    description: "Koordinasi dengan Bu Rina terkait kelengkapan scan sertifikat akreditasi.",
    primaryPicId: "22222222-2222-2222-2222-222222222222",
    primaryPicName: "Budi Santoso (Sales)",
    collaboratorIds: [],
    status: "BLOCKED",
    blockedReason: "Klien belum mengirimkan foto resolusi tinggi sertifikat ISO perusahaan untuk galeri akreditasi tender.",
    priority: "MEDIUM",
    deadline: "2026-10-30",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-004",
    projectId: "proj-001",
    projectName: "SIM-Presensi SMAN 2 Ngaglik",
    title: "Setup Server Cloud NVMe & SSL Presensi",
    description: "Konfigurasi server Ubuntu, SSL Let's Encrypt, dan firewall anti brute-force.",
    primaryPicId: "11111111-1111-1111-1111-111111111111",
    primaryPicName: "Faiz Aditama",
    collaboratorIds: [],
    status: "DONE",
    priority: "MEDIUM",
    createdAt: "2026-02-05T08:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
];

const INITIAL_TEAM_BOARD_DATA: TeamBoardItem[] = [
  {
    id: "tb-01",
    category: "TARGET",
    title: "Target Operasional Q4 2026",
    subtitle: "10 Website Baru & Peningkatan Retensi Maintenance",
    content:
      "Fokus kuartal ini adalah penyelesaian tepat waktu proyek aktif PT Padma, ekspansi outreach ke 50 prospek baru teriset, dan pengawalan renewal kontrak maintenance.",
    authorId: "11111111-1111-1111-1111-111111111111",
    authorName: "Faiz Aditama (Owner)",
    x: 60,
    y: 60,
    width: 380,
    height: 250,
    colorTheme: "emerald",
    attachments: [
      {
        id: "att-01",
        name: "Target_Q4_Roadmap.pdf",
        size: "1.2 MB",
        type: "application/pdf",
        url: "https://drive.google.com/example-target-q4",
      },
    ],
    createdAt: "2026-10-20T08:00:00Z",
  },
  {
    id: "tb-02",
    category: "SOP",
    title: "SOP Handoff Deal ke Proyek Delivery",
    subtitle: "Standar Operasional Penyerahan Dokumen Sales ke Developer",
    content:
      "1. Deal wajib accepted dan invoice resmi berformat FYN telah terbit.\n2. Sales wajib mengisi checklist ruang lingkup dan link Google Drive aset klien.\n3. Jika data wajib (logo/materi inti) belum lengkap, proyek tetap dapat dibuat namun status task ditandai BLOCKED.",
    authorId: "11111111-1111-1111-1111-111111111111",
    authorName: "Faiz Aditama (Owner)",
    x: 480,
    y: 60,
    width: 420,
    height: 300,
    colorTheme: "indigo",
    attachments: [],
    createdAt: "2026-10-21T09:00:00Z",
  },
  {
    id: "tb-03",
    category: "ANNOUNCEMENT",
    title: "Update Standar Invoice & Pembayaran Gateway",
    subtitle: "Ketentuan Format FYN-YYYYMM-XXXX & Duitku PG",
    content:
      "Sistem sekarang telah mendukung pembayaran otomatis via Duitku PG (QRIS & Virtual Account) serta konfirmasi manual transfer Bank BCA.",
    authorId: "11111111-1111-1111-1111-111111111111",
    authorName: "Faiz Aditama (Owner)",
    x: 940,
    y: 60,
    width: 400,
    height: 240,
    colorTheme: "amber",
    attachments: [],
    createdAt: "2026-10-24T10:00:00Z",
  },
];

const INITIAL_CANVAS_VIEWPORT: CanvasViewportState = {
  panX: 40,
  panY: 40,
  zoom: 1.0,
  updatedBy: "Faiz Aditama (Owner)",
  updatedAt: new Date().toISOString(),
};

interface ProjectsGlobalStore {
  teamBoardData?: TeamBoardItem[];
  sharedCanvasViewportData?: CanvasViewportState;
}

const projectsGlobal = globalThis as unknown as ProjectsGlobalStore;
if (!projectsGlobal.teamBoardData || projectsGlobal.teamBoardData.length === 0) {
  projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
}
if (!projectsGlobal.sharedCanvasViewportData) {
  projectsGlobal.sharedCanvasViewportData = { ...INITIAL_CANVAS_VIEWPORT };
}

// Exported alias for compatibility
export const teamBoardData = projectsGlobal.teamBoardData;

// Methods
export async function getAllProjects(filterStatus?: ProjectStatus | "ALL"): Promise<Project[]> {
  if (!filterStatus || filterStatus === "ALL") {
    return [...projectsData];
  }
  return projectsData.filter((p) => p.status === filterStatus);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const p = projectsData.find((item) => item.id === id);
  return p ? { ...p } : null;
}

export async function createProject(
  input: CreateProjectInput,
  actorUserId: string,
  actorName: string
): Promise<{ success: boolean; project?: Project; error?: string }> {
  if (!input.name.trim()) {
    return { success: false, error: "Nama proyek wajib diisi." };
  }

  const newProject: Project = {
    id: `proj-${Date.now()}`,
    name: input.name.trim(),
    clientId: input.clientId,
    clientName: input.clientName,
    dealId: input.dealId,
    status: "ACTIVE",
    progressPercent: 0,
    scopeDescription: input.scopeDescription,
    startDate: new Date().toISOString().split("T")[0],
    deadline: input.targetDeadline,
    assignedMemberIds: input.assignedMemberIds.length > 0 ? input.assignedMemberIds : [actorUserId],
    assignedMemberNames: [actorName],
    externalLinks: input.externalLinks
      ? input.externalLinks.map((l, idx) => ({ ...l, id: `link-${Date.now()}-${idx}` }))
      : [],
    chatMessages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projectsData.unshift(newProject);

  logActivity({
    category: "PROJECT",
    action: "PROJECT_CREATED",
    actorId: actorUserId,
    targetId: newProject.id,
    targetType: "PROJECT",
    metadata: { name: newProject.name, client: newProject.clientName },
  });

  return { success: true, project: newProject };
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
  actorUserId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const idx = projectsData.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, error: "Proyek tidak ditemukan." };

  projectsData[idx].status = status;
  projectsData[idx].updatedAt = new Date().toISOString();

  if (status === "ON_HOLD") {
    projectsData[idx].onHoldReason = reason || "Ditunda sementara";
    projectsData[idx].onHoldDate = new Date().toISOString();
  } else if (status === "CANCELLED") {
    projectsData[idx].cancelledReason = reason || "Dibatalkan oleh Owner";
  } else if (status === "COMPLETED") {
    projectsData[idx].progressPercent = 100;
  }

  logActivity({
    category: "PROJECT",
    action: `PROJECT_STATUS_${status}`,
    actorId: actorUserId,
    targetId: id,
    targetType: "PROJECT",
    metadata: { status, reason },
  });

  return { success: true };
}

export async function updateProjectProgress(
  id: string,
  progress: number,
  actorUserId: string
): Promise<{ success: boolean }> {
  const idx = projectsData.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false };

  projectsData[idx].progressPercent = Math.min(100, Math.max(0, progress));
  projectsData[idx].updatedAt = new Date().toISOString();

  if (progress === 100) {
    projectsData[idx].status = "COMPLETED";
  }

  logActivity({
    category: "PROJECT",
    action: "PROJECT_PROGRESS_UPDATED",
    actorId: actorUserId,
    targetId: id,
    metadata: { progress },
  });

  return { success: true };
}

export async function addProjectExternalLink(
  projectId: string,
  link: { title: string; url: string; category: ExternalLink["category"] },
  actorUserId: string
): Promise<{ success: boolean }> {
  const idx = projectsData.findIndex((p) => p.id === projectId);
  if (idx === -1) return { success: false };

  projectsData[idx].externalLinks.push({
    id: `link-${Date.now()}`,
    ...link,
  });

  logActivity({
    category: "PROJECT",
    action: "EXTERNAL_LINK_ADDED",
    actorId: actorUserId,
    targetId: projectId,
    metadata: { linkTitle: link.title, url: link.url },
  });

  return { success: true };
}

export async function getAllTasks(filter?: {
  projectId?: string;
  picId?: string;
  status?: TaskStatus;
}): Promise<Task[]> {
  let list = [...tasksData];

  if (filter?.projectId) {
    list = list.filter((t) => t.projectId === filter.projectId);
  }
  if (filter?.picId) {
    list = list.filter((t) => t.primaryPicId === filter.picId);
  }
  if (filter?.status) {
    list = list.filter((t) => t.status === filter.status);
  }

  return list;
}

export async function createTask(
  input: CreateTaskInput,
  actorUserId: string,
  actorName: string
): Promise<{ success: boolean; task?: Task; error?: string }> {
  if (!input.title.trim()) {
    return { success: false, error: "Judul task wajib diisi." };
  }

  const proj = input.projectId
    ? projectsData.find((p) => p.id === input.projectId)
    : undefined;

  const newTask: Task = {
    id: `task-${Date.now()}`,
    projectId: input.projectId,
    projectName: proj ? proj.name : undefined,
    title: input.title.trim(),
    description: input.description?.trim(),
    primaryPicId: input.primaryPicId || actorUserId,
    primaryPicName: input.primaryPicId === actorUserId ? actorName : "Eko Pratama (Developer)",
    collaboratorIds: input.collaboratorIds || [],
    status: "TODO",
    priority: input.priority || "MEDIUM",
    deadline: input.deadline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasksData.unshift(newTask);

  logActivity({
    category: "PROJECT",
    action: "TASK_CREATED",
    actorId: actorUserId,
    targetId: newTask.id,
    targetType: "TASK",
    metadata: { title: newTask.title, project: newTask.projectName },
  });

  return { success: true, task: newTask };
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  actorUserId: string,
  blockedReason?: string
): Promise<{ success: boolean; error?: string }> {
  const idx = tasksData.findIndex((t) => t.id === taskId);
  if (idx === -1) return { success: false, error: "Task tidak ditemukan." };

  tasksData[idx].status = status;
  tasksData[idx].updatedAt = new Date().toISOString();

  if (status === "BLOCKED") {
    tasksData[idx].blockedReason = blockedReason || "Terkendala data/klien";
  } else if (status === "DONE") {
    tasksData[idx].blockedReason = undefined;
  }

  logActivity({
    category: "PROJECT",
    action: `TASK_STATUS_${status}`,
    actorId: actorUserId,
    targetId: taskId,
    targetType: "TASK",
    metadata: { status, blockedReason },
  });

  return { success: true };
}

export async function sendProjectChatMessage(
  projectId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<{ success: boolean; chatMessage?: ProjectChatMessage }> {
  const idx = projectsData.findIndex((p) => p.id === projectId);
  if (idx === -1) return { success: false };

  const newChat: ProjectChatMessage = {
    id: `pchat-${Date.now()}`,
    projectId,
    senderUserId: senderId,
    senderName,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  if (!projectsData[idx].chatMessages) {
    projectsData[idx].chatMessages = [];
  }
  projectsData[idx].chatMessages.push(newChat);

  return { success: true, chatMessage: newChat };
}

export async function getTeamBoardItems(): Promise<TeamBoardItem[]> {
  if (!projectsGlobal.teamBoardData || projectsGlobal.teamBoardData.length === 0) {
    projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
  }
  return [...projectsGlobal.teamBoardData];
}

export async function createTeamBoardItem(
  category: TeamBoardItem["category"],
  title: string,
  content: string,
  authorId: string,
  authorName: string,
  extra?: {
    subtitle?: string;
    titleStyle?: TeamBoardItem["titleStyle"];
    subtitleStyle?: TeamBoardItem["subtitleStyle"];
    contentStyle?: TeamBoardItem["contentStyle"];
    colorTheme?: TeamBoardItem["colorTheme"];
    attachments?: TeamBoardItem["attachments"];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
): Promise<TeamBoardItem> {
  if (!projectsGlobal.teamBoardData) {
    projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
  }

  const safeX = typeof extra?.x === "number" && !isNaN(extra.x) ? extra.x : Math.floor(Math.random() * 300) + 100;
  const safeY = typeof extra?.y === "number" && !isNaN(extra.y) ? extra.y : Math.floor(Math.random() * 200) + 100;
  const safeW = typeof extra?.width === "number" && !isNaN(extra.width) ? extra.width : 380;
  const safeH = typeof extra?.height === "number" && !isNaN(extra.height) ? extra.height : 260;

  const newItem: TeamBoardItem = {
    id: `tb-${Date.now()}`,
    category,
    title: title.trim(),
    titleStyle: extra?.titleStyle,
    subtitle: extra?.subtitle?.trim(),
    subtitleStyle: extra?.subtitleStyle,
    content: content.trim(),
    contentStyle: extra?.contentStyle,
    authorId,
    authorName,
    x: safeX,
    y: safeY,
    width: safeW,
    height: safeH,
    colorTheme: extra?.colorTheme ?? "indigo",
    attachments: extra?.attachments ?? [],
    createdAt: new Date().toISOString(),
  };

  projectsGlobal.teamBoardData.unshift(newItem);

  logActivity({
    category: "SYSTEM",
    action: "TEAM_BOARD_POSTED",
    actorId: authorId,
    targetId: newItem.id,
    targetType: "TEAM_BOARD",
    metadata: { title: newItem.title, category: newItem.category },
  });

  return newItem;
}

export async function updateTeamBoardItem(
  id: string,
  updates: Partial<TeamBoardItem>
): Promise<{ success: boolean; item?: TeamBoardItem; error?: string }> {
  if (!projectsGlobal.teamBoardData) {
    projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
  }
  const idx = projectsGlobal.teamBoardData.findIndex((item) => item.id === id);
  if (idx === -1) return { success: false, error: "Item tidak ditemukan." };

  projectsGlobal.teamBoardData[idx] = {
    ...projectsGlobal.teamBoardData[idx],
    ...updates,
  };

  return { success: true, item: { ...projectsGlobal.teamBoardData[idx] } };
}

export async function updateTeamBoardItemPosition(
  id: string,
  x: number,
  y: number,
  width?: number,
  height?: number
): Promise<{ success: boolean; error?: string }> {
  if (!projectsGlobal.teamBoardData) {
    projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
  }
  const idx = projectsGlobal.teamBoardData.findIndex((item) => item.id === id);
  if (idx === -1) return { success: false, error: "Item tidak ditemukan." };
  
  const safeX = typeof x === "number" && !isNaN(x) ? x : 60;
  const safeY = typeof y === "number" && !isNaN(y) ? y : 60;
  projectsGlobal.teamBoardData[idx].x = safeX;
  projectsGlobal.teamBoardData[idx].y = safeY;
  if (width !== undefined && !isNaN(width)) projectsGlobal.teamBoardData[idx].width = width;
  if (height !== undefined && !isNaN(height)) projectsGlobal.teamBoardData[idx].height = height;
  return { success: true };
}

export async function deleteTeamBoardItem(id: string): Promise<{ success: boolean; error?: string }> {
  if (!projectsGlobal.teamBoardData) {
    projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
  }
  const idx = projectsGlobal.teamBoardData.findIndex((item) => item.id === id);
  if (idx === -1) return { success: false, error: "Item tidak ditemukan." };
  projectsGlobal.teamBoardData.splice(idx, 1);
  return { success: true };
}

export async function getCanvasViewport(): Promise<CanvasViewportState> {
  if (!projectsGlobal.sharedCanvasViewportData) {
    projectsGlobal.sharedCanvasViewportData = { ...INITIAL_CANVAS_VIEWPORT };
  }
  const vp = projectsGlobal.sharedCanvasViewportData;
  const safePanX = typeof vp.panX === "number" && !isNaN(vp.panX) ? vp.panX : 40;
  const safePanY = typeof vp.panY === "number" && !isNaN(vp.panY) ? vp.panY : 40;
  const safeZoom = typeof vp.zoom === "number" && !isNaN(vp.zoom) && vp.zoom > 0.1 ? vp.zoom : 1.0;
  return { ...vp, panX: safePanX, panY: safePanY, zoom: safeZoom };
}

export async function updateCanvasViewport(
  panX: number,
  panY: number,
  zoom: number,
  updatedBy?: string
): Promise<{ success: boolean; viewport: CanvasViewportState }> {
  const safePanX = typeof panX === "number" && !isNaN(panX) ? panX : 40;
  const safePanY = typeof panY === "number" && !isNaN(panY) ? panY : 40;
  const safeZoom = typeof zoom === "number" && !isNaN(zoom) && zoom > 0.1 ? zoom : 1.0;

  projectsGlobal.sharedCanvasViewportData = {
    panX: safePanX,
    panY: safePanY,
    zoom: safeZoom,
    updatedBy: updatedBy || projectsGlobal.sharedCanvasViewportData?.updatedBy || "Faiz Aditama (Owner)",
    updatedAt: new Date().toISOString(),
  };
  return { success: true, viewport: { ...projectsGlobal.sharedCanvasViewportData } };
}
