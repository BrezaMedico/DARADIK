import React from 'react';
import { Check } from 'lucide-react';
import type { InspectionMethodCode, TimelineStageView } from '@/types';
import { getInspectionMethodLabel } from '@/utils/reportTracking';

export interface TrackingProgressTimelineProps {
  timelineStages: TimelineStageView[];
  inspectionMethods: InspectionMethodCode[];
}

export const TrackingProgressTimeline: React.FC<TrackingProgressTimelineProps> = ({
  timelineStages,
  inspectionMethods,
}) => {
  return (
    <section className="bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="space-y-1">
        <h2 className="font-sturdy-heading text-lg sm:text-xl font-extrabold text-[#1E293B]">
          Tahapan Pemeriksaan Laporan
        </h2>
        <p className="text-xs sm:text-sm text-[#475569]">
          Seluruh status dan waktu di bawah ini tercatat otomatis berdasarkan tindakan nyata petugas di sistem Dinas Pendidikan.
        </p>
      </div>

      <ol className="space-y-4">
        {timelineStages.map((stage, idx) => {
          const isLast = idx === timelineStages.length - 1;
          const isDone = stage.state === 'done';
          const isCurrent = stage.state === 'current';
          const isStopped = stage.state === 'stopped';
          const isSkipped = stage.state === 'skipped';

          return (
            <li key={stage.statusKey} className="relative pl-9">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[13px] top-8 bottom-[-18px] w-[2px] ${
                    isDone ? 'bg-[#2E6496]' : 'bg-[#E2E8F0]'
                  }`}
                />
              )}

              <span
                aria-hidden="true"
                className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isDone
                    ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                    : isCurrent
                    ? 'bg-[#EBF3F8] border-[#2E6496] text-[#1D4F7A]'
                    : isStopped
                    ? 'bg-[#FEF2F2] border-[#991B1B] text-[#991B1B]'
                    : 'bg-[#FAF8F5] border-[#CBD5E1] text-[#475569]'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.step}
              </span>

              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isCurrent
                    ? 'bg-[#EBF3F8]/45 border-[#2E6496]'
                    : isStopped
                    ? 'bg-[#FEF2F2]/60 border-[#FECACA]'
                    : isDone
                    ? 'bg-[#FFFFFF] border-[#C9DFDC]'
                    : 'bg-[#FAF8F5] border-[#E4E0D8]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                      {stage.step}. {stage.label}
                    </h3>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isDone
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : isCurrent
                          ? 'bg-[#2E6496] text-[#FFFFFF]'
                          : isStopped
                          ? 'bg-[#FEE2E2] text-[#991B1B]'
                          : isSkipped
                          ? 'bg-[#E2E8F0] text-[#1E293B]'
                          : 'bg-[#E2E8F0]/70 text-[#475569]'
                      }`}
                    >
                      {stage.stateLabel}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] sm:text-xs text-[#475569] tabular-nums">
                    {stage.timestampWib || 'Belum dimulai'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  {stage.description}
                </p>

                {stage.step === 4 &&
                  inspectionMethods &&
                  inspectionMethods.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {inspectionMethods.map((methodCode) => (
                        <span
                          key={methodCode}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#C9DFDC] text-[#1E293B]"
                        >
                          {getInspectionMethodLabel(methodCode)}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
