import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
  className = '',
  buttonClassName = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
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

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-[100]' : 'z-auto'} ${className}`}
    >
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
          className="absolute left-0 right-0 top-full mt-1.5 z-[110] bg-[#FFFFFF] border border-[#C9DFDC] rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-view-enter"
        >
          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {normalizedOptions.map((opt) => {
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
            })}
          </div>
        </div>
      )}
    </div>
  );
};
