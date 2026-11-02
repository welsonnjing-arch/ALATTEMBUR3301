import fs from "node:fs";
import path from "node:path";
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

const INITIAL_PROJECTS_DATA: Project[] = [];

const INITIAL_TASKS_DATA: Task[] = [];

const INITIAL_TEAM_BOARD_DATA: TeamBoardItem[] = [];

const INITIAL_CANVAS_VIEWPORT: CanvasViewportState = {
  panX: 40,
  panY: 40,
  zoom: 1.0,
  updatedBy: "Faiz Aditama (Owner)",
  updatedAt: new Date().toISOString(),
};

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

function ensureStorageDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface ProjectsGlobalStore {
  projectsData?: Project[];
  tasksData?: Task[];
  teamBoardData?: TeamBoardItem[];
  sharedCanvasViewportData?: CanvasViewportState;
}

const projectsGlobal = globalThis as unknown as ProjectsGlobalStore;

function loadPersistedProjects(): Project[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[PROJECTS_PERSISTENCE] Gagal membaca projects.json:", err);
  }

  try {
    fs.writeFileSync(
      PROJECTS_FILE,
      JSON.stringify(INITIAL_PROJECTS_DATA, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("[PROJECTS_PERSISTENCE] Gagal inisialisasi projects.json:", err);
  }

  return [...INITIAL_PROJECTS_DATA];
}

export function getProjectsStore(): Project[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        if (!projectsGlobal.projectsData) {
          projectsGlobal.projectsData = parsed;
        } else {
          projectsGlobal.projectsData.length = 0;
          projectsGlobal.projectsData.push(...parsed);
        }
        return projectsGlobal.projectsData;
      }
    }
  } catch (err) {
    console.error("[PROJECTS_PERSISTENCE] Gagal membaca projects.json:", err);
  }

  if (!projectsGlobal.projectsData) {
    projectsGlobal.projectsData = loadPersistedProjects();
  }
  return projectsGlobal.projectsData;
}

export function persistProjects(dataToPersist?: Project[]): void {
  ensureStorageDir();
  try {
    const data = dataToPersist || projectsGlobal.projectsData || getProjectsStore();
    if (data && Array.isArray(data)) {
      if (!projectsGlobal.projectsData || projectsGlobal.projectsData !== data) {
        projectsGlobal.projectsData = data;
      }
      fs.writeFileSync(
        PROJECTS_FILE,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    }
  } catch (err) {
    console.error("[PROJECTS_PERSISTENCE] Gagal menyimpan projects.json:", err);
  }
}

function loadPersistedTasks(): Task[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const content = fs.readFileSync(TASKS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[TASKS_PERSISTENCE] Gagal membaca tasks.json:", err);
  }

  try {
    fs.writeFileSync(
      TASKS_FILE,
      JSON.stringify(INITIAL_TASKS_DATA, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("[TASKS_PERSISTENCE] Gagal inisialisasi tasks.json:", err);
  }

  return [...INITIAL_TASKS_DATA];
}

export function getTasksStore(): Task[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const content = fs.readFileSync(TASKS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        if (!projectsGlobal.tasksData) {
          projectsGlobal.tasksData = parsed;
        } else {
          projectsGlobal.tasksData.length = 0;
          projectsGlobal.tasksData.push(...parsed);
        }
        return projectsGlobal.tasksData;
      }
    }
  } catch (err) {
    console.error("[TASKS_PERSISTENCE] Gagal membaca tasks.json:", err);
  }

  if (!projectsGlobal.tasksData) {
    projectsGlobal.tasksData = loadPersistedTasks();
  }
  return projectsGlobal.tasksData;
}

export function persistTasks(dataToPersist?: Task[]): void {
  ensureStorageDir();
  try {
    const data = dataToPersist || projectsGlobal.tasksData || getTasksStore();
    if (data && Array.isArray(data)) {
      if (!projectsGlobal.tasksData || projectsGlobal.tasksData !== data) {
        projectsGlobal.tasksData = data;
      }
      fs.writeFileSync(
        TASKS_FILE,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    }
  } catch (err) {
    console.error("[TASKS_PERSISTENCE] Gagal menyimpan tasks.json:", err);
  }
}

if (!projectsGlobal.projectsData) {
  projectsGlobal.projectsData = getProjectsStore();
}
if (!projectsGlobal.tasksData) {
  projectsGlobal.tasksData = getTasksStore();
}
if (!projectsGlobal.teamBoardData || projectsGlobal.teamBoardData.length === 0) {
  projectsGlobal.teamBoardData = [...INITIAL_TEAM_BOARD_DATA];
}
if (!projectsGlobal.sharedCanvasViewportData) {
  projectsGlobal.sharedCanvasViewportData = { ...INITIAL_CANVAS_VIEWPORT };
}

// Exported aliases for compatibility
export const projectsData = projectsGlobal.projectsData;
export const tasksData = projectsGlobal.tasksData;
export const teamBoardData = projectsGlobal.teamBoardData;

// Methods
export async function getAllProjects(filterStatus?: ProjectStatus | "ALL"): Promise<Project[]> {
  const store = getProjectsStore();
  if (!filterStatus || filterStatus === "ALL") {
    return [...store];
  }
  return store.filter((p) => p.status === filterStatus);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const store = getProjectsStore();
  const p = store.find((item) => item.id === id);
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

  const store = getProjectsStore();

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

  store.unshift(newProject);
  persistProjects(store);

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
  const store = getProjectsStore();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false, error: "Proyek tidak ditemukan." };

  store[idx].status = status;
  store[idx].updatedAt = new Date().toISOString();

  if (status === "ON_HOLD") {
    store[idx].onHoldReason = reason || "Ditunda sementara";
    store[idx].onHoldDate = new Date().toISOString();
  } else if (status === "CANCELLED") {
    store[idx].cancelledReason = reason || "Dibatalkan oleh Owner";
  } else if (status === "COMPLETED") {
    store[idx].progressPercent = 100;
  }

  persistProjects(store);

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
  const store = getProjectsStore();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) return { success: false };

  store[idx].progressPercent = Math.min(100, Math.max(0, progress));
  store[idx].updatedAt = new Date().toISOString();

  if (progress === 100) {
    store[idx].status = "COMPLETED";
  }

  persistProjects(store);

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
  const store = getProjectsStore();
  const idx = store.findIndex((p) => p.id === projectId);
  if (idx === -1) return { success: false };

  store[idx].externalLinks.push({
    id: `link-${Date.now()}`,
    ...link,
  });

  persistProjects(store);

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
  const store = getTasksStore();
  let list = [...store];

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

  const pStore = getProjectsStore();
  const proj = input.projectId
    ? pStore.find((p) => p.id === input.projectId)
    : undefined;

  const newTask: Task = {
    id: `task-${Date.now()}`,
    projectId: input.projectId,
    projectName: proj ? proj.name : undefined,
    title: input.title.trim(),
    description: input.description?.trim(),
    primaryPicId: input.primaryPicId || actorUserId,
    primaryPicName:
      input.primaryPicId === actorUserId
        ? actorName
        : (input as { primaryPicName?: string }).primaryPicName || actorName || "PIC Tim",
    collaboratorIds: input.collaboratorIds || [],
    status: "TODO",
    priority: input.priority || "MEDIUM",
    deadline: input.deadline,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tStore = getTasksStore();
  tStore.unshift(newTask);
  persistTasks(tStore);

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
  const store = getTasksStore();
  const idx = store.findIndex((t) => t.id === taskId);
  if (idx === -1) return { success: false, error: "Task tidak ditemukan." };

  store[idx].status = status;
  store[idx].updatedAt = new Date().toISOString();

  if (status === "BLOCKED") {
    store[idx].blockedReason = blockedReason || "Terkendala data/klien";
  } else if (status === "DONE") {
    store[idx].blockedReason = undefined;
  }

  persistTasks(store);

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
  const store = getProjectsStore();
  const idx = store.findIndex((p) => p.id === projectId);
  if (idx === -1) return { success: false };

  const newChat: ProjectChatMessage = {
    id: `pchat-${Date.now()}`,
    projectId,
    senderUserId: senderId,
    senderName,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  if (!store[idx].chatMessages) {
    store[idx].chatMessages = [];
  }
  store[idx].chatMessages.push(newChat);
  persistProjects(store);

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

export function resetProjectsAndTasksForTesting(): void {
  const pStore = getProjectsStore();
  pStore.length = 0;
  persistProjects(pStore);

  const tStore = getTasksStore();
  tStore.length = 0;
  persistTasks(tStore);
}
