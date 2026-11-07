import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildPaginationItems } from '../searchUrlUtils';

interface SearchPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}

export const SearchPagination: React.FC<SearchPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages]
  );

  return (
    <nav
      aria-label="Navigasi halaman hasil pencarian"
      className="pt-2"
    >
      <div className="flex sm:hidden items-center justify-between gap-2 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl p-2 shadow-2xs">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#2E6496]" />
          <span>Prev</span>
        </button>

        <span className="text-xs font-bold text-[#1E293B] tabular-nums">
          Hal. <span className="text-[#2E6496]">{page}</span> / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs font-bold text-[#1E293B] disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 text-[#2E6496]" />
        </button>
      </div>

      <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] disabled:opacity-45 disabled:hover:bg-[#FFFFFF] disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {paginationItems.map((item) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <span
                  key={item}
                  className="px-2 py-2 text-xs sm:text-sm font-semibold text-[#64748B] select-none"
                >
                  ...
                </span>
              );
            }

            const isCurrent = item === page;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-[40px] min-h-[40px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold tabular-nums transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[#2E6496] border-[#2E6496] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] hover:bg-[#EBF3F8] border-[#C9DFDC] text-[#1E293B]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#EBF3F8] border border-[#C9DFDC] text-xs sm:text-sm font-semibold text-[#1E293B] disabled:opacity-45 disabled:hover:bg-[#FFFFFF] disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
