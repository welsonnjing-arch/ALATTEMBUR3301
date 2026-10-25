import Link from "next/link";
import { Lock, Mail, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 mx-auto flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
          F
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          FYNUX OS
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Internal Business Operating System — Fynux Digital Solutions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-4">
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
                  placeholder="nama@fynux.id"
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
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Masuk ke Sistem
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700 pt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistem Khusus Internal — Akses Tidak Sah Dilarang</span>
          </div>
        </div>
      </div>
    </div>
  );
}
