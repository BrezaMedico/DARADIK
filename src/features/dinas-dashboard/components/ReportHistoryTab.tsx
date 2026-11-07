import React from 'react';
import type { OfficerStatusHistoryRow } from '@/types';
import { formatWibDateTime } from '@/utils/reportTracking';

interface ReportHistoryTabProps {
  history: OfficerStatusHistoryRow[];
}

export const ReportHistoryTab: React.FC<ReportHistoryTabProps> = ({ history }) => {
  return (
    <div className="space-y-4 animate-view-enter">
      <div className="space-y-1">
        <h3 className="font-sturdy-heading text-base font-bold text-[#1E293B]">
          Audit Log Riwayat Perubahan Status
        </h3>
        <p className="text-xs text-[#475569]">
          Setiap tindakan terekam secara permanen dengan stempel waktu dan identitas aparatur.
        </p>
      </div>

      <div className="divide-y divide-[#E4E0D8] border border-[#E4E0D8] rounded-xl overflow-hidden">
        {history.map((h) => (
          <div
            key={h.id}
            className="p-4 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap font-bold text-[#1E293B]">
                <span>
                  {h.previous_status || 'Awal'} &rarr; {h.new_status}
                </span>
                <span className="text-[11px] font-normal text-[#475569]">
                  • {h.changed_by_name}
                </span>
                {h.is_internal && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] font-semibold">
                    Internal
                  </span>
                )}
              </div>
              {h.note && (
                <p className="text-[#475569] leading-relaxed">{h.note}</p>
              )}
            </div>

            <span className="font-mono text-[11px] text-[#475569] tabular-nums shrink-0">
              {formatWibDateTime(h.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
