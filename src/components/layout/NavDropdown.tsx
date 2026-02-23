import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../shared/CustomIcons';

interface NavDropdownProps {
  label: string;
  items: Array<{ id: string; label: string }>;
  isActive: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export function NavDropdown({ label, items, isActive, onSelect, className = '' }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleItemClick = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors text-sm ${isActive
          ? 'bg-purple-600 hover:bg-purple-700 text-white'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
