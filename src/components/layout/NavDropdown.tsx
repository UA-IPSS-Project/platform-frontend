import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../shared/CustomIcons';

interface NavDropdownProps {
  label: string;
  items: Array<{ id: string; label: string }>;
  isActive: boolean;
  onSelect: (id: string) => void;
  onLabelClick?: () => void;
  className?: string;
}

export function NavDropdown({ label, items, isActive, onSelect, onLabelClick, className = '' }: NavDropdownProps) {
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
          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
          : 'text-foreground/80 hover:bg-primary/10 hover:text-primary'
          }`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span
          className={onLabelClick ? 'cursor-pointer' : undefined}
          onClick={(event) => {
            if (!onLabelClick) return;
            event.stopPropagation();
            onLabelClick();
            setIsOpen(false);
          }}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-popover rounded-md shadow-lg border border-border py-1 z-50">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
