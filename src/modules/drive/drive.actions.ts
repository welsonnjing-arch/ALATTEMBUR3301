"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  createFolder,
  deleteDriveItem,
  getDriveBreadcrumbs,
  getDriveItems,
  getDriveStats,
  moveDriveItem,
  renameDriveItem,
  toggleStarDriveItem,
} from "./drive.service";
import { CreateFolderInput, DriveFilterCategory, DriveItem } from "./types";

export async function fetchDriveItemsAction(options?: {
  parentId?: string | null;
  search?: string;
  filter?: DriveFilterCategory;
  isStarred?: boolean;
}): Promise<DriveItem[]> {
  const session = await getSessionCookie();
  if (!session) return [];

  return await getDriveItems(options);
}

export async function fetchDriveBreadcrumbsAction(folderId?: string | null) {
  return getDriveBreadcrumbs(folderId);
}

export async function createFolderAction(input: CreateFolderInput) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };
  }

  const res = await createFolder(input, {
    id: session.id,
    name: session.fullName,
    role: session.role,
  });

  if (res.success) {
    revalidatePath("/drive");
  }
  return res;
}

export async function renameDriveItemAction(id: string, newName: string) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await renameDriveItem(id, newName, session.id);
  if (res.success) {
    revalidatePath("/drive");
  }
  return res;
}

export async function moveDriveItemAction(id: string, targetParentId: string | null) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, error: "Sesi telah berakhir." };
  }

  const res = await moveDriveItem(id, targetParentId, session.id);
  if (res.success) {
    revalidatePath("/drive");
  }
  return res;
}

export async function toggleStarDriveItemAction(id: string) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, isStarred: false };
  }

  const res = await toggleStarDriveItem(id, session.id);
  if (res.success) {
    revalidatePath("/drive");
  }
  return res;
}

export async function deleteDriveItemAction(id: string) {
  const session = await getSessionCookie();
  if (!session) {
    return { success: false, deletedCount: 0, error: "Sesi telah berakhir." };
  }

  const res = await deleteDriveItem(id, {
    id: session.id,
    role: session.role,
  });

  if (res.success) {
    revalidatePath("/drive");
  }
  return res;
}

export async function fetchDriveStatsAction() {
  return await getDriveStats();
}
