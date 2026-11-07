import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Lock,
  RefreshCw,
  User,
} from 'lucide-react';

interface OfficerLoginViewProps {
  isCheckingAuth: boolean;
  loginEmail: string;
  onLoginEmailChange: (value: string) => void;
  loginPassword: string;
  onLoginPasswordChange: (value: string) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  onLoginSubmit: (e: React.FormEvent) => void;
  onBackToHome: () => void;
}

export const OfficerLoginView: React.FC<OfficerLoginViewProps> = ({
  isCheckingAuth,
  loginEmail,
  onLoginEmailChange,
  loginPassword,
  onLoginPasswordChange,
  loginError,
  isLoggingIn,
  onLoginSubmit,
  onBackToHome,
}) => {
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="p-8 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#2E6496] animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-[#1E293B]">
            Memeriksa sesi petugas Dinas Pendidikan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#1E293B] cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#2E6496]" />
            <span>Kembali ke Pencarian Sekolah</span>
          </button>

          <img
            src="/logo-daradik.png"
            alt="Logo DARADIK"
            className="h-8 w-auto mx-auto select-none"
          />
          <h1 className="font-sturdy-heading text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight">
            Portal Administrator Dinas Pendidikan
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
            Masuk dengan akun administrator untuk memeriksa dan mengelola laporan pengaduan BOSP.
          </p>
        </div>

        <form
          onSubmit={onLoginSubmit}
          className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5"
        >
          {loginError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-semibold flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="officer-email"
              className="block text-xs font-bold text-[#1E293B]"
            >
              Username / Email Administrator
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="officer-email"
                type="text"
                autoComplete="username"
                required
                value={loginEmail}
                onChange={(e) => onLoginEmailChange(e.target.value)}
                placeholder="admin"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="officer-password"
              className="block text-xs font-bold text-[#1E293B]"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="officer-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => onLoginPasswordChange(e.target.value)}
                placeholder="••••••"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-xs sm:text-sm text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoggingIn ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <span>Masuk ke Dashboard</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-[#475569] text-center leading-relaxed">
          Halaman ini khusus untuk aparatur pengawasan Dinas Pendidikan dan Inspektorat.
        </p>
      </div>
    </div>
  );
};
