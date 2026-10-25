"use client";

import { useState } from "react";
import { Lock, Mail, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { loginAction } from "@/modules/auth/auth.actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await loginAction(null, formData);
      if (res && !res.success) {
        setError(res.error || "Gagal masuk ke sistem.");
        setIsLoading(false);
      }
    } catch {
      // Next.js redirect melemparkan exception yang sengaja ditangkap oleh router Next.js
    }
  };

  const handleQuickLogin = (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 mx-auto flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
          F
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          FYNUX OS
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Internal Business Operating System — Fynux Digital Solutions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-300"
              >
                Email Perusahaan
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
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
                  placeholder="faiz@fynux.co"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-300"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  "Memverifikasi Sesi..."
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Switcher untuk Development & Testing Role */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Pilih Akun Cepat (Dev Mode)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("faiz@fynux.co")}
                className="p-2 rounded bg-slate-700/60 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition-colors text-center border border-slate-600/50"
              >
                <div className="text-purple-400 font-bold">Owner</div>
                <div className="text-[9px] text-slate-400 truncate">faiz@fynux.co</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("sales@fynux.co")}
                className="p-2 rounded bg-slate-700/60 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition-colors text-center border border-slate-600/50"
              >
                <div className="text-amber-400 font-bold">Sales</div>
                <div className="text-[9px] text-slate-400 truncate">sales@fynux.co</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("dev@fynux.co")}
                className="p-2 rounded bg-slate-700/60 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition-colors text-center border border-slate-600/50"
              >
                <div className="text-blue-400 font-bold">Developer</div>
                <div className="text-[9px] text-slate-400 truncate">dev@fynux.co</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
