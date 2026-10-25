"use server";

import { revalidatePath } from "next/cache";
import { getSessionCookie } from "../auth/session";
import {
  addProjectExternalLink,
  createProject,
  createTask,
  createTeamBoardItem,
  getAllProjects,
  getAllTasks,
  getProjectById,
  getTeamBoardItems,
  sendProjectChatMessage,
  updateProjectProgress,
  updateProjectStatus,
  updateTaskStatus,
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
  content: string
) {
  const session = await getSessionCookie();
  if (!session) return { success: false, error: "Sesi telah berakhir." };

  await createTeamBoardItem(
    category,
    title,
    content,
    session.id,
    session.fullName
  );

  revalidatePath("/team-board");
  return { success: true };
}
