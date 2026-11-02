"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  KeyRound,
  CheckCircle2,
  Code2,
  Flame,
  ArrowLeft,
} from "lucide-react";
import {
  checkSystemUsersStatusAction,
  loginAction,
  registerInitialOwnerAction,
} from "@/modules/auth/auth.actions";
import {
  requestRegistrationAction,
  verifyRegistrationNumberAction,
} from "@/modules/auth/registration.actions";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  // Mode: LOGIN vs REGISTER
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Login & Register Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"DEVELOPER" | "SALES">("DEVELOPER");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status awal apakah sistem baru (belum ada akun Owner)
  const [hasOwner, setHasOwner] = useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Google Auth 3-Number Challenge States
  const [registerStep, setRegisterStep] = useState<"FORM" | "VERIFY_NUMBER">("FORM");
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [numberOptions, setNumberOptions] = useState<[number, number, number] | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isVerifyingNumber, setIsVerifyingNumber] = useState(false);

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
    setSuccessMessage(null);
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
    setSuccessMessage(null);
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

  const handleRegisterRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);

    try {
      const res = await requestRegistrationAction(null, formData);
      if (res.success && res.registrationId && res.options) {
        setRegistrationId(res.registrationId);
        setNumberOptions(res.options);
        setRegisterStep("VERIFY_NUMBER");
        setSuccessMessage("Permintaan terkirim. Mintalah nomor otorisasi kepada Owner Anda.");
      } else {
        setErrorMessage(res.error || "Gagal mengajukan pendaftaran akun.");
      }
    } catch {
      setErrorMessage("Terjadi kendala saat menghubungi server pendaftaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberSelect = async (chosen: number) => {
    if (!registrationId || isVerifyingNumber) return;

    setSelectedNumber(chosen);
    setIsVerifyingNumber(true);
    setErrorMessage(null);

    try {
      const res = await verifyRegistrationNumberAction({
        registrationId,
        chosenNumber: chosen,
      });

      if (res.success && res.user) {
        setSuccessMessage(`Otorisasi berhasil! Selamat datang, ${res.user.fullName}.`);
        setTimeout(() => {
          if (res.user?.role === "DEVELOPER") {
            router.push("/delivery-workspace");
          } else {
            router.push("/sales-workspace");
          }
        }, 1200);
      } else {
        setErrorMessage(res.error || "Nomor otorisasi salah. Verifikasi gagal.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat memverifikasi nomor.");
    } finally {
      setIsVerifyingNumber(false);
    }
  };

  const isInitialSetup = hasOwner === false;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 relative selection:bg-blue-100 selection:text-blue-950">
      <div className="w-full sm:max-w-md">
        {/* Main Authentication Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-8 shadow-xs animate-ios-fade">
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
              {isInitialSetup
                ? "Buat Akun Owner Utama"
                : authMode === "LOGIN"
                ? "Masuk ke Sistem"
                : registerStep === "VERIFY_NUMBER"
                ? "Verifikasi Otorisasi Owner"
                : "Daftar Akun Tim Fynux"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
              {isInitialSetup
                ? "Sistem siap digunakan. Daftarkan akun Owner pertama untuk mengelola seluruh operasional."
                : authMode === "LOGIN"
                ? "Internal Business Operating System — Fynux Digital Solutions"
                : registerStep === "VERIFY_NUMBER"
                ? "Otorisasi keamanan 3 nomor ala Google Prompt. Nomor rahasia hanya tersedia di akun Owner."
                : "Daftarkan akun anggota tim baru untuk akses sistem operasional Fynux."}
            </p>
          </div>

          {/* Mode Switcher Tabs (Hanya jika bukan initial setup dan bukan sedang pilih nomor) */}
          {!isInitialSetup && !isLoadingStatus && registerStep === "FORM" && (
            <div className="flex rounded-lg bg-slate-100/90 p-1 mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("LOGIN");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  authMode === "LOGIN"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("REGISTER");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  authMode === "REGISTER"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-ios-fade"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success Alert Box */}
          {successMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-ios-fade"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed font-medium">{successMessage}</span>
            </div>
          )}

          {/* Initial Setup Notification */}
          {isInitialSetup && !isLoadingStatus && (
            <div className="mb-5 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 animate-ios-fade">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
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
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
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
                    placeholder="owner@fynux.co"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
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
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-xs active-press cursor-pointer"
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
          ) : authMode === "LOGIN" ? (
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
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
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
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-xs active-press cursor-pointer"
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
          ) : registerStep === "FORM" ? (
            /* FORM DAFTAR AKUN TIM */
            <form onSubmit={handleRegisterRequestSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="regFullName"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Nama Lengkap Anggota Tim
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="regFullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap Anda"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="regEmail"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@fynux.co"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="regPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Kata Sandi (Min. 6 Karakter)
                </label>
                <div className="relative rounded-md shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="regPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="block w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selector Cards */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Role Tim yang Dituju
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole("DEVELOPER")}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      role === "DEVELOPER"
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Code2
                        className={`w-4 h-4 ${
                          role === "DEVELOPER" ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      {role === "DEVELOPER" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <span className="font-bold text-xs text-slate-900">Developer</span>
                    <span className="text-[10px] text-slate-500">
                      Delivery, Project & CRM
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("SALES")}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      role === "SALES"
                        ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Flame
                        className={`w-4 h-4 ${
                          role === "SALES" ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      {role === "SALES" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <span className="font-bold text-xs text-slate-900">Sales</span>
                    <span className="text-[10px] text-slate-500">
                      Outreach, Deal & CRM
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 transition-colors shadow-xs active-press cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengajukan Permintaan...</span>
                    </>
                  ) : (
                    <>
                      <span>Minta Otorisasi Owner</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* GOOGLE AUTH 3-NUMBER CHALLENGE PROMPT */
            <div className="space-y-6 animate-ios-fade text-center py-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                <KeyRound className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Pilih Nomor yang Ditampilkan di Akun Owner
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Hubungi Owner Anda untuk mendapatkan nomor otorisasi yang benar, lalu ketuk nomor tersebut di bawah ini:
                </p>
              </div>

              {/* 3 Tombol Angka Google Auth */}
              {numberOptions && (
                <div className="grid grid-cols-3 gap-3.5 pt-2">
                  {numberOptions.map((num) => {
                    const isSelected = selectedNumber === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isVerifyingNumber}
                        onClick={() => handleNumberSelect(num)}
                        className={`h-20 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-700 shadow-md scale-98"
                            : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-900 hover:border-blue-400 hover:shadow-sm"
                        } disabled:opacity-50`}
                      >
                        <span className="font-mono text-2xl font-bold tracking-tight">
                          {num}
                        </span>
                        <span
                          className={`text-[9px] font-medium mt-1 ${
                            isSelected ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          Pilih
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {isVerifyingNumber && (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi otorisasi dengan Owner...</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep("FORM");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke formulir pendaftaran</span>
                </button>
              </div>
            </div>
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
