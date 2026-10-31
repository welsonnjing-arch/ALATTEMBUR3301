export type DriveItemType = "FILE" | "FOLDER";

export interface DriveItem {
  id: string;
  name: string;
  type: DriveItemType;
  parentId: string | null; // null = root drive
  extension?: string; // e.g. "pdf", "png", "docx", "zip"
  mimeType?: string;
  size: number; // in bytes (0 for folder)
  storagePath?: string; // safe storage file path relative to data/drive/storage
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByRole: string;
  isStarred: boolean;
  isArchived?: boolean;
  tags?: string[];
  color?: string; // folder accent color (slate, blue, emerald, amber, rose)
  createdAt: string;
  updatedAt: string;
  itemCount?: number; // child count for folders
}

export interface DriveBreadcrumb {
  id: string | null;
  name: string;
}

export interface DriveStats {
  totalStorageBytes: number;
  totalFiles: number;
  totalFolders: number;
  storageLimitBytes: number;
  categoryBreakdown: {
    documents: number;
    images: number;
    media: number;
    archives: number;
    others: number;
  };
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
  color?: string;
}

export interface UploadFileInput {
  name: string;
  parentId?: string | null;
  size: number;
  mimeType: string;
  extension: string;
  storagePath: string;
  tags?: string[];
}

export type DriveFilterCategory =
  | "ALL"
  | "FOLDER"
  | "DOCUMENT"
  | "IMAGE"
  | "MEDIA"
  | "ARCHIVE"
  | "STARRED";
