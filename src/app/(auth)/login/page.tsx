"use client";

import { useEffect, useState } from "react";
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  User,
  ShieldCheck,
} from "lucide-react";
import {
  checkSystemUsersStatusAction,
  loginAction,
  registerInitialOwnerAction,
} from "@/modules/auth/auth.actions";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status apakah sistem baru pertama kali dijalankan (belum ada akun Owner)
  const [hasOwner, setHasOwner] = useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await checkSystemUsersStatusAction();
        if (isMounted) {
          setHasOwner(res.hasOwner);
        }
      } catch {
        if (isMounted) {
          setHasOwner(true); // Default ke form login biasa jika gagal mengecek
        }
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await loginAction(null, formData);
      if (res && !res.success) {
        setErrorMessage(res.error || "Gagal masuk ke sistem.");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const isRedirect =
        (err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT") ||
        (err as Error)?.message === "NEXT_REDIRECT";
      if (!isRedirect) {
        setErrorMessage("Terjadi kendala saat menghubungi server. Silakan coba lagi.");
        setIsSubmitting(false);
      }
    }
  };

  const handleRegisterOwnerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await registerInitialOwnerAction(null, formData);
      if (res && !res.success) {
        setErrorMessage(res.error || "Gagal membuat akun Owner.");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const isRedirect =
        (err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT") ||
        (err as Error)?.message === "NEXT_REDIRECT";
      if (!isRedirect) {
        setErrorMessage("Terjadi kendala saat menghubungi server. Silakan periksa kembali.");
        setIsSubmitting(false);
      }
    }
  };

  const isInitialSetup = hasOwner === false;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 relative selection:bg-blue-100 selection:text-blue-950">
      <div className="w-full sm:max-w-md">
        {/* Main Authentication Card */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 sm:p-8 shadow-xs animate-ios-fade">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/logo-fynux.png"
                alt="Fynux"
                width={371}
                height={101}
                priority
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isInitialSetup ? "Buat Akun Owner Utama" : "Masuk ke Sistem"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
              {isInitialSetup
                ? "Sistem siap digunakan. Daftarkan akun Owner pertama untuk mengelola seluruh operasional."
                : "Internal Business Operating System — Fynux Digital Solutions"}
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-ios-fade"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Initial Setup Notification */}
          {isInitialSetup && !isLoadingStatus && (
            <div className="mb-5 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 animate-ios-fade">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
              <div className="leading-relaxed font-medium">
                Sistem mendeteksi instalasi bersih tanpa akun dummy. Buat akun Owner Anda di bawah ini untuk memulai.
              </div>
            </div>
          )}

          {isLoadingStatus ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Menyiapkan autentikasi...</span>
            </div>
          ) : isInitialSetup ? (
            /* FORM SETUP OWNER PERTAMA */
            <form onSubmit={handleRegisterOwnerSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nama Lengkap Owner
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email Kantor / Resmi
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@domain-anda.com"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Kata Sandi Utama (Min. 6 Karakter)
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Buat kata sandi kuat"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-xs active-press"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat Akun Owner...</span>
                    </>
                  ) : (
                    <>
                      <span>Buat Akun Owner & Masuk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* FORM LOGIN NORMAL */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email Perusahaan
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@fynux.co"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-xs active-press"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Sesi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Minimal Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Fynux Digital Solutions. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}
