import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectProgress,
  updateProjectStatus,
  createTask,
  getAllTasks,
  updateTaskStatus,
  persistProjects,
  persistTasks,
} from "../src/modules/projects/projects.service";

describe("Projects & Delivery Workspace Persistence Engine", () => {
  const DATA_DIR = path.join(process.cwd(), "data");
  const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
  const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

  let backupProjects: string | null = null;
  let backupTasks: string | null = null;

  before(() => {
    if (fs.existsSync(PROJECTS_FILE)) {
      backupProjects = fs.readFileSync(PROJECTS_FILE, "utf-8");
    }
    if (fs.existsSync(TASKS_FILE)) {
      backupTasks = fs.readFileSync(TASKS_FILE, "utf-8");
    }
  });

  after(() => {
    if (backupProjects !== null) {
      fs.writeFileSync(PROJECTS_FILE, backupProjects, "utf-8");
      try {
        const parsed = JSON.parse(backupProjects);
        persistProjects(parsed);
      } catch {}
    }
    if (backupTasks !== null) {
      fs.writeFileSync(TASKS_FILE, backupTasks, "utf-8");
      try {
        const parsed = JSON.parse(backupTasks);
        persistTasks(parsed);
      } catch {}
    }
  });

  test("creates a new project and persists immediately to data/projects.json on disk", async () => {
    const res = await createProject(
      {
        name: "Sistem Delivery Uji Coba Persistensi",
        clientId: "client-pers-01",
        clientName: "PT Klien Uji Persistensi",
        targetDeadline: "2026-12-01",
        scopeDescription: "Deskripsi ruang lingkup uji coba penyimpanan.",
        assignedMemberIds: ["user-1"],
      },
      "user-1",
      "Faiz Aditama"
    );

    assert.equal(res.success, true);
    assert.ok(res.project);
    const createdId = res.project.id;

    // 1. Verifikasi dari getAllProjects()
    const all = await getAllProjects();
    const foundInMem = all.find((p) => p.id === createdId);
    assert.ok(foundInMem);
    assert.equal(foundInMem.name, "Sistem Delivery Uji Coba Persistensi");

    // 2. Verifikasi langsung dari file disk data/projects.json
    assert.ok(fs.existsSync(PROJECTS_FILE));
    const diskContent = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf-8"));
    assert.ok(Array.isArray(diskContent));
    const foundOnDisk = diskContent.find((p: any) => p.id === createdId);
    assert.ok(foundOnDisk, "Data proyek baru harus tersimpan langsung di file disk projects.json");
    assert.equal(foundOnDisk.name, "Sistem Delivery Uji Coba Persistensi");
    assert.equal(foundOnDisk.status, "ACTIVE");
  });

  test("updates project progress and status with instant disk persistence", async () => {
    const all = await getAllProjects();
    const proj = all[0];
    assert.ok(proj);

    // Update progress
    const progRes = await updateProjectProgress(proj.id, 75, "user-1");
    assert.equal(progRes.success, true);

    const updated = await getProjectById(proj.id);
    assert.equal(updated?.progressPercent, 75);

    // Verifikasi disk
    const diskContent = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf-8"));
    const diskProj = diskContent.find((p: any) => p.id === proj.id);
    assert.equal(diskProj.progressPercent, 75);

    // Update status to ON_HOLD
    const statusRes = await updateProjectStatus(proj.id, "ON_HOLD", "user-1", "Menunggu konfirmasi materi");
    assert.equal(statusRes.success, true);

    const diskContentAfter = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf-8"));
    const diskProjAfter = diskContentAfter.find((p: any) => p.id === proj.id);
    assert.equal(diskProjAfter.status, "ON_HOLD");
    assert.equal(diskProjAfter.onHoldReason, "Menunggu konfirmasi materi");
  });

  test("creates tasks and persists immediately to data/tasks.json on disk", async () => {
    const taskRes = await createTask(
      {
        title: "Setup CI/CD Pipeline Otomatis",
        description: "Konfigurasi GitHub Actions & VPS webhook",
        primaryPicId: "dev-01",
        priority: "HIGH",
        deadline: "2026-11-10",
      },
      "dev-01",
      "Developer Lead"
    );

    assert.equal(taskRes.success, true);
    assert.ok(taskRes.task);

    // Verifikasi di getAllTasks
    const allTasks = await getAllTasks();
    const foundTask = allTasks.find((t) => t.id === taskRes.task?.id);
    assert.ok(foundTask);

    // Verifikasi di disk
    const diskTasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf-8"));
    const foundDiskTask = diskTasks.find((t: any) => t.id === taskRes.task?.id);
    assert.ok(foundDiskTask, "Task baru harus tersimpan langsung di file disk tasks.json");
    assert.equal(foundDiskTask.title, "Setup CI/CD Pipeline Otomatis");
  });
});
