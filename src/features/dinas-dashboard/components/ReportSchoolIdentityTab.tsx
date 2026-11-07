import React from 'react';
import { Info } from 'lucide-react';
import type { OfficerFullReportRow, OfficialSchoolIdentity } from '@/types';
import { formatRupiah } from '@/utils/formatters';

interface ReportSchoolIdentityTabProps {
  report: OfficerFullReportRow;
  schoolIdentity: OfficialSchoolIdentity | null;
}

export const ReportSchoolIdentityTab: React.FC<ReportSchoolIdentityTabProps> = ({
  report,
  schoolIdentity,
}) => {
  return (
    <div className="space-y-5 animate-view-enter text-xs sm:text-sm">
      <div className="space-y-1">
        <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
          Data Resmi Sekolah Terlapor
        </h3>
        <p className="text-xs text-[#475569]">
          Informasi diverifikasi langsung dari basis data Dapodik &amp; BOSP DARADIK berdasarkan NPSN {report.school_npsn}.
        </p>
      </div>

      {schoolIdentity ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-xs text-[#475569] block">Nama Resmi Sekolah:</span>
            <span className="font-bold text-[#1E293B] block">
              {schoolIdentity.name}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-xs text-[#475569] block">NPSN:</span>
            <span className="font-mono font-bold text-[#1D4F7A] block tabular-nums">
              {schoolIdentity.npsn}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-xs text-[#475569] block">Jenjang &amp; Status:</span>
            <span className="font-bold text-[#1E293B] block">
              {schoolIdentity.jenjang || 'Data belum tersedia'} •{' '}
              {schoolIdentity.schoolType || 'Data belum tersedia'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
            <span className="text-xs text-[#475569] block">Kepala Sekolah:</span>
            <span className="font-bold text-[#1E293B] block">
              {schoolIdentity.principalName || 'Data belum tersedia'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1 sm:col-span-2">
            <span className="text-xs text-[#475569] block">Alamat Sekolah:</span>
            <span className="text-[#1E293B] block leading-relaxed">
              {schoolIdentity.address || 'Data belum tersedia'}
            </span>
            <div className="text-xs text-[#475569] pt-1">
              Kec. {schoolIdentity.kecamatan || 'Data belum tersedia'},{' '}
              {schoolIdentity.kabupaten || 'Data belum tersedia'},{' '}
              {schoolIdentity.provinsi || 'Data belum tersedia'}
            </div>
          </div>

          {schoolIdentity.studentCount !== null && (
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
              <span className="text-xs text-[#475569] block">Jumlah Siswa:</span>
              <span className="font-bold text-[#1E293B] block tabular-nums">
                {schoolIdentity.studentCount} murid
              </span>
            </div>
          )}

          {schoolIdentity.totalBosp !== null && (
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4E0D8] space-y-1">
              <span className="text-xs text-[#475569] block">Alokasi BOSP 2026:</span>
              <span className="font-mono font-bold text-[#166534] block tabular-nums">
                {formatRupiah(schoolIdentity.totalBosp)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>Data Master Sekolah Belum Ditemukan</span>
          </div>
          <p className="leading-relaxed">
            NPSN {report.school_npsn} tidak tercatat dalam tabel master sekolah aktif. Informasi yang tersimpan pada laporan: {report.school_name} ({report.kecamatan}, {report.kabupaten}).
          </p>
        </div>
      )}
    </div>
  );
};
