import { ProjectStatus, TaskPriority, TaskStatus } from "@/types/enums";

export interface ExternalLink {
  id: string;
  title: string;
  url: string; // Misal Google Drive, Figma, GitHub
  category: "DOCUMENT" | "DESIGN" | "REPOSITORY" | "OTHER";
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  dealId?: string;
  status: ProjectStatus;
  progressPercent: number; // 0 - 100
  scopeDescription: string;
  startDate?: string;
  deadline?: string;
  onHoldReason?: string;
  cancelledReason?: string;
  externalLinks: ExternalLink[];
  assignedMemberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  primaryPicId: string; // Tepat 1 PIC utama yang bertanggung jawab
  collaboratorIds: string[]; // 0 atau lebih kolaborator
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  blockedReason?: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}
