import React from 'react';
import { BookOpen, FileCheck2, Flag, Home, School } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppView } from '@/types/school';

interface MobileBottomNavProps {
  currentView: AppView;
  onHome: () => void;
  onSearch: () => void;
  onReport: () => void;
  onTracking: () => void;
  onKamus: () => void;
}

interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  views: AppView[];
  onClick: () => void;
  tourId?: string;
  primary?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onHome,
  onSearch,
  onReport,
  onTracking,
  onKamus,
}) => {
  const items: NavItem[] = [
    {
      id: 'home',
      label: 'Beranda',
      Icon: Home,
      views: ['landing'],
      onClick: onHome,
    },
    {
      id: 'schools',
      label: 'Sekolah',
      Icon: School,
      views: ['school-search', 'school-profile'],
      onClick: onSearch,
    },
    {
      id: 'report',
      label: 'Lapor',
      Icon: Flag,
      views: ['anonymous-report'],
      onClick: onReport,
      tourId: 'tour-lapor',
      primary: true,
    },
    {
      id: 'tracking',
      label: 'Lacak',
      Icon: FileCheck2,
      views: ['live-tracking'],
      onClick: onTracking,
      tourId: 'tour-lacak-lapor',
    },
    {
      id: 'kamus',
      label: 'Kamus',
      Icon: BookOpen,
      views: ['kamus-bosp'],
      onClick: onKamus,
      tourId: 'tour-kamus-bosp',
    },
  ];

  return (
    <nav
      aria-label="Navigasi utama HP"
      className="mobile-nav sm:hidden fixed bottom-0 left-0 right-0 z-[55] bg-[#FFFFFF] border-t border-[#C9DFDC]"
    >
      <ul className="grid grid-cols-5 gap-0.5 px-1.5 pt-1.5 pb-1.5 max-w-lg mx-auto">
        {items.map(({ id, label, Icon, views, onClick, tourId, primary }) => {
          const active = views.includes(currentView);
          return (
            <li key={id} className="min-w-0">
              <button
                type="button"
                onClick={onClick}
                data-tour-id={tourId}
                aria-current={active ? 'page' : undefined}
                className="mobile-nav-item w-full min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer active:bg-[#EBF3F8] transition-colors"
              >
                <span
                  className={`flex items-center justify-center h-7 w-12 rounded-full transition-colors ${
                    primary
                      ? 'bg-[#2E6496] text-[#FFFFFF]'
                      : active
                      ? 'bg-[#C9DFDC]/60 text-[#2E6496]'
                      : 'text-[#475569]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" aria-hidden={true} />
                </span>
                <span
                  className={`text-[11px] leading-none truncate max-w-full ${
                    active || primary
                      ? 'font-bold text-[#2E6496]'
                      : 'font-semibold text-[#475569]'
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

