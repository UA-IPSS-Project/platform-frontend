import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
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

  useEffect(() => {
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    } else {
      setCalendarMonth(new Date());
    }
  }, [selectedDate]);

  return (
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
        <Button id={id} type="button" variant="outline" className={`w-full justify-between ${buttonClassName ?? ''}`} disabled={disabled}>
          {selectedDate ? selectedDate.toLocaleDateString('pt-PT') : placeholder}
          <CalendarIcon className="w-4 h-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-0 shadow-none w-auto" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          initialFocus
          onSelect={(date) => {
            if (!date) return;
            onChange(formatDateInput(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
