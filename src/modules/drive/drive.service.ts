import fs from "node:fs";
import path from "node:path";
import {
  CreateFolderInput,
  DriveBreadcrumb,
  DriveFilterCategory,
  DriveItem,
  DriveStats,
  UploadFileInput,
} from "./types";
import { logActivity } from "@/lib/logger";

interface DriveGlobalStore {
  driveItems?: DriveItem[];
}

const driveGlobal = globalThis as unknown as DriveGlobalStore;

const DATA_DIR = path.join(process.cwd(), "data");
const DRIVE_DIR = path.join(DATA_DIR, "drive");
export const DRIVE_STORAGE_DIR =
  process.env.DRIVE_STORAGE_PATH || path.join(DRIVE_DIR, "storage");
const METADATA_FILE = path.join(DRIVE_DIR, "drive-metadata.json");

export function ensureDriveDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DRIVE_DIR)) {
    fs.mkdirSync(DRIVE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DRIVE_STORAGE_DIR)) {
    fs.mkdirSync(DRIVE_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Initial Seed Folders & Real Internal Assets
 */
function createInitialDriveItems(): DriveItem[] {
  ensureDriveDirs();

  const now = new Date().toISOString();
  const folderLegalId = "folder-legal-template";
  const folderBrandingId = "folder-branding-asset";
  const folderSopId = "folder-sop-internal";
  const folderClientId = "folder-client-project";

  const seedFolders: DriveItem[] = [
    {
      id: folderLegalId,
      name: "Template & Dokumen Legal",
      type: "FOLDER",
      parentId: null,
      size: 0,
      uploadedByUserId: "11111111-1111-1111-1111-111111111111",
      uploadedByUserName: "Faiz Aditama (Owner)",
      uploadedByRole: "OWNER",
      isStarred: true,
      color: "blue",
      tags: ["Legal", "Template", "HQ"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: folderBrandingId,
      name: "Aset Branding & Identitas Visual",
      type: "FOLDER",
      parentId: null,
      size: 0,
      uploadedByUserId: "11111111-1111-1111-1111-111111111111",
      uploadedByUserName: "Faiz Aditama (Owner)",
      uploadedByRole: "OWNER",
      isStarred: true,
      color: "emerald",
      tags: ["Branding", "Asset", "Design"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: folderSopId,
      name: "SOP & Panduan Operasional Tim",
      type: "FOLDER",
      parentId: null,
      size: 0,
      uploadedByUserId: "11111111-1111-1111-1111-111111111111",
      uploadedByUserName: "Faiz Aditama (Owner)",
      uploadedByRole: "OWNER",
      isStarred: false,
      color: "amber",
      tags: ["SOP", "Internal"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: folderClientId,
      name: "Arsip Project & Handover Klien",
      type: "FOLDER",
      parentId: null,
      size: 0,
      uploadedByUserId: "11111111-1111-1111-1111-111111111111",
      uploadedByUserName: "Faiz Aditama (Owner)",
      uploadedByRole: "OWNER",
      isStarred: false,
      color: "slate",
      tags: ["Projects", "Clients"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const seedFiles: DriveItem[] = [];

  // Seed File 1: Terms of Service PDF from DATA INTI
  const termsSrc = path.join(
    process.cwd(),
    "DATA INTI",
    "Cover Terms & Services – Fynux Basic Website.pdf"
  );
  if (fs.existsSync(termsSrc)) {
    const targetFile = "seed-terms-of-service.pdf";
    const targetPath = path.join(DRIVE_STORAGE_DIR, targetFile);
    try {
      fs.copyFileSync(termsSrc, targetPath);
      const stat = fs.statSync(targetPath);
      seedFiles.push({
        id: "file-seed-terms-pdf",
        name: "Cover Terms & Services – Fynux Basic Website.pdf",
        type: "FILE",
        parentId: folderLegalId,
        extension: "pdf",
        mimeType: "application/pdf",
        size: stat.size,
        storagePath: targetFile,
        uploadedByUserId: "11111111-1111-1111-1111-111111111111",
        uploadedByUserName: "Faiz Aditama (Owner)",
        uploadedByRole: "OWNER",
        isStarred: true,
        tags: ["Terms", "Legal", "Website"],
        createdAt: now,
        updatedAt: now,
      });
    } catch {}
  }

  // Seed File 2: Invoice Template from DATA INTI
  const invoiceSrc = path.join(process.cwd(), "DATA INTI", "INVOICE-WEBDEV1.pdf");
  if (fs.existsSync(invoiceSrc)) {
    const targetFile = "seed-invoice-template.pdf";
    const targetPath = path.join(DRIVE_STORAGE_DIR, targetFile);
    try {
      fs.copyFileSync(invoiceSrc, targetPath);
      const stat = fs.statSync(targetPath);
      seedFiles.push({
        id: "file-seed-invoice-pdf",
        name: "Contoh Invoice Standar WebDev FYNUX.pdf",
        type: "FILE",
        parentId: folderLegalId,
        extension: "pdf",
        mimeType: "application/pdf",
        size: stat.size,
        storagePath: targetFile,
        uploadedByUserId: "11111111-1111-1111-1111-111111111111",
        uploadedByUserName: "Faiz Aditama (Owner)",
        uploadedByRole: "OWNER",
        isStarred: false,
        tags: ["Finance", "Invoice"],
        createdAt: now,
        updatedAt: now,
      });
    } catch {}
  }

  // Seed File 3: Logo Fynux PNG from public
  const logoSrc = path.join(process.cwd(), "public", "logo-fynux.png");
  if (fs.existsSync(logoSrc)) {
    const targetFile = "seed-logo-fynux.png";
    const targetPath = path.join(DRIVE_STORAGE_DIR, targetFile);
    try {
      fs.copyFileSync(logoSrc, targetPath);
      const stat = fs.statSync(targetPath);
      seedFiles.push({
        id: "file-seed-logo-png",
        name: "Logo Resmi FYNUX OS (High Resolution).png",
        type: "FILE",
        parentId: folderBrandingId,
        extension: "png",
        mimeType: "image/png",
        size: stat.size,
        storagePath: targetFile,
        uploadedByUserId: "11111111-1111-1111-1111-111111111111",
        uploadedByUserName: "Faiz Aditama (Owner)",
        uploadedByRole: "OWNER",
        isStarred: true,
        tags: ["Logo", "Asset", "PNG"],
        createdAt: now,
        updatedAt: now,
      });
    } catch {}
  }

  // Seed File 4: SOP Markdown File
  const sopContent = `# STANDAR OPERASIONAL PROSEDUR (SOP) — DELIVERY FYNUX
1. Inisiasi Proyek:
   - Validasi data brief klien dari CRM dan WhatsApp Inbox.
   - Buat Project & Task To-Do dengan deadline jelas.
2. Tahap Development:
   - Framework standar: Next.js App Router, Tailwind CSS, TypeScript.
   - Strict Anti-AI Slop UI: Palet tajam slate/zinc, tidak menggunakan emoji di UI, font modern.
3. Quality Assurance & Handover:
   - Verifikasi mobile responsiveness di Chrome & Safari.
   - Serah terima invoice dan aktivasi garansi client lifecycle.
`;
  const sopFile = "seed-sop-dev.md";
  const sopPath = path.join(DRIVE_STORAGE_DIR, sopFile);
  try {
    fs.writeFileSync(sopPath, sopContent, "utf-8");
    const stat = fs.statSync(sopPath);
    seedFiles.push({
      id: "file-seed-sop-md",
      name: "SOP-Development-QA-Standar.md",
      type: "FILE",
      parentId: folderSopId,
      extension: "md",
      mimeType: "text/markdown",
      size: stat.size,
      storagePath: sopFile,
      uploadedByUserId: "11111111-1111-1111-1111-111111111111",
      uploadedByUserName: "Faiz Aditama (Owner)",
      uploadedByRole: "OWNER",
      isStarred: true,
      tags: ["SOP", "Development", "Documentation"],
      createdAt: now,
      updatedAt: now,
    });
  } catch {}

  const allItems = [...seedFolders, ...seedFiles];

  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(allItems, null, 2), "utf-8");
  } catch (err) {
    console.error("[DRIVE] Gagal menulis metadata seed:", err);
  }

  return allItems;
}

export function loadPersistedDriveItems(): DriveItem[] {
  ensureDriveDirs();
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const raw = fs.readFileSync(METADATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[DRIVE] Gagal membaca metadata drive:", err);
  }

  return createInitialDriveItems();
}

/**
 * Otomatis memulihkan dan menyinkronkan file fisik di storage yang belum terdaftar di metadata,
 * serta membersihkan duplikasi entri storagePath.
 */
export function reconcileStorageWithMetadata(store: DriveItem[]): boolean {
  try {
    ensureDriveDirs();
    if (!fs.existsSync(DRIVE_STORAGE_DIR)) return false;

    let changed = false;

    // 1. Deduplikasi store: Pastikan tidak ada 2 DriveItem dengan storagePath yang sama
    const seenStoragePaths = new Map<string, number>();
    const indicesToRemove = new Set<number>();

    store.forEach((item, index) => {
      if (item.type === "FILE" && item.storagePath) {
        if (seenStoragePaths.has(item.storagePath)) {
          const prevIndex = seenStoragePaths.get(item.storagePath)!;
          const prevItem = store[prevIndex];
          // Simpan entri yang lebih kaya informasi (bukan entri fallback tag "HQ Drive")
          if (item.tags?.includes("HQ Drive") && !prevItem.tags?.includes("HQ Drive")) {
            indicesToRemove.add(index);
          } else {
            indicesToRemove.add(prevIndex);
            seenStoragePaths.set(item.storagePath, index);
          }
          changed = true;
        } else {
          seenStoragePaths.set(item.storagePath, index);
        }
      }
    });

    if (indicesToRemove.size > 0) {
      const filtered = store.filter((_, idx) => !indicesToRemove.has(idx));
      store.length = 0;
      store.push(...filtered);
    }

    const filesOnDisk = fs.readdirSync(DRIVE_STORAGE_DIR);
    const nowMs = Date.now();

    // Peta nama file lama yang terverifikasi di activity log pengguna
    const KNOWN_RENAMES: Record<string, string> = {
      "1793459359062-nvax-YTDown.com_YouTube_Media_XjWRWd-LkyI_DreamyBull_001_720p.mp4":
        "VIRALLL!!! ORANG MAKAN KUNGKANG SAAT LIVE.mp4",
      "1793460881494-9maw-FgoZslwUcAEsTLq.jpg": "colocolo.jpg",
      "1793457656751-5h17-Perjanjian_Kerja_Sama_Internal_Fynux.pdf":
        "Perjanjian_Kerja_Sama_Internal_Fynux.pdf",
      "1793458901297-2l6n-Perjanjian_Kerja_Sama_Internal_Fynux.pdf":
        "Perjanjian_Kerja_Sama_Internal_Fynux_v2.pdf",
    };

    for (const diskFile of filesOnDisk) {
      if (diskFile.startsWith(".") || diskFile.endsWith(".tmp")) continue;

      const alreadyExists = store.some((item) => item.storagePath === diskFile);
      if (!alreadyExists) {
        const fullPath = path.join(DRIVE_STORAGE_DIR, diskFile);
        try {
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) continue;

          // JANGAN pulihkan file yang baru saja dibuat dalam 10 detik terakhir
          // untuk mencegah tabrakan/duplikasi dengan proses upload yang sedang berlangsung
          const fileAgeMs = nowMs - (stat.mtimeMs || nowMs);
          if (fileAgeMs < 10000) {
            continue;
          }

          const ext = path.extname(diskFile).replace(".", "").toLowerCase() || "bin";

          let displayName = KNOWN_RENAMES[diskFile];
          if (!displayName) {
            const match = diskFile.match(/^\d+-[a-z0-9]+-(.+)$/);
            displayName = match ? match[1] : diskFile;
          }

          let mimeType = "application/octet-stream";
          if (["pdf"].includes(ext)) mimeType = "application/pdf";
          else if (["png"].includes(ext)) mimeType = "image/png";
          else if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
          else if (["webp"].includes(ext)) mimeType = "image/webp";
          else if (["mp4"].includes(ext)) mimeType = "video/mp4";
          else if (["txt", "md"].includes(ext)) mimeType = "text/plain";

          const recoveredItem: DriveItem = {
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: displayName,
            type: "FILE",
            parentId: null,
            extension: ext,
            mimeType,
            size: stat.size,
            storagePath: diskFile,
            uploadedByUserId: "ff3348a5-ed68-4551-899c-1a7120a87f60",
            uploadedByUserName: "Faiz Aditama",
            uploadedByRole: "OWNER",
            isStarred: false,
            tags: ["HQ Drive"],
            createdAt: stat.birthtime?.toISOString() || new Date().toISOString(),
            updatedAt: stat.mtime?.toISOString() || new Date().toISOString(),
          };

          store.unshift(recoveredItem);
          changed = true;
        } catch {}
      }
    }

    return changed;
  } catch (err) {
    console.error("[DRIVE] Gagal reconcile storage dengan metadata:", err);
    return false;
  }
}

export function getDriveItemsStore(): DriveItem[] {
  ensureDriveDirs();
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const raw = fs.readFileSync(METADATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (!driveGlobal.driveItems) {
          driveGlobal.driveItems = parsed;
        } else {
          driveGlobal.driveItems.length = 0;
          driveGlobal.driveItems.push(...parsed);
        }

        const reconciled = reconcileStorageWithMetadata(driveGlobal.driveItems);
        if (reconciled) {
          persistDriveItems();
        }
        return driveGlobal.driveItems;
      }
    }
  } catch (err) {
    console.error("[DRIVE] Gagal refresh drive metadata dari disk:", err);
  }

  if (!driveGlobal.driveItems || driveGlobal.driveItems.length === 0) {
    driveGlobal.driveItems = loadPersistedDriveItems();
    const reconciled = reconcileStorageWithMetadata(driveGlobal.driveItems);
    if (reconciled) {
      persistDriveItems();
    }
  }
  return driveGlobal.driveItems;
}

export function persistDriveItems(): void {
  ensureDriveDirs();
  try {
    const data = driveGlobal.driveItems || getDriveItemsStore();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[DRIVE] Gagal menyimpan drive metadata ke disk:", err);
  }
}

if (!driveGlobal.driveItems || driveGlobal.driveItems.length === 0) {
  driveGlobal.driveItems = getDriveItemsStore();
}

export const driveItems = driveGlobal.driveItems;

/**
 * Mengambil daftar item di dalam parent folder tertentu dengan pencarian dan filter
 */
export async function getDriveItems(options?: {
  parentId?: string | null;
  search?: string;
  filter?: DriveFilterCategory;
  isStarred?: boolean;
}): Promise<DriveItem[]> {
  const store = getDriveItemsStore();
  let list = store.filter((item) => !item.isArchived);

  // Filter Starred
  if (options?.isStarred) {
    list = list.filter((item) => item.isStarred);
  }

  // Filter Search
  if (options?.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.extension && item.extension.toLowerCase().includes(q)) ||
        item.uploadedByUserName.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
    // Saat search aktif, jangan batasi parentId agar bisa menemukan file di subfolder mana pun
  } else {
    // Navigasi normal berbasis parent folder
    const targetParent = options?.parentId === undefined ? null : options.parentId;
    list = list.filter((item) => item.parentId === targetParent);
  }

  // Filter Kategori
  if (options?.filter && options.filter !== "ALL") {
    switch (options.filter) {
      case "FOLDER":
        list = list.filter((i) => i.type === "FOLDER");
        break;
      case "DOCUMENT":
        list = list.filter(
          (i) =>
            i.type === "FILE" &&
            ["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(
              (i.extension || "").toLowerCase()
            )
        );
        break;
      case "IMAGE":
        list = list.filter(
          (i) =>
            i.type === "FILE" &&
            ["png", "jpg", "jpeg", "webp", "svg", "gif", "ico"].includes(
              (i.extension || "").toLowerCase()
            )
        );
        break;
      case "MEDIA":
        list = list.filter(
          (i) =>
            i.type === "FILE" &&
            ["mp4", "mp3", "mov", "wav", "ogg", "webm"].includes(
              (i.extension || "").toLowerCase()
            )
        );
        break;
      case "ARCHIVE":
        list = list.filter(
          (i) =>
            i.type === "FILE" &&
            ["zip", "rar", "7z", "tar", "gz"].includes(
              (i.extension || "").toLowerCase()
            )
        );
        break;
      case "STARRED":
        list = list.filter((i) => i.isStarred);
        break;
    }
  }

  // Hitung jumlah item di dalam folder
  return list.map((item) => {
    if (item.type === "FOLDER") {
      const childrenCount = store.filter(
        (c) => c.parentId === item.id && !c.isArchived
      ).length;
      return { ...item, itemCount: childrenCount };
    }
    return { ...item };
  });
}

/**
 * Menyusun rekam jejak breadcrumbs dari root ke folder aktif
 */
export function getDriveBreadcrumbs(folderId?: string | null): DriveBreadcrumb[] {
  const breadcrumbs: DriveBreadcrumb[] = [{ id: null, name: "HQ Drive" }];
  if (!folderId) return breadcrumbs;

  const store = getDriveItemsStore();
  const chain: DriveBreadcrumb[] = [];
  let currId: string | null = folderId;

  const visited = new Set<string>();
  while (currId && !visited.has(currId)) {
    visited.add(currId);
    const folder = store.find((i) => i.id === currId && i.type === "FOLDER");
    if (!folder) break;
    chain.unshift({ id: folder.id, name: folder.name });
    currId = folder.parentId;
  }

  return [...breadcrumbs, ...chain];
}

export function getDriveItemById(id: string): DriveItem | null {
  const store = getDriveItemsStore();
  const item = store.find((i) => i.id === id && !i.isArchived);
  return item ? { ...item } : null;
}

/**
 * Membuat Folder Baru di dalam Shared Drive
 */
export async function createFolder(
  input: CreateFolderInput,
  actor: { id: string; name: string; role: string }
): Promise<{ success: boolean; item?: DriveItem; error?: string }> {
  const cleanName = input.name.trim();
  if (!cleanName) {
    return { success: false, error: "Nama folder tidak boleh kosong." };
  }

  const store = getDriveItemsStore();
  const parentId = input.parentId || null;

  // Cek duplikasi nama folder dalam parent yang sama
  const duplicate = store.find(
    (i) =>
      i.parentId === parentId &&
      i.type === "FOLDER" &&
      i.name.toLowerCase() === cleanName.toLowerCase() &&
      !i.isArchived
  );
  if (duplicate) {
    return {
      success: false,
      error: `Folder dengan nama "${cleanName}" sudah ada di direktori ini.`,
    };
  }

  const now = new Date().toISOString();
  const newFolder: DriveItem = {
    id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: cleanName,
    type: "FOLDER",
    parentId,
    size: 0,
    uploadedByUserId: actor.id,
    uploadedByUserName: actor.name,
    uploadedByRole: actor.role,
    isStarred: false,
    color: input.color || "blue",
    createdAt: now,
    updatedAt: now,
  };

  store.unshift(newFolder);
  persistDriveItems();

  logActivity({
    category: "PROJECT",
    action: "DRIVE_FOLDER_CREATED",
    actorId: actor.id,
    targetId: newFolder.id,
    targetType: "DRIVE_FOLDER",
    metadata: { name: newFolder.name, parentId: newFolder.parentId },
  });

  return { success: true, item: newFolder };
}

/**
 * Mencatat file yang diunggah ke storage
 */
export async function registerUploadedFile(
  input: UploadFileInput,
  actor: { id: string; name: string; role: string }
): Promise<{ success: boolean; item?: DriveItem; error?: string }> {
  const cleanName = input.name.trim();
  if (!cleanName) {
    return { success: false, error: "Nama file tidak valid." };
  }

  const store = getDriveItemsStore();
  const parentId = input.parentId || null;
  const now = new Date().toISOString();

  // Defensif: Jika storagePath sudah ada di store (misal karena race condition atau double request)
  const existing = store.find((item) => item.storagePath === input.storagePath);
  if (existing) {
    existing.name = cleanName;
    existing.parentId = parentId;
    existing.extension = input.extension.toLowerCase();
    existing.mimeType = input.mimeType;
    existing.size = input.size;
    existing.uploadedByUserId = actor.id;
    existing.uploadedByUserName = actor.name;
    existing.uploadedByRole = actor.role;
    existing.tags = input.tags || [];
    existing.updatedAt = now;
    persistDriveItems();
    return { success: true, item: existing };
  }

  const newFile: DriveItem = {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    type: "FILE",
    parentId,
    extension: input.extension.toLowerCase(),
    mimeType: input.mimeType,
    size: input.size,
    storagePath: input.storagePath,
    uploadedByUserId: actor.id,
    uploadedByUserName: actor.name,
    uploadedByRole: actor.role,
    isStarred: false,
    tags: input.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  store.unshift(newFile);
  persistDriveItems();

  logActivity({
    category: "PROJECT",
    action: "DRIVE_FILE_UPLOADED",
    actorId: actor.id,
    targetId: newFile.id,
    targetType: "DRIVE_FILE",
    metadata: {
      name: newFile.name,
      size: newFile.size,
      extension: newFile.extension,
      parentId: newFile.parentId,
    },
  });

  return { success: true, item: newFile };
}

/**
 * Mengubah nama file atau folder
 */
export async function renameDriveItem(
  id: string,
  newName: string,
  actorUserId: string
): Promise<{ success: boolean; item?: DriveItem; error?: string }> {
  const cleanName = newName.trim();
  if (!cleanName) {
    return { success: false, error: "Nama baru tidak boleh kosong." };
  }

  const store = getDriveItemsStore();
  const item = store.find((i) => i.id === id && !i.isArchived);
  if (!item) {
    return { success: false, error: "Item tidak ditemukan." };
  }

  const oldName = item.name;
  item.name = cleanName;
  item.updatedAt = new Date().toISOString();
  persistDriveItems();

  logActivity({
    category: "PROJECT",
    action: "DRIVE_ITEM_RENAMED",
    actorId: actorUserId,
    targetId: item.id,
    targetType: item.type === "FOLDER" ? "DRIVE_FOLDER" : "DRIVE_FILE",
    metadata: { oldName, newName: cleanName },
  });

  return { success: true, item };
}

/**
 * Memindahkan file atau folder ke folder tujuan
 */
export async function moveDriveItem(
  id: string,
  targetParentId: string | null,
  actorUserId: string
): Promise<{ success: boolean; item?: DriveItem; error?: string }> {
  if (id === targetParentId) {
    return { success: false, error: "Tidak dapat memindahkan folder ke dalam dirinya sendiri." };
  }

  const store = getDriveItemsStore();
  const item = store.find((i) => i.id === id && !i.isArchived);
  if (!item) {
    return { success: false, error: "Item tidak ditemukan." };
  }

  // Jika item adalah folder, pastikan targetParentId bukan salah satu subfolder dari item tersebut (mencegah siklus)
  if (item.type === "FOLDER" && targetParentId) {
    let checkId: string | null = targetParentId;
    const visited = new Set<string>();
    while (checkId && !visited.has(checkId)) {
      if (checkId === item.id) {
        return {
          success: false,
          error: "Tidak dapat memindahkan folder induk ke dalam subfoldernya sendiri.",
        };
      }
      visited.add(checkId);
      const parentFolder = store.find((i) => i.id === checkId && i.type === "FOLDER");
      checkId = parentFolder ? parentFolder.parentId : null;
    }
  }

  item.parentId = targetParentId;
  item.updatedAt = new Date().toISOString();
  persistDriveItems();

  logActivity({
    category: "PROJECT",
    action: "DRIVE_ITEM_MOVED",
    actorId: actorUserId,
    targetId: item.id,
    targetType: item.type === "FOLDER" ? "DRIVE_FOLDER" : "DRIVE_FILE",
    metadata: { targetParentId },
  });

  return { success: true, item };
}

/**
 * Toggle Status Bintang / Favorit
 */
export async function toggleStarDriveItem(
  id: string,
  actorUserId: string
): Promise<{ success: boolean; isStarred: boolean }> {
  const store = getDriveItemsStore();
  const item = store.find((i) => i.id === id && !i.isArchived);
  if (!item) {
    return { success: false, isStarred: false };
  }

  item.isStarred = !item.isStarred;
  item.updatedAt = new Date().toISOString();
  persistDriveItems();

  return { success: true, isStarred: item.isStarred };
}

/**
 * Menghapus file atau folder secara rekursif
 */
export async function deleteDriveItem(
  id: string,
  actor: { id: string; role: string }
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const store = getDriveItemsStore();
  const targetItem = store.find((i) => i.id === id && !i.isArchived);
  if (!targetItem) {
    return { success: false, deletedCount: 0, error: "Item tidak ditemukan." };
  }

  // Otorisasi: Non-Owner hanya dapat menghapus item yang mereka upload sendiri
  if (actor.role !== "OWNER" && targetItem.uploadedByUserId !== actor.id) {
    return {
      success: false,
      deletedCount: 0,
      error: "Akses ditolak: Anda hanya dapat menghapus file atau folder yang Anda buat sendiri.",
    };
  }

  const idsToDelete = new Set<string>([id]);

  // Jika folder, kumpulkan semua item anak secara rekursif
  if (targetItem.type === "FOLDER") {
    let toScan = [id];
    while (toScan.length > 0) {
      const parentId = toScan.pop();
      const children = store.filter((i) => i.parentId === parentId && !i.isArchived);
      for (const child of children) {
        idsToDelete.add(child.id);
        if (child.type === "FOLDER") {
          toScan.push(child.id);
        }
      }
    }
  }

  // Hapus file fisik dari direktori storage jika tipe FILE
  for (const delId of Array.from(idsToDelete)) {
    const item = store.find((i) => i.id === delId);
    if (item && item.type === "FILE" && item.storagePath) {
      const fullPath = path.join(DRIVE_STORAGE_DIR, item.storagePath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error(`[DRIVE] Gagal menghapus file fisik ${fullPath}:`, err);
      }
    }
  }

  // Hapus dari metadata
  const deletedCount = idsToDelete.size;
  const filtered = store.filter((i) => !idsToDelete.has(i.id));
  store.length = 0;
  store.push(...filtered);
  persistDriveItems();

  logActivity({
    category: "PROJECT",
    action: "DRIVE_ITEM_DELETED",
    actorId: actor.id,
    targetId: id,
    targetType: targetItem.type === "FOLDER" ? "DRIVE_FOLDER" : "DRIVE_FILE",
    metadata: {
      deletedCount,
      name: targetItem.name,
      deletedByRole: actor.role,
    },
  });

  return { success: true, deletedCount };
}

/**
 * Statistik & Kapasitas Shared Drive HQ
 */
export async function getDriveStats(): Promise<DriveStats> {
  const store = getDriveItemsStore();
  const activeItems = store.filter((i) => !i.isArchived);

  const files = activeItems.filter((i) => i.type === "FILE");
  const folders = activeItems.filter((i) => i.type === "FOLDER");

  let totalBytes = 0;
  const breakdown = {
    documents: 0,
    images: 0,
    media: 0,
    archives: 0,
    others: 0,
  };

  for (const file of files) {
    totalBytes += file.size || 0;
    const ext = (file.extension || "").toLowerCase();
    if (["pdf", "doc", "docx", "txt", "md", "rtf", "odt"].includes(ext)) {
      breakdown.documents += file.size;
    } else if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) {
      breakdown.images += file.size;
    } else if (["mp4", "mp3", "mov", "wav", "ogg"].includes(ext)) {
      breakdown.media += file.size;
    } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      breakdown.archives += file.size;
    } else {
      breakdown.others += file.size;
    }
  }

  // Default quota 100 GB (disesuaikan untuk VPS Ubuntu)
  const quotaBytes = 100 * 1024 * 1024 * 1024;

  return {
    totalStorageBytes: totalBytes,
    totalFiles: files.length,
    totalFolders: folders.length,
    storageLimitBytes: quotaBytes,
    categoryBreakdown: breakdown,
  };
}

/**
 * Mendapatkan path file fisik untuk download atau preview inline
 */
export function getDriveItemFilePath(
  id: string
): { filePath: string; item: DriveItem } | null {
  const item = getDriveItemById(id);
  if (!item || item.type !== "FILE" || !item.storagePath) {
    return null;
  }

  const safeStoragePath = path.basename(item.storagePath);
  const fullPath = path.join(DRIVE_STORAGE_DIR, safeStoragePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return { filePath: fullPath, item };
}
