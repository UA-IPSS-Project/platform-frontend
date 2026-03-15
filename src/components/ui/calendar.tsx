"use client";

import * as React from "react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

import { GlassCard } from "./glass-card";

function CustomCaption({ displayMonth }: CaptionProps) {
  const { goToMonth } = useNavigation();
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentYear = new Date().getFullYear();
  // Gerar anos de 1900 até o ano atual mais 11 para abranger o futuro
  const yearCount = currentYear - 1900 + 11;
  const years = Array.from({ length: yearCount }, (_, i) => 1900 + i);

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
          className="flex h-9 w-[130px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none hover:ring-2 hover:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 appearance-none cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down opacity-50"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem' }}
        >
          {months.map((month, index) => (
            <option key={index} value={index} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 py-2 cursor-pointer">
              {month}
            </option>
          ))}
        </select>

        <select
          aria-label="Ano"
          value={displayMonth.getFullYear()}
          onChange={(e) => handleYearChange(e.target.value)}
          className="flex h-9 w-[90px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-white dark:bg-gray-800 px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none hover:ring-2 hover:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 appearance-none cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down opacity-50"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem' }}
        >
          {years.reverse().map((year) => (
            <option key={year} value={year} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 py-2 cursor-pointer">
              {year}
            </option>
          ))}
        </select>
      </div>
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
    <GlassCard className="p-0 overflow-hidden w-full sm:w-auto dark:bg-gray-900/90 shadow-lg">
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
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-violet-100 dark:hover:bg-violet-900/30",
          ),
          day_range_start:
            "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_range_end:
            "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100 font-semibold border border-violet-200 dark:border-violet-800",
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
