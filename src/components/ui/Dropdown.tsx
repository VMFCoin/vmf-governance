'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Calculate dropdown position relative to viewport
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap - no scrollY needed for fixed positioning
        left: rect.left, // no scrollX needed for fixed positioning
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        updateDropdownPosition();
      }
    }
  };

  // Portal dropdown content
  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed z-[999999]"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      <div
        className="border border-patriotBlue rounded-lg shadow-2xl overflow-hidden backdrop-blur-md"
        style={{
          background:
            'linear-gradient(135deg, rgba(10, 22, 40, 0.98) 0%, rgba(27, 41, 81, 0.96) 100%)',
          border: '1px solid rgba(27, 41, 81, 0.8)',
          backdropFilter: 'blur(12px)',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(27, 41, 81, 0.3)',
        }}
      >
        <div className="max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full px-4 py-3 text-left flex items-center justify-between',
                'hover:bg-patriotBlue/40 transition-colors duration-150',
                'focus:outline-none focus:bg-patriotBlue/40',
                value === option.value &&
                  'bg-patriotRed/30 text-patriotRed border-l-4 border-patriotRed'
              )}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span
                  className={cn(
                    'font-medium',
                    value === option.value
                      ? 'text-patriotRed'
                      : 'text-patriotWhite'
                  )}
                >
                  {option.label}
                </span>
              </div>
              {value === option.value && (
                <Check className="w-4 h-4 text-patriotRed" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full bg-backgroundLight border border-patriotBlue text-textBase rounded-lg px-4 py-3',
          'focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent',
          'transition-all duration-200 flex items-center justify-between',
          'hover:bg-backgroundAccent hover:border-patriotRed/50',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-patriotRed border-transparent'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon}
          <span
            className={cn(
              selectedOption ? 'text-textBase' : 'text-textSecondary'
            )}
          >
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-textSecondary transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Render dropdown in portal to bypass stacking context issues */}
      {typeof window !== 'undefined' &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
};
