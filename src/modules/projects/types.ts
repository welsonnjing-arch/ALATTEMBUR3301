import { ProjectStatus, TaskPriority, TaskStatus } from "@/types/enums";

export interface ExternalLink {
  id: string;
  title: string;
  url: string; // Misal Google Drive, Figma, GitHub
  category: "DOCUMENT" | "DESIGN" | "REPOSITORY" | "OTHER";
}

export interface ProjectChatMessage {
  id: string;
  projectId: string;
  senderUserId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  dealId?: string;
  status: ProjectStatus;
  progressPercent: number; // 0 - 100
  scopeDescription: string;
  startDate?: string;
  deadline?: string;
  onHoldReason?: string;
  onHoldDate?: string;
  cancelledReason?: string;
  externalLinks: ExternalLink[];
  assignedMemberIds: string[];
  assignedMemberNames: string[];
  chatMessages?: ProjectChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  primaryPicId: string; // Tepat 1 PIC utama yang bertanggung jawab
  primaryPicName: string;
  collaboratorIds: string[]; // 0 atau lebih kolaborator
  collaboratorNames?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  blockedReason?: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardAttachment {
  id: string;
  name: string;
  size?: string;
  type: string; // "image" | "pdf" | "document"
  url: string; // Data URL or external link
}

export interface TeamBoardItem {
  id: string;
  category: "ANNOUNCEMENT" | "SOP" | "TARGET" | "IDEA";
  title: string;
  subtitle?: string;
  content: string;
  authorId: string;
  authorName: string;
  x?: number; // Posisi horizontal di canvas
  y?: number; // Posisi vertikal di canvas
  width?: number; // Lebar kustom kotak (px)
  height?: number; // Tinggi kustom kotak (px)
  colorTheme?: "slate" | "indigo" | "emerald" | "amber" | "rose" | "purple";
  attachments?: BoardAttachment[];
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  clientId: string;
  clientName: string;
  dealId?: string;
  scopeDescription: string;
  targetDeadline?: string;
  assignedMemberIds: string[];
  externalLinks?: Array<{ title: string; url: string; category: ExternalLink["category"] }>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  primaryPicId: string;
  collaboratorIds?: string[];
  priority?: TaskPriority;
  deadline?: string;
}
