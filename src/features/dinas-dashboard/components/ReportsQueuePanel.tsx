import React from 'react';
import {
  ChevronRight,
  Inbox,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import type { OfficerQueueReportRow } from '@/types';
import { formatWibDateTime, getOfficerStatusLabel } from '@/utils/reportTracking';
import type { QueueCategoryTab, QueueCounters } from '../dinasDashboardTypes';

interface ReportsQueuePanelProps {
  counters: QueueCounters;
  filteredReports: OfficerQueueReportRow[];
  isLoadingQueue: boolean;
  isRefreshingQueue: boolean;
  queueError: string | null;
  isLoadingDetail: boolean;
  activeTab: QueueCategoryTab;
  onSelectTab: (tab: QueueCategoryTab) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterStartDate: string;
  onFilterStartDateChange: (value: string) => void;
  filterEndDate: string;
  onFilterEndDateChange: (value: string) => void;
  onRefreshQueue: () => void;
  onOpenReportDetail: (reportId: string) => void;
}

export const ReportsQueuePanel: React.FC<ReportsQueuePanelProps> = ({
  counters,
  filteredReports,
  isLoadingQueue,
  isRefreshingQueue,
  queueError,
  isLoadingDetail,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchQueryChange,
  filterStartDate,
  onFilterStartDateChange,
  filterEndDate,
  onFilterEndDateChange,
  onRefreshQueue,
  onOpenReportDetail,
}) => {
  return (
    <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
              Daftar Antrean Pemeriksaan Laporan
            </h2>
            <p className="text-xs text-[#475569]">
              Laporan yang belum selesai ditangani diurutkan berdasarkan waktu masuk paling lama terlebih dahulu.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshQueue}
            disabled={isLoadingQueue || isRefreshingQueue}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] hover:bg-[#EBF3F8] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2E6496] ${
                isRefreshingQueue ? 'animate-spin' : ''
              }`}
            />
            <span>Segarkan Antrean</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 border-b border-[#E4E0D8] overflow-x-auto pb-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onSelectTab('ALL')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Semua ({counters.totalMasuk})
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('UNOPENED')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'UNOPENED'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Belum Dibuka ({counters.belumDibuka})
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('REVIEW')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'REVIEW'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Sedang Ditelaah
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('INSPECTION')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'INSPECTION'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Pemeriksaan Lanjutan
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('WAITING_INFO')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'WAITING_INFO'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Menunggu Info ({counters.menungguInfo})
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('COMPLETED')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Selesai ({counters.selesai})
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('REJECTED')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
              activeTab === 'REJECTED'
                ? 'bg-[#2E6496] text-[#FFFFFF]'
                : 'text-[#475569] hover:bg-[#FAF8F5]'
            }`}
          >
            Tidak Dapat Ditindaklanjuti
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Cari kode tiket, nama sekolah, atau NPSN..."
              className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-[#1E293B] placeholder:text-[#64748B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20 focus:border-[#2E6496]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#1E293B] p-1 cursor-pointer"
                aria-label="Kosongkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => onFilterStartDateChange(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
              title="Dari Tanggal Laporan (WIB)"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => onFilterEndDateChange(e.target.value)}
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#C9DFDC] text-[#1E293B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#2E6496]/20"
              title="Sampai Tanggal Laporan (WIB)"
            />

            {(filterStartDate || filterEndDate) && (
              <button
                type="button"
                onClick={() => {
                  onFilterStartDateChange('');
                  onFilterEndDateChange('');
                }}
                className="min-h-[42px] px-3 rounded-xl border border-[#C9DFDC] bg-[#FAF8F5] text-xs text-[#475569] hover:text-[#1E293B] cursor-pointer shrink-0"
                title="Reset tanggal"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {queueError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-semibold flex items-center justify-between gap-3"
        >
          <span>{queueError}</span>
          <button
            type="button"
            onClick={onRefreshQueue}
            className="px-3 py-1 rounded-lg bg-[#FFFFFF] border border-[#FECACA] text-xs font-bold text-[#991B1B] hover:bg-[#FEE2E2]/60 cursor-pointer shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="border border-[#C9DFDC] rounded-xl overflow-hidden bg-[#FFFFFF]">
        <div className="md:hidden divide-y divide-[#E4E0D8]">
          {isLoadingQueue ? (
            <div className="px-4 py-12 text-center text-xs text-[#475569]">
              <RefreshCw className="w-5 h-5 text-[#2E6496] animate-spin mx-auto mb-2" />
              <span>Memuat antrean laporan pengaduan...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#475569]">
              <Inbox className="w-6 h-6 text-[#475569] mx-auto mb-2" />
              <div className="font-bold text-[#1E293B] text-sm">
                Belum ada laporan yang masuk.
              </div>
              <p className="text-xs text-[#475569] mt-1">
                Tidak ada pengaduan pada kategori atau filter tanggal yang dipilih.
              </p>
            </div>
          ) : (
            filteredReports.map((r) => {
              const isClosed =
                r.status === 'COMPLETED' ||
                r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI';
              return (
                <div
                  key={`mobile-${r.id}`}
                  className={`p-4 space-y-2.5 bg-[#FFFFFF] ${
                    isClosed ? 'opacity-85' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-[#2E6496] tabular-nums">
                        {r.ticket_code}
                      </div>
                      <div className="text-[11px] text-[#64748B] tabular-nums">
                        {formatWibDateTime(r.created_at)}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                        r.status === 'COMPLETED'
                          ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                          : r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                          ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          : r.waiting_additional_info
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          : r.status === 'SEDANG_DITELAAH'
                          ? 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
                          : 'bg-[#FAF8F5] text-[#475569] border-[#C9DFDC]'
                      }`}
                    >
                      {getOfficerStatusLabel(
                        r.status,
                        r.waiting_additional_info,
                        r.opened_at
                      )}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-xs text-[#1E293B]">
                      {r.school_name}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono">
                      NPSN: {r.school_npsn} • {r.kabupaten}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#F1F5F9]">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1E293B] truncate">
                        {r.category}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Pelapor: {r.requester_role}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenReportDetail(r.id)}
                      disabled={isLoadingDetail}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <span>Buka Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#FAF8F5] border-b border-[#C9DFDC] text-[#475569] uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-3.5 py-3 w-48">Kode &amp; Waktu</th>
                <th scope="col" className="px-3.5 py-3">Sekolah &amp; Wilayah</th>
                <th scope="col" className="px-3.5 py-3 w-48">Kategori Masalah</th>
                <th scope="col" className="px-3.5 py-3 w-40">Status</th>
                <th scope="col" className="px-3.5 py-3 text-right w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D8] bg-[#FFFFFF]">
              {isLoadingQueue ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#475569]">
                    <RefreshCw className="w-5 h-5 text-[#2E6496] animate-spin mx-auto mb-2" />
                    <span>Memuat antrean laporan pengaduan...</span>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-[#475569]">
                    <Inbox className="w-6 h-6 text-[#475569] mx-auto mb-2" />
                    <div className="font-bold text-[#1E293B] text-sm">
                      Belum ada laporan yang masuk.
                    </div>
                    <p className="text-xs text-[#475569] mt-1">
                      Tidak ada pengaduan pada kategori atau filter tanggal yang dipilih.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const isClosed =
                    r.status === 'COMPLETED' ||
                    r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI';
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        isClosed ? 'opacity-85' : ''
                      }`}
                    >
                      <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                        <div className="font-mono font-bold text-[#2E6496] tabular-nums">
                          {r.ticket_code}
                        </div>
                        <div className="text-[11px] text-[#64748B] tabular-nums mt-0.5">
                          {formatWibDateTime(r.created_at)}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-middle">
                        <div className="font-bold text-[#1E293B] line-clamp-1">
                          {r.school_name}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                          NPSN: {r.school_npsn} • {r.kabupaten}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-middle">
                        <div className="text-xs font-semibold text-[#1E293B] line-clamp-1">
                          {r.category}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          Pelapor: {r.requester_role}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            r.status === 'COMPLETED'
                              ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]'
                              : r.status === 'TIDAK_DAPAT_DITINDAKLANJUTI'
                              ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                              : r.waiting_additional_info
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : r.status === 'SEDANG_DITELAAH'
                              ? 'bg-[#EBF3F8] text-[#1D4F7A] border-[#C9DFDC]'
                              : 'bg-[#FAF8F5] text-[#475569] border-[#C9DFDC]'
                          }`}
                        >
                          {getOfficerStatusLabel(
                            r.status,
                            r.waiting_additional_info,
                            r.opened_at
                          )}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenReportDetail(r.id)}
                          disabled={isLoadingDetail}
                          className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#2E6496] hover:bg-[#245385] text-[#FFFFFF] font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Buka Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
