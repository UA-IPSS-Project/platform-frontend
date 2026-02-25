"use client";

import * as React from "react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

import { GlassCard } from "./glass-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function CustomCaption({ displayMonth }: CaptionProps) {
  const { goToMonth } = useNavigation();
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentYear = new Date().getFullYear();
  // Gerar anos de 1900 até o ano atual mais 10 para o futuro
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
    <div className="flex items-center justify-center gap-2 w-full px-2">
      <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-8 w-[120px] text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <SelectValue aria-label="Mês">
            {months[displayMonth.getMonth()]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[200px]" position="popper">
          {months.map((month, index) => (
            <SelectItem key={index} value={index.toString()} className="cursor-pointer">
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="h-8 w-[90px] text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <SelectValue aria-label="Ano">
            {displayMonth.getFullYear()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[200px]" position="popper">
          {years.reverse().map((year) => (
            <SelectItem key={year} value={year.toString()} className="cursor-pointer">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-purple-100 dark:hover:bg-purple-900/30",
          ),
          day_range_start:
            "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_range_end:
            "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
          day_selected:
            "bg-purple-600 text-white hover:bg-purple-700 hover:text-white focus:bg-purple-600 focus:text-white",
          day_today: "bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 font-semibold border border-purple-200 dark:border-purple-800",
          day_outside:
            "day-outside text-muted-foreground aria-selected:text-muted-foreground opacity-30",
          day_disabled: "text-muted-foreground opacity-30",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          Caption: (captionProps) => <CustomCaption {...captionProps} />,
        }}
        {...props}
      />
    </GlassCard>
  );
}

export { Calendar };
