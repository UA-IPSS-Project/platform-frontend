"use client";

import * as React from "react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";
import { validateCalendarYear } from "../../lib/validations";

import { GlassCard } from "./glass-card";

function CustomCaption({ displayMonth }: CaptionProps) {
  const { goToMonth } = useNavigation();
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const [yearInput, setYearInput] = React.useState(String(displayMonth.getFullYear()));
  const [yearError, setYearError] = React.useState<string | null>(null);
  const yearErrorId = React.useId();

  React.useEffect(() => {
    setYearInput(String(displayMonth.getFullYear()));
    setYearError(null);
  }, [displayMonth]);

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(parseInt(monthIndex));
    goToMonth?.(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(displayMonth);
    newDate.setFullYear(parseInt(year));
    goToMonth?.(newDate);
  };

  const handleYearInputChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    setYearInput(digitsOnly);

    if (digitsOnly.length < 4) {
      setYearError(null);
      return;
    }

    const validation = validateCalendarYear(digitsOnly);
    if (!validation.valid) {
      setYearError(validation.error ?? null);
      return;
    }

    setYearError(null);
    handleYearChange(digitsOnly);
  };

  const handleYearInputBlur = () => {
    if (yearInput.length === 0) {
      setYearInput(String(displayMonth.getFullYear()));
      setYearError(null);
      return;
    }

    const validation = validateCalendarYear(yearInput);
    if (!validation.valid) {
      setYearError(validation.error ?? null);
      return;
    }

    setYearError(null);
    handleYearChange(yearInput);
  };

  return (
    <div
      className="flex flex-col gap-2 w-full px-1 pb-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-center w-full gap-2">
        <select
          aria-label="Mês"
          value={displayMonth.getMonth()}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="flex h-9 w-[130px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none hover:ring-2 hover:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 appearance-none cursor-pointer transition-colors hover:bg-accent font-medium"
          style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down opacity-50"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem' }}
        >
          {months.map((month, index) => (
            <option key={index} value={index} className="text-popover-foreground bg-popover py-2 cursor-pointer">
              {month}
            </option>
          ))}
        </select>

        <input
          aria-label="Ano"
          aria-invalid={Boolean(yearError)}
          aria-describedby={yearError ? yearErrorId : undefined}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={yearInput}
          onChange={(e) => handleYearInputChange(e.target.value)}
          onBlur={handleYearInputBlur}
          title={yearError ?? "Insira um ano com 4 dígitos"}
          className={cn(
            "flex h-9 w-[90px] items-center justify-center whitespace-nowrap rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none hover:ring-2 hover:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-accent font-medium text-center",
            yearError && "border-status-error ring-1 ring-status-error"
          )}
        />
      </div>
      {yearError && (
        <p
          id={yearErrorId}
          role="alert"
          aria-live="polite"
          className="text-xs text-status-error text-center px-1"
        >
          {yearError}
        </p>
      )}
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <GlassCard className="p-0 overflow-hidden w-full sm:w-auto shadow-lg">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-4", className)}
        classNames={{
          months: "flex flex-col sm:flex-row gap-4",
          month: "flex flex-col gap-4 w-full",
          caption: "flex justify-center pt-1 relative items-center w-full mb-2",
          caption_label: "hidden",
          nav: "hidden",
          table: "w-full border-collapse",
          head_row: "flex w-full justify-between mt-2",
          head_cell:
            "text-muted-foreground w-9 flex justify-center items-center font-normal text-[0.8rem] pb-2",
          row: "flex w-full justify-between mt-2",
          cell: cn(
            "relative p-0 h-9 w-9 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
            props.mode === "range"
              ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
              : "[&:has([aria-selected])]:rounded-md",
          ),
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent",
          ),
          day_range_start:
            "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_range_end:
            "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-status-info-soft/40 text-status-info font-semibold border border-status-info/40",
          day_outside:
            "day-outside text-muted-foreground aria-selected:text-muted-foreground opacity-30",
          day_disabled: "text-muted-foreground opacity-30",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          Caption: CustomCaption,
        }}
        {...props}
      />
    </GlassCard>
  );
}

export { Calendar };
