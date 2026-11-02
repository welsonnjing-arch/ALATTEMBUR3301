"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User,
  Lock,
  Upload,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Shield,
} from "lucide-react";
import { ModalPortal } from "@/components/common/ModalPortal";
import { UserSessionData } from "@/modules/auth/types";
import {
  changePasswordAction,
  updateAvatarAction,
} from "@/modules/auth/user-profile.actions";
import { useToast } from "@/components/common/Toast";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: UserSessionData | null;
  onSessionUpdated?: (newSession: Partial<UserSessionData>) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
}: UserProfileModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    session?.avatarUrl || null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Sinkronisasi avatarPreview saat session.avatarUrl diperbarui
  useEffect(() => {
    setAvatarPreview(session?.avatarUrl || null);
    setAvatarError(false);
  }, [session?.avatarUrl]);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler kompresi dan upload avatar menggunakan Canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File yang dipilih harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal adalah 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        // Resize canvas to max 256x256 untuk performa dan bobot ringan
        const canvas = document.createElement("canvas");
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/webp", 0.88);
          setAvatarPreview(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setIsUploadingAvatar(true);
    try {
      const res = await updateAvatarAction({ avatarUrl: avatarPreview });
      if (res.success) {
        toast.success("Foto profil berhasil diperbarui.");
        const resolvedUrl = res.avatarUrl || avatarPreview;
        setAvatarPreview(resolvedUrl);
        if (onSessionUpdated) {
          onSessionUpdated({ avatarUrl: resolvedUrl });
        }
      } else {
        toast.error(res.error || "Gagal memperbarui foto profil.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan foto profil.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const res = await updateAvatarAction({ avatarUrl: "" });
      if (res.success) {
        setAvatarPreview(null);
        toast.success("Foto profil telah dihapus.");
        if (onSessionUpdated) {
          onSessionUpdated({ avatarUrl: undefined });
        }
      } else {
        toast.error(res.error || "Gagal menghapus foto profil.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.trim().length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePasswordAction({
        currentPassword: currentPassword || undefined,
        newPassword: newPassword.trim(),
      });

      if (res.success) {
        toast.success(res.message || "Kata sandi berhasil diubah.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res.error || "Gagal mengubah kata sandi.");
      }
    } catch {
      setPasswordError("Terjadi kesalahan koneksi saat memperbarui kata sandi.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userName = session?.fullName || "Pengguna Fynux";
  const userEmail = session?.email || "user@fynux.co";
  const userRole = session?.role || "USER";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-ios-fade">
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header Modal */}
          <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <User className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Profil & Keamanan Akun
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola foto profil dan kata sandi akun Anda
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
            {/* Bagian 1: Foto Profil & Info Akun */}
            <div className="p-4 rounded-lg bg-slate-50/90 border border-slate-200/80 space-y-4">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Foto Profil Pengguna</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-900 text-white flex items-center justify-center text-2xl font-bold shadow-xs">
                    {avatarPreview && !avatarError ? (
                      <img
                        src={avatarPreview}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Ganti Foto"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="font-semibold text-slate-900 text-sm">
                    {userName}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    {userEmail}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800 text-[10px] font-semibold border border-blue-200/80">
                      <Shield className="w-3 h-3 text-blue-600" />
                      {userRole}
                    </span>
                  </div>

                  {/* Tombol Aksi Avatar */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-md font-medium text-[11px] flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Pilih Foto</span>
                    </button>

                    {avatarPreview !== (session?.avatarUrl || null) && (
                      <button
                        type="button"
                        onClick={handleSaveAvatar}
                        disabled={isUploadingAvatar}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>Simpan Foto</span>
                      </button>
                    )}

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: Form Ganti Kata Sandi */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Ganti Kata Sandi</span>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs flex items-start gap-2 animate-ios-fade">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Password Saat Ini */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Kata Sandi Saat Ini (Kosongkan jika akun baru)
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini"
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-md bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Kata Sandi Baru (Minimal 6 karakter)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-md bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-md bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tombol Simpan Password */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Perbarui Kata Sandi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
