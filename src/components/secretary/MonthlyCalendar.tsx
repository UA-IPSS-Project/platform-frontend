import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, CalendarIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface MonthlyCalendarProps {
  appointments: Appointment[];
  onDayClick: (date: Date) => void;
  onToggleView: () => void;
  isDarkMode: boolean;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

export function MonthlyCalendar({ appointments, onDayClick, onToggleView, isDarkMode }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const getMonthMatrix = (date: Date): DayInfo[][] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const matrix: DayInfo[][] = [];
    let week: DayInfo[] = [];

    // Previous month days
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -(startingDayOfWeek - i - 1));
      week.push({
        date: prevDate,
        isCurrentMonth: false,
        isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      week.push({
        date: currentDay,
        isCurrentMonth: true,
        isWeekend: currentDay.getDay() === 0 || currentDay.getDay() === 6,
      });

      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }

    // Next month days to complete the last week
    if (week.length > 0) {
      const remainingDays = 7 - week.length;
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i);
        week.push({
          date: nextDate,
          isCurrentMonth: false,
          isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6,
        });
      }
      matrix.push(week);
    }

    // Ensure 6 rows
    while (matrix.length < 6) {
      const lastDate = matrix[matrix.length - 1][6].date;
      const newWeek: DayInfo[] = [];
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        newWeek.push({
          date: nextDate,
          isCurrentMonth: false,
          isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6,
        });
      }
      matrix.push(newWeek);
    }

    return matrix;
  };

  const monthMatrix = getMonthMatrix(currentDate);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === checkDate.getTime() && apt.status !== 'cancelled';
    });
  };

  const getTotalSlotsForDay = () => {
    // 09:00 - 16:45, 15 min intervals = 32 slots
    return 32;
  };

  const getUsedSlotsForDay = (date: Date) => {
    const dayAppointments = getAppointmentsForDay(date);
    let usedSlots = 0;
    
    dayAppointments.forEach(apt => {
      usedSlots += Math.ceil(apt.duration / 15);
    });
    
    return usedSlots;
  };

  const handleDayClick = (dayInfo: DayInfo) => {
    if (!dayInfo.isCurrentMonth || dayInfo.isWeekend) return;
    onDayClick(dayInfo.date);
  };

  const handleMonthYearChange = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
    setDatePickerOpen(false);
  };

  const openDatePicker = () => {
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
    setDatePickerOpen(true);
  };

  const handleExport = () => {
    toast.success('Agenda mensal exportada com sucesso');
  };

  return (
    <div>
      {/* Header - Outside Card */}
      <div className="mb-4">
        <button 
          onClick={onToggleView}
          className="text-gray-900 dark:text-gray-100 text-lg font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 cursor-pointer mb-1"
        >
          <span>Agenda Mensal</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clique no título para alternar visualização
        </p>
      </div>

      {/* Navigation - Outside Card */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="h-8 w-8 text-gray-700 dark:text-gray-300">
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="gap-2 h-8 px-3 text-sm min-w-[200px] text-gray-700 dark:text-gray-300" onClick={openDatePicker}>
              <CalendarIcon className="w-4 h-4" />
              {MONTHS[currentDate.getMonth()]} de {currentDate.getFullYear()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" align="center">
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {month.charAt(0).toUpperCase() + month.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-gray-600 dark:text-gray-400">de</span>
              
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[100px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleMonthYearChange} 
                className="bg-purple-600 hover:bg-purple-700 text-white h-10"
              >
                Ir
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="h-8 w-8 text-gray-700 dark:text-gray-300">
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>

      <Card className={`p-4 min-h-[560px] ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/95'} flex flex-col`}>

      {/* Calendar Grid */}
      <div className="w-full flex-1 flex flex-col">
        <div className="overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm">
            {WEEKDAYS.map((day) => (
              <div key={day} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="space-y-2">
            {monthMatrix.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((dayInfo, dayIndex) => {
                  if (!dayInfo.isCurrentMonth) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="rounded-xl min-h-[75px] p-2 bg-transparent"
                        aria-hidden="true"
                      />
                    );
                  }

                  const hasAppointments = getAppointmentsForDay(dayInfo.date).length > 0;
                  const totalSlots = getTotalSlotsForDay();
                  const usedSlots = getUsedSlotsForDay(dayInfo.date);
                  const isFull = usedSlots >= totalSlots;

                  const cellBase = `rounded-xl border min-h-[75px] p-2 flex flex-col justify-between transition-all ${
                    isDarkMode ? 'border-gray-800' : 'border-gray-200'
                  }`;
                  const enabledStyles = isDarkMode
                    ? 'bg-gray-900/40 hover:bg-gray-900/70 hover:border-purple-500 text-gray-50'
                    : 'bg-white hover:border-purple-500 hover:shadow-lg text-gray-700';
                  const disabledStyles = isDarkMode
                    ? 'bg-gray-800/70 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed';
                  const appointmentStyles = hasAppointments
                    ? isFull
                      ? isDarkMode
                        ? 'bg-red-900/40 border-red-700 text-red-100'
                        : 'bg-red-50 border-red-300 text-red-800'
                      : isDarkMode
                      ? 'bg-purple-900/40 border-purple-700 text-purple-100'
                      : 'bg-purple-50 border-purple-300 text-purple-800'
                    : '';

                  return (
                    <button
                      type="button"
                      key={`${weekIndex}-${dayIndex}`}
                      onClick={() => handleDayClick(dayInfo)}
                      disabled={dayInfo.isWeekend}
                      className={`${cellBase} ${dayInfo.isWeekend ? disabledStyles : `${enabledStyles} ${appointmentStyles}`}`}
                    >
                      <div className="flex justify-end w-full">
                        <span className="text-xl">{dayInfo.date.getDate()}</span>
                      </div>
                      <div className="flex justify-center w-full">
                        {hasAppointments && (
                          <span className="inline-flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-600' : 'bg-purple-600'}`}></span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      </Card>
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={handleExport} className="gap-2 h-9 text-sm">
          <DownloadIcon className="w-4 h-4" />
          Exportar Agenda
        </Button>
      </div>
    </div>
  );
}
