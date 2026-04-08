import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export const formatDateInput = (date?: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateInput = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDateDisplay = (date?: Date): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateDisplay = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const cleanValue = value.trim();

  // Accept typed dd/MM/yyyy and yyyy-MM-dd formats.
  if (cleanValue.includes('/')) {
    const [day, month, year] = cleanValue.split('/').map(Number);
    if (!year || !month || !day) return undefined;
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return undefined;
    }
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return parseDateInput(cleanValue);
};

const EMPTY_DATE_DISPLAY = 'dd/mm/yyyy';

type DateSection = 'day' | 'month' | 'year';

const SECTION_ORDER: DateSection[] = ['day', 'month', 'year'];

const SECTION_META: Record<DateSection, { start: number; end: number; len: number; placeholder: string }> = {
  day: { start: 0, end: 2, len: 2, placeholder: 'dd' },
  month: { start: 3, end: 5, len: 2, placeholder: 'mm' },
  year: { start: 6, end: 10, len: 4, placeholder: 'yyyy' },
};

const getSectionValue = (display: string, section: DateSection): string => {
  const meta = SECTION_META[section];
  return display.slice(meta.start, meta.end);
};

const replaceSection = (display: string, section: DateSection, sectionValue: string): string => {
  const meta = SECTION_META[section];
  return `${display.slice(0, meta.start)}${sectionValue}${display.slice(meta.end)}`;
};

const getSectionDigits = (display: string, section: DateSection): string => {
  return getSectionValue(display, section).replace(/\D/g, '');
};

const sectionIsComplete = (display: string, section: DateSection): boolean => {
  return getSectionDigits(display, section).length === SECTION_META[section].len;
};

const setSectionDigits = (display: string, section: DateSection, rawDigits: string): string => {
  const meta = SECTION_META[section];
  const digits = rawDigits.replace(/\D/g, '').slice(0, meta.len);
  const nextSection = meta.placeholder.split('');
  for (let i = 0; i < digits.length; i += 1) {
    nextSection[i] = digits[i];
  }
  return replaceSection(display, section, nextSection.join(''));
};

const getDisplayFromDate = (date?: Date): string => {
  return date ? formatDateDisplay(date) : EMPTY_DATE_DISPLAY;
};

const getSectionFromCursor = (position: number): DateSection => {
  if (position <= 2) return 'day';
  if (position <= 5) return 'month';
  return 'year';
};

const getNextSection = (section: DateSection): DateSection => {
  const index = SECTION_ORDER.indexOf(section);
  return SECTION_ORDER[Math.min(index + 1, SECTION_ORDER.length - 1)];
};

const getPreviousSection = (section: DateSection): DateSection => {
  const index = SECTION_ORDER.indexOf(section);
  return SECTION_ORDER[Math.max(index - 1, 0)];
};

const parseCompleteDisplayDate = (display?: string): Date | undefined => {
  if (!display || display === EMPTY_DATE_DISPLAY) return undefined;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(display)) return undefined;
  const [day, month, year] = display.split('/').map(Number);
  if (!year || !month || !day) return undefined;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

interface DatePickerFieldProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export function DatePickerField({
  id,
  value,
  onChange,
  placeholder = 'Selecionar data',
  buttonClassName,
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateInput(value), [value]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(selectedDate ?? new Date());
  const [inputValue, setInputValue] = useState<string>(getDisplayFromDate(selectedDate));
  const [activeSection, setActiveSection] = useState<DateSection>('day');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    } else {
      setCalendarMonth(new Date());
    }
    setInputValue(getDisplayFromDate(selectedDate));
  }, [selectedDate]);

  const selectSection = (section: DateSection) => {
    setActiveSection(section);
    const meta = SECTION_META[section];
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(meta.start, meta.end);
    });
  };

  const commitDisplayValue = (displayValue: string) => {
    const parsed = parseCompleteDisplayDate(displayValue);
    if (!parsed) {
      setInputValue(getDisplayFromDate(selectedDate));
      return;
    }

    onChange(formatDateInput(parsed));
    setInputValue(formatDateDisplay(parsed));
    setCalendarMonth(parsed);
  };

  const commitTypedDate = () => commitDisplayValue(inputValue);

  return (
    <div className={`flex w-full items-center gap-2 ${buttonClassName ?? ''}`}>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          const isoParsed = parseDateInput(nextValue);

          // Keep typing UX as dd/MM/yyyy but allow pasting yyyy-MM-dd and normalize it.
          if (isoParsed) {
            setInputValue(formatDateDisplay(isoParsed));
            return;
          }

          const displayParsed = parseDateDisplay(nextValue);
          if (displayParsed) {
            setInputValue(formatDateDisplay(displayParsed));
            return;
          }

          if (nextValue.length === 0) {
            setInputValue(EMPTY_DATE_DISPLAY);
            return;
          }
        }}
        onBlur={commitTypedDate}
        onFocus={() => {
          selectSection(activeSection);
        }}
        onClick={(event) => {
          const input = event.currentTarget;
          const cursor = input.selectionStart ?? 0;
          selectSection(getSectionFromCursor(cursor));
        }}
        onPaste={(event) => {
          event.preventDefault();
          const pasted = event.clipboardData.getData('text/plain').trim();
          const parsed = parseDateDisplay(pasted) ?? parseDateInput(pasted);
          if (!parsed) return;

          const formatted = formatDateDisplay(parsed);
          setInputValue(formatted);
          onChange(formatDateInput(parsed));
          setCalendarMonth(parsed);
          selectSection('day');
        }}
        onKeyDown={(event) => {
          if (disabled) return;

          const cursor = event.currentTarget.selectionStart ?? 0;
          const sectionAtCursor = getSectionFromCursor(cursor);
          if (sectionAtCursor !== activeSection) {
            setActiveSection(sectionAtCursor);
          }

          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            selectSection(getNextSection(activeSection));
            return;
          }

          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            selectSection(getPreviousSection(activeSection));
            return;
          }

          if (event.key === 'Tab') {
            return;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            commitTypedDate();
            selectSection(activeSection);
            return;
          }

          if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            const cleared = setSectionDigits(inputValue, activeSection, '');
            setInputValue(cleared);
            selectSection(activeSection);
            return;
          }

          if (/^\d$/.test(event.key)) {
            event.preventDefault();
            const existingDigits = getSectionDigits(inputValue, activeSection);
            const sectionFull = sectionIsComplete(inputValue, activeSection);
            const nextDigits = sectionFull
              ? event.key
              : `${existingDigits}${event.key}`.slice(0, SECTION_META[activeSection].len);

            const nextDisplay = setSectionDigits(inputValue, activeSection, nextDigits);
            setInputValue(nextDisplay);

            if (nextDigits.length === SECTION_META[activeSection].len) {
              const nextSection = getNextSection(activeSection);
              setActiveSection(nextSection);

              const parsed = parseCompleteDisplayDate(nextDisplay);
              if (parsed) {
                onChange(formatDateInput(parsed));
                setCalendarMonth(parsed);
              }

              selectSection(nextSection);
            } else {
              selectSection(activeSection);
            }
            return;
          }

          if (event.key.length === 1) {
            event.preventDefault();
          }
        }}
        placeholder={placeholder || EMPTY_DATE_DISPLAY}
        maxLength={10}
        disabled={disabled}
      />

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) {
            // Keep current date focused when opening, preserving month/year navigation UX.
            setCalendarMonth(selectedDate ?? new Date());
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="px-3"
            disabled={disabled}
            aria-label="Abrir calendario"
          >
            <CalendarIcon className="w-4 h-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 border-0 shadow-none w-auto" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            initialFocus
            onSelect={(date) => {
              if (!date) return;
              onChange(formatDateInput(date));
              setInputValue(formatDateDisplay(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
