import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<CustomSelectOption | string>;
  placeholder: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  emptyOptionLabel,
  disabled = false,
  searchable,
  className = '',
  buttonClassName = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Normalize options into uniform { value, label, badge } objects
  const normalizedOptions = useMemo<CustomSelectOption[]>(() => {
    const list: CustomSelectOption[] = [];

    if (emptyOptionLabel) {
      list.push({
        value: '',
        label: emptyOptionLabel,
      });
    }

    for (const opt of options) {
      if (typeof opt === 'string') {
        // Detect badge for Indonesian regency/city
        let badge: string | undefined;
        if (opt.startsWith('Kab.')) badge = 'Kab';
        else if (opt.startsWith('Kota')) badge = 'Kota';

        list.push({
          value: opt,
          label: opt,
          badge,
        });
      } else {
        list.push(opt);
      }
    }

    return list;
  }, [options, emptyOptionLabel]);

  // Determine if search input should be visible (auto if > 7 items, or explicit prop)
  const isSearchEnabled = typeof searchable === 'boolean' ? searchable : normalizedOptions.length > 7;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return normalizedOptions;
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchQuery]);

  // Find currently selected label
  const selectedOption = useMemo(
    () => normalizedOptions.find((opt) => opt.value === value),
    [normalizedOptions, value]
  );

  const displayLabel = selectedOption ? selectedOption.label : (emptyOptionLabel || placeholder);

  // Handle outside click to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && isSearchEnabled) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchEnabled]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setSearchQuery('');
    }
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
        className={`w-full min-h-[44px] pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border text-left flex items-center justify-between transition-all relative shadow-2xs ${
          disabled
            ? 'opacity-50 bg-[#F1F5F9] border-[#C9DFDC] cursor-not-allowed text-[#64748B]'
            : isOpen
            ? 'border-[#2E6496] ring-2 ring-[#2E6496]/20 bg-[#FFFFFF] cursor-pointer text-[#1E293B]'
            : 'border-[#C9DFDC] bg-[#FFFFFF] hover:border-[#A8C8C4] hover:bg-[#FAF8F5]/80 cursor-pointer text-[#1E293B]'
        } ${buttonClassName}`}
      >
        <span
          className={`truncate block ${
            value ? 'font-semibold text-[#1E293B]' : 'text-[#64748B] font-medium'
          }`}
        >
          {displayLabel}
        </span>

        {/* 14px aligned down arrow (ChevronDown) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#64748B]">
          <ChevronDown
            className={`w-4 h-4 text-[#475569] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#2E6496]' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Dropdown Menu Panel ("dalam dropdownnya") */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-view-enter"
        >
          {/* Quick search input if searchable */}
          {isSearchEnabled && (
            <div className="p-2 border-b border-[#E4E0D8] bg-[#FAF8F5] sticky top-0 z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik untuk mencari..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#FFFFFF] border border-[#C9DFDC] rounded-lg text-[#1E293B] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2E6496] focus:border-[#2E6496] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] p-0.5 rounded cursor-pointer"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value || '__empty__'}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF3F8] text-[#1D4F7A] font-bold'
                        : 'text-[#1E293B] hover:bg-[#FAF8F5] hover:text-[#2E6496]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && !isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#2E6496] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[#64748B]">
                Tidak ada pilihan yang cocok.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
