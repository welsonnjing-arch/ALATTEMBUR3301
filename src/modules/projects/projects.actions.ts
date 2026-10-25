"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  addProjectExternalLink,
  createProject,
  createTask,
  createTeamBoardItem,
  deleteTeamBoardItem,
  getAllProjects,
  getAllTasks,
  getProjectById,
  getTeamBoardItems,
  sendProjectChatMessage,
  updateProjectProgress,
  updateProjectStatus,
  updateTaskStatus,
  updateTeamBoardItem,
  updateTeamBoardItemPosition,
  getCanvasViewport,
  updateCanvasViewport,
} from "./projects.service";
import { CreateProjectInput, CreateTaskInput, ExternalLink, TeamBoardItem } from "./types";
import { ProjectStatus, TaskStatus } from "@/types/enums";

export async function fetchProjectsAction(statusFilter?: ProjectStatus | "ALL") {
  return await getAllProjects(statusFilter);
}

export async function fetchProjectDetailAction(id: string) {
  return await getProjectById(id);
}

export async function createProjectAction(input: CreateProjectInput) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await createProject(input, session.id, session.fullName);
  if (res.success) {
    revalidatePath("/projects");
    revalidatePath("/delivery-workspace");
  }
  return res;
}

export async function updateProjectStatusAction(
  id: string,
  status: ProjectStatus,
  reason?: string
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await updateProjectStatus(id, status, session.id, reason);
  if (res.success) {
    revalidatePath("/projects");
    revalidatePath("/delivery-workspace");
  }
  return res;
}

export async function updateProjectProgressAction(id: string, progress: number) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await updateProjectProgress(id, progress, session.id);
  if (res.success) {
    revalidatePath("/projects");
    revalidatePath("/delivery-workspace");
  }
  return res;
}

export async function addProjectExternalLinkAction(
  projectId: string,
  title: string,
  url: string,
  category: ExternalLink["category"]
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await addProjectExternalLink(
    projectId,
    { title, url, category },
    session.id
  );

  if (res.success) {
    revalidatePath("/projects");
  }
  return res;
}

export async function fetchTasksAction(filter?: {
  projectId?: string;
  picId?: string;
  status?: TaskStatus;
}) {
  return await getAllTasks(filter);
}

export async function createTaskAction(input: CreateTaskInput) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await createTask(input, session.id, session.fullName);
  if (res.success) {
    revalidatePath("/tasks");
    revalidatePath("/delivery-workspace");
  }
  return res;
}

export async function updateTaskStatusAction(
  taskId: string,
  status: TaskStatus,
  blockedReason?: string
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await updateTaskStatus(taskId, status, session.id, blockedReason);
  if (res.success) {
    revalidatePath("/tasks");
    revalidatePath("/delivery-workspace");
  }
  return res;
}

export async function sendProjectChatMessageAction(
  projectId: string,
  text: string
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  const res = await sendProjectChatMessage(
    projectId,
    session.id,
    session.fullName,
    text
  );

  if (res.success) {
    revalidatePath("/projects");
  }
  return res;
}

export async function fetchTeamBoardAction() {
  return await getTeamBoardItems();
}

export async function createTeamBoardItemAction(
  category: TeamBoardItem["category"],
  title: string,
  content: string,
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
) {
  try {
    const session = await getSessionCookie();
    if (!session) return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };

    const newItem = await createTeamBoardItem(
      category,
      title,
      content,
      session.id,
      session.fullName,
      extra
    );

    revalidatePath("/team-board");
    return { success: true, item: newItem };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan item ke team board.";
    return { success: false, error: message };
  }
}

export async function updateTeamBoardItemAction(
  id: string,
  updates: Partial<TeamBoardItem>
) {
  try {
    const session = await getSessionCookie();
    if (!session) return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };

    const res = await updateTeamBoardItem(id, updates);
    if (res.success) {
      revalidatePath("/team-board");
    }
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui item team board.";
    return { success: false, error: message };
  }
}

export async function updateTeamBoardItemPositionAction(
  id: string,
  x: number,
  y: number,
  width?: number,
  height?: number
) {
  try {
    const session = await getSessionCookie();
    if (!session) return { success: false, error: "Sesi telah berakhir." };

    const res = await updateTeamBoardItemPosition(id, x, y, width, height);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memindahkan posisi item.";
    return { success: false, error: message };
  }
}

export async function deleteTeamBoardItemAction(id: string) {
  try {
    const session = await getSessionCookie();
    if (!session) return { success: false, error: "Sesi telah berakhir." };

    const res = await deleteTeamBoardItem(id);
    if (res.success) {
      revalidatePath("/team-board");
    }
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus item.";
    return { success: false, error: message };
  }
}

export async function fetchCanvasViewportAction() {
  return await getCanvasViewport();
}

export async function updateCanvasViewportAction(
  panX: number,
  panY: number,
  zoom: number
) {
  try {
    const session = await getSessionCookie();
    const actorName = session ? session.fullName : undefined;
    return await updateCanvasViewport(panX, panY, zoom, actorName);
  } catch {
    return { success: false };
  }
}
