"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Shield,
  Mail,
  Lock,
  User,
  Key,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { UserRole, UserStatus } from "@/types/roles";
import {
  createTeamMemberAction,
  deleteTeamMemberAction,
  fetchTeamMembersAction,
  updateTeamMemberAction,
} from "@/modules/auth/auth.actions";
import { ModalPortal } from "@/components/common/ModalPortal";
import { formatDateWIB } from "@/lib/date";
import { PendingRegistrationBanner } from "@/components/dashboard/PendingRegistrationBanner";

interface TeamMemberItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  avatarUrl?: string;
  canHandleSales?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function UserManagementTab() {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberItem | null>(null);

  // Form Fields - Create
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("SALES");
  const [createPassword, setCreatePassword] = useState("");
  const [createCanHandleSales, setCreateCanHandleSales] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields - Edit
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("SALES");
  const [editStatus, setEditStatus] = useState<UserStatus>("ACTIVE");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editCanHandleSales, setEditCanHandleSales] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form Fields - Delete
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMembers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchTeamMembersAction();
      setMembers(data as TeamMemberItem[]);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Gagal memuat daftar anggota tim.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleOpenCreate = () => {
    setCreateName("");
    setCreateEmail("");
    setCreateRole("SALES");
    setCreatePassword("");
    setCreateCanHandleSales(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg(null);

    const res = await createTeamMemberAction({
      fullName: createName,
      email: createEmail,
      role: createRole,
      password: createPassword,
      canHandleSales: createRole === "DEVELOPER" ? createCanHandleSales : false,
    });

    setIsCreating(false);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal membuat akun.");
      return;
    }

    setSuccessMsg(`Akun untuk "${createName}" (${createRole}) berhasil dibuat.`);
    setIsCreateOpen(false);
    loadMembers();
  };

  const handleOpenEdit = (m: TeamMemberItem) => {
    setSelectedMember(m);
    setEditName(m.fullName);
    setEditRole(m.role);
    setEditStatus(m.status);
    setEditNewPassword("");
    setEditCanHandleSales(Boolean(m.canHandleSales));
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    if (!selectedMember) return;
    e.preventDefault();
    setIsUpdating(true);
    setErrorMsg(null);

    const res = await updateTeamMemberAction(selectedMember.id, {
      fullName: editName,
      role: editRole,
      status: editStatus,
      password: editNewPassword.trim() || undefined,
      canHandleSales: editRole === "DEVELOPER" ? editCanHandleSales : false,
    });

    setIsUpdating(false);
    if (!res.success) {
      setErrorMsg(res.error || "Gagal memperbarui akun.");
      return;
    }

    setSuccessMsg(`Data akun "${editName}" berhasil diperbarui.`);
    setIsEditOpen(false);
    loadMembers();
  };

  const handleOpenDelete = (m: TeamMemberItem) => {
    setSelectedMember(m);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedMember) return;
    setIsDeleting(true);
    setErrorMsg(null);

    const res = await deleteTeamMemberAction(selectedMember.id);
    setIsDeleting(false);

    if (!res.success) {
      setErrorMsg(res.error || "Gagal menghapus akun.");
      return;
    }

    setSuccessMsg(`Akun "${selectedMember.fullName}" berhasil dihapus.`);
    setIsDeleteOpen(false);
    loadMembers();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return "bg-slate-900 text-white border-slate-800";
      case "SALES":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DEVELOPER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Pending Registration Google Auth Banner */}
      <PendingRegistrationBanner />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            Manajemen Akun Tim & Akses Pengguna
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar akun tim riil Fynux OS yang tersimpan persisten di server VPS (`data/users.json`).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Anggota Tim</span>
        </button>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            <span>Memuat data pengguna...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Belum ada akun tim yang terdaftar. Klik &ldquo;Tambah Anggota Tim&rdquo; untuk mendaftarkan akun baru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email Kantor</th>
                  <th className="py-3 px-4">Peran (Role)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200/80 shadow-2xs">
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (m.fullName || "U").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="font-semibold text-slate-900">{m.fullName}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {m.email}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(
                            m.role
                          )}`}
                        >
                          <Shield className="w-2.5 h-2.5" />
                          {m.role}
                        </span>
                        {m.role === "DEVELOPER" && m.canHandleSales && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            + MARKETING
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {m.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {m.createdAt ? formatDateWIB(m.createdAt) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Akun"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(m)}
                          title="Hapus Akun"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH ANGGOTA TIM */}
      {isCreateOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-ios-scale">
              <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-md text-slate-800">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tambah Akun Tim Baru</h3>
                    <p className="text-[11px] text-slate-500">Buat kredensial login untuk tim HQ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. Budi Pratama"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Kantor</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="e.g. budi@perusahaan.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                  >
                    <option value="SALES">Sales (CRM, Shared WhatsApp, Invoicing Draft)</option>
                    <option value="DEVELOPER">Developer (Delivery Workspace, Task Execution)</option>
                    <option value="OWNER">Owner (Akses Penuh Seluruh Modul)</option>
                  </select>
                </div>

                {createRole === "DEVELOPER" && (
                  <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 space-y-1 animate-ios-fade">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createCanHandleSales}
                        onChange={(e) => setCreateCanHandleSales(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>Bertindak Sebagai Marketing / Sales</span>
                          <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                            Hybrid
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          Developer ini otomatis dimasukkan ke dalam pembagian prospek CRM (Round-Robin) saat impor data dan dapat mengelola leads penjualan.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi Awal (Min. 6 Karakter)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Kata sandi aman"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md flex items-center gap-2 disabled:opacity-60"
                  >
                    {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Simpan Akun</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 2: EDIT ANGGOTA TIM */}
      {isEditOpen && selectedMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-ios-scale">
              <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-md text-slate-800">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Perbarui Akun</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{selectedMember.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                    >
                      <option value="SALES">Sales</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                    >
                      <option value="ACTIVE">Aktif (Dapat Login)</option>
                      <option value="INACTIVE">Non-Aktif (Blokir Akses)</option>
                    </select>
                  </div>
                </div>

                {editRole === "DEVELOPER" && (
                  <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 space-y-1 animate-ios-fade">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCanHandleSales}
                        onChange={(e) => setEditCanHandleSales(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>Bertindak Sebagai Marketing / Sales</span>
                          <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                            Hybrid
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          Developer ini otomatis dimasukkan ke dalam pembagian prospek CRM (Round-Robin) saat impor data dan dapat mengelola leads penjualan.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ganti Kata Sandi (Kosongkan jika tidak diubah)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      minLength={6}
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md flex items-center gap-2 disabled:opacity-60"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS */}
      {isDeleteOpen && selectedMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] modal-backdrop-clean flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-ios-fade">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200/90 w-full max-w-sm overflow-hidden animate-ios-scale p-5 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-full">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Akun</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun{" "}
                <strong className="text-slate-900">{selectedMember.fullName}</strong> (
                {selectedMember.email})? Akun ini tidak akan dapat login lagi ke sistem.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteSubmit}
                  className="px-3.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md flex items-center gap-2 disabled:opacity-60"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Hapus Akun</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
