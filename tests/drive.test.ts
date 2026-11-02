import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createFolder,
  deleteDriveItem,
  DRIVE_STORAGE_DIR,
  getDriveBreadcrumbs,
  getDriveItemById,
  getDriveItems,
  getDriveItemsStore,
  getDriveStats,
  moveDriveItem,
  reconcileStorageWithMetadata,
  registerUploadedFile,
  renameDriveItem,
  toggleStarDriveItem,
} from "../src/modules/drive/drive.service";

describe("Shared Drive HQ — Storage & File Management Engine", () => {
  const DATA_DIR = path.join(process.cwd(), "data", "drive");
  const METADATA_FILE = path.join(DATA_DIR, "drive-metadata.json");
  let backupMetadata: string | null = null;

  before(() => {
    if (fs.existsSync(METADATA_FILE)) {
      backupMetadata = fs.readFileSync(METADATA_FILE, "utf-8");
    }
  });

  after(() => {
    if (backupMetadata !== null) {
      fs.writeFileSync(METADATA_FILE, backupMetadata, "utf-8");
    }
  });

  test("loads root drive items and generates breadcrumbs for root", async () => {
    const rootItems = await getDriveItems({ parentId: null });
    assert.ok(Array.isArray(rootItems));
    assert.ok(rootItems.length > 0);

    const breadcrumbs = getDriveBreadcrumbs(null);
    assert.equal(breadcrumbs.length, 1);
    assert.equal(breadcrumbs[0].name, "HQ Drive");
    assert.equal(breadcrumbs[0].id, null);
  });

  test("creates a new folder and prevents duplicate folder names in the same parent", async () => {
    const testActor = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Faiz Aditama (Owner)",
      role: "OWNER",
    };

    const folderName = `Test Folder Unit ${Date.now()}`;
    const createRes = await createFolder(
      {
        name: folderName,
        parentId: null,
        color: "blue",
      },
      testActor
    );

    assert.equal(createRes.success, true);
    assert.ok(createRes.item);
    assert.equal(createRes.item.name, folderName);
    assert.equal(createRes.item.type, "FOLDER");

    // Test duplicate prevention
    const duplicateRes = await createFolder(
      {
        name: folderName,
        parentId: null,
      },
      testActor
    );
    assert.equal(duplicateRes.success, false);
    assert.ok(duplicateRes.error?.includes("sudah ada"));
  });

  test("registers uploaded files and calculates correct storage stats", async () => {
    const testActor = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Faiz Aditama (Owner)",
      role: "OWNER",
    };

    const fileName = "test-doc.pdf";
    const fileSize = 2048; // 2 KB
    const uploadRes = await registerUploadedFile(
      {
        name: fileName,
        parentId: null,
        size: fileSize,
        mimeType: "application/pdf",
        extension: "pdf",
        storagePath: "test-doc.pdf",
        tags: ["Test", "Unit"],
      },
      testActor
    );

    assert.equal(uploadRes.success, true);
    assert.ok(uploadRes.item);
    assert.equal(uploadRes.item.extension, "pdf");
    assert.equal(uploadRes.item.size, fileSize);

    // Verify stats
    const stats = await getDriveStats();
    assert.ok(stats.totalStorageBytes >= fileSize);
    assert.ok(stats.totalFiles >= 1);
    assert.ok(stats.categoryBreakdown.documents >= fileSize);
  });

  test("toggles star and renames drive items", async () => {
    const rootItems = await getDriveItems({ parentId: null });
    const target = rootItems[0];
    assert.ok(target);

    // Toggle star
    const initialStar = target.isStarred;
    const starRes = await toggleStarDriveItem(target.id, "actor-id");
    assert.equal(starRes.success, true);
    assert.equal(starRes.isStarred, !initialStar);

    // Rename
    const newName = `Renamed ${Date.now()}`;
    const renameRes = await renameDriveItem(target.id, newName, "actor-id");
    assert.equal(renameRes.success, true);
    assert.equal(renameRes.item?.name, newName);

    const reloaded = getDriveItemById(target.id);
    assert.equal(reloaded?.name, newName);
  });

  test("moves item and prevents moving a folder into itself", async () => {
    const testActor = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Faiz Aditama (Owner)",
      role: "OWNER",
    };

    const parentRes = await createFolder({ name: `Parent ${Date.now()}` }, testActor);
    const childRes = await createFolder(
      { name: `Child ${Date.now()}`, parentId: parentRes.item!.id },
      testActor
    );

    // Prevent moving parent into itself
    const selfMove = await moveDriveItem(parentRes.item!.id, parentRes.item!.id, testActor.id);
    assert.equal(selfMove.success, false);

    // Prevent moving parent into child subfolder
    const cyclicMove = await moveDriveItem(parentRes.item!.id, childRes.item!.id, testActor.id);
    assert.equal(cyclicMove.success, false);

    // Moving child to root
    const rootMove = await moveDriveItem(childRes.item!.id, null, testActor.id);
    assert.equal(rootMove.success, true);
    assert.equal(rootMove.item?.parentId, null);
  });

  test("deletes folder recursively including child files", async () => {
    const testActor = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Faiz Aditama (Owner)",
      role: "OWNER",
    };

    const folderRes = await createFolder({ name: `Delete Test Folder ${Date.now()}` }, testActor);
    const folderId = folderRes.item!.id;

    // Add child file
    await registerUploadedFile(
      {
        name: "child-delete.txt",
        parentId: folderId,
        size: 512,
        mimeType: "text/plain",
        extension: "txt",
        storagePath: "child-delete.txt",
      },
      testActor
    );

    // Delete folder
    const deleteRes = await deleteDriveItem(folderId, testActor);
    assert.equal(deleteRes.success, true);
    assert.ok(deleteRes.deletedCount >= 2); // Folder + child file

    const checkFolder = getDriveItemById(folderId);
    assert.equal(checkFolder, null);
  });

  test("automatically reconciles orphaned physical files in storage into metadata and prevents duplicate registration", async () => {
    const orphanFile = `test-orphan-${Date.now()}.pdf`;
    const fullOrphanPath = path.join(DRIVE_STORAGE_DIR, orphanFile);
    fs.writeFileSync(fullOrphanPath, "test content for orphan recovery", "utf-8");

    // Simulasikan file yatim yang sudah ada lebih dari 15 detik di disk
    const oldTime = (Date.now() - 20000) / 1000;
    fs.utimesSync(fullOrphanPath, oldTime, oldTime);

    try {
      const store = getDriveItemsStore();
      const recovered = store.find((item) => item.storagePath === orphanFile);
      assert.ok(recovered, "File fisik di storage yang belum terdaftar wajib otomatis dipulihkan");
      assert.equal(recovered.extension, "pdf");
      assert.equal(recovered.type, "FILE");
      assert.equal(recovered.parentId, null);

      // Verifikasi bahwa registerUploadedFile dengan storagePath yang sama tidak membuat entri ganda
      const testActor = {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Faiz Aditama (Owner)",
        role: "OWNER",
      };
      const duplicateRegisterRes = await registerUploadedFile(
        {
          name: "Dokumen Final Reconcile.pdf",
          parentId: null,
          size: 1024,
          mimeType: "application/pdf",
          extension: "pdf",
          storagePath: orphanFile,
        },
        testActor
      );
      assert.equal(duplicateRegisterRes.success, true);

      // Pastikan hanya ada tepat 1 item dengan storagePath ini di seluruh store
      const allMatching = store.filter((item) => item.storagePath === orphanFile);
      assert.equal(allMatching.length, 1, "Wajib tidak ada duplikasi file dengan storagePath yang sama");
      assert.equal(allMatching[0].name, "Dokumen Final Reconcile.pdf");
    } finally {
      if (fs.existsSync(fullOrphanPath)) {
        fs.unlinkSync(fullOrphanPath);
      }
    }
  });
});
