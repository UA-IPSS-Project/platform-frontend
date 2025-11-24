import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
// NOTA: Não é preciso DialogFooter, vamos manter o layout inline
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'; 
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// O componente Input não é usado para o ano
import { toast } from 'sonner';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, CalendarIcon, ClockIcon, UserIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface WeeklyScheduleProps {
  appointments: Appointment[];
  allAppointments?: Appointment[];
  currentUserNif?: string;
  isClient?: boolean;
  onCreateAppointment: (date: Date, time: string) => void;
  onViewAppointment: (appointment: Appointment) => void;
  onToggleView: () => void;
  isDarkMode: boolean;
}

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 16 && minute > 45) break;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const WEEKDAYS_SHORT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

export function WeeklySchedule({ appointments, allAppointments, currentUserNif, isClient, onCreateAppointment, onViewAppointment, onToggleView, isDarkMode }: WeeklyScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [quickDialogOpen, setQuickDialogOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Campo Ano como Select
  const [quickYear, setQuickYear] = useState(today.getFullYear());
  const [quickMonth, setQuickMonth] = useState(today.getMonth());
  const [quickDay, setQuickDay] = useState(today.getDate());
  const [quickDate, setQuickDate] = useState<Date>(today);
  const [quickTime, setQuickTime] = useState('');
  const [quickSlots, setQuickSlots] = useState<string[]>([]);
  
  // Opções de ano (dropdown)
  const quickYearOptions = Array.from({ length: 5 }, (_, idx) => today.getFullYear() - 2 + idx);
  const selectMenuClassName = "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-y-auto";
  const selectMenuStyle = { maxHeight: '15rem' };

  const getWeekDays = (date: Date) => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay() + 1;
    const days = [];

    for (let i = 0; i < 5; i++) {
      const day = new Date(curr.setDate(first + i));
      days.push(day);
    }

    return days;
  };

  const weekDays = getWeekDays(currentDate);
  const timeSlots = generateTimeSlots();
  const bookingSource = allAppointments ?? appointments;

  const isSlotBooked = (date: Date, time: string) => {
    return bookingSource.some(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const slotDate = new Date(date);
      slotDate.setHours(0, 0, 0, 0);
      
      return aptDate.getTime() === slotDate.getTime() && 
             apt.time === time && 
             apt.status !== 'cancelled';
    });
  };

  const getAvailableSlotsForDate = (date: Date) =>
    timeSlots.filter((slot) => !isSlotBooked(date, slot));

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setCalendarOpen(false);
    }
  };

  const getAppointmentForSlot = (date: Date, time: string) => {
    return bookingSource.find(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      const slotDate = new Date(date);
      slotDate.setHours(0, 0, 0, 0);
      
      return aptDate.getTime() === slotDate.getTime() && 
             apt.time === time && 
             apt.status !== 'cancelled';
    });
  };

  const handleSlotClick = (date: Date, time: string) => {
    const appointment = getAppointmentForSlot(date, time);
    const isOwn = appointment && currentUserNif && appointment.patientNIF === currentUserNif;

    if (appointment) {
      if (isClient && !isOwn) return;
      onViewAppointment(appointment);
      return;
    }

    onCreateAppointment(date, time);
  };

  const getWeekLabel = () => {
    const firstDay = weekDays[0];
    const month = firstDay.toLocaleDateString('pt-PT', { month: 'long' });
    return `${firstDay.getDate()} de ${month}`;
  };

  const handleExport = () => {
    toast.success('Agenda semanal exportada com sucesso');
  };

  const handleQuickDialogToggle = (open: boolean) => {
    setQuickDialogOpen(open);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  useEffect(() => {
    const clampedDay = Math.min(quickDay, getDaysInMonth(quickYear, quickMonth));
    if (clampedDay !== quickDay) {
      setQuickDay(clampedDay);
      return;
    }
    const newDate = new Date(quickYear, quickMonth, quickDay);
    newDate.setHours(0, 0, 0, 0);
    setQuickDate(newDate);
  }, [quickDay, quickMonth, quickYear]);

  useEffect(() => {
    const slots = getAvailableSlotsForDate(quickDate);
    setQuickSlots(slots);
    setQuickTime((prev) => {
      if (!slots.length) {
        return '';
      }
      if (prev && slots.includes(prev)) {
        return prev;
      }
      return slots[0];
    });
  }, [quickDate, appointments]);

  const handleConfirmQuickAppointment = () => {
    if (!quickTime) {
      toast.error('Selecione um horário disponível');
      return;
    }
    setQuickDialogOpen(false);
    onCreateAppointment(new Date(quickDate), quickTime);
  };

  return (
    <div>
      {/* Header - Outside Card */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="mb-1">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100">Agenda Semanal</h2>
        </div>
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300">
          Clique numa célula vazia para iniciar uma marcação
        </p>
      </div>

      {/* Navigation - Outside Card */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek('prev')}
          className={`h-8 w-8 rounded transition-colors ${isDarkMode ? 'bg-gray-800/10 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'bg-white text-gray-700 hover:bg-white/90'}`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={`gap-2 h-8 px-3 text-sm rounded transition-opacity ${isDarkMode ? 'bg-gray-800/40 text-gray-200 hover:bg-gray-800/70' : 'bg-white text-gray-700 hover:bg-white/90'}`}
            >
              <CalendarIcon className="w-4 h-4" />
              {getWeekLabel()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent
              mode="single"
              selected={currentDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek('next')}
          className={`h-8 w-8 rounded transition-colors ${isDarkMode ? 'bg-gray-800/10 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'bg-white text-gray-700 hover:bg-white/90'}`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        {!isClient && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickDialogToggle(true)}
            className={`px-3 ${
              isDarkMode
                ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Nova marcação
          </Button>
        )}
      </div>

      <Card className={`p-4 ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white'}`}>

      {/* Schedule Grid */}
      <div className="w-full">
        {/* CORREÇÃO 1: Scrollbar para os dias/horários: max-height e overflow-y-auto */}
        <div className="overflow-y-auto pr-2" style={{ maxHeight: '540px' }}>
          {/* Header Row - Sticky */}
          <div
            className={`grid grid-cols-6 gap-2 mb-4 sticky top-0 z-10 ${
              isDarkMode
                ? 'bg-gray-900/80 backdrop-blur border-b border-gray-800'
                : 'bg-white backdrop-blur border-b border-gray-200'
            }`}
            style={{ gridTemplateColumns: '80px repeat(5, minmax(0, 1fr))' }}
          >
            <div className={`p-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hora</div>
            {weekDays.map((day, index) => (
              <div key={index} className="text-center">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {WEEKDAYS_SHORT[index]}
                </div>
                <div className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{day.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="space-y-0.5 pb-2">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="grid grid-cols-6 gap-2"
                style={{ gridTemplateColumns: '80px repeat(5, minmax(0, 1fr))' }}
              >
                <div className={`p-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
                  {time}
                </div>
                {weekDays.map((day, idx) => {
                  const booked = isSlotBooked(day, time);
                  const appointment = getAppointmentForSlot(day, time);
                  const isOwn = appointment && currentUserNif && appointment.patientNIF === currentUserNif;
                  const blocked = booked && isClient && !isOwn;
                  const base = `p-1.5 min-h-[40px] rounded border transition-all text-xs cursor-pointer`;
                  const available = isDarkMode
                    ? 'border-gray-800 hover:bg-gray-800/50 hover:border-purple-600'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-purple-600';
                  const appointmentStyles =
                    appointment?.status === 'in-progress'
                      ? 'bg-purple-600 text-white border-purple-700'
                      : appointment?.status === 'warning'
                      ? 'bg-yellow-600 text-white border-yellow-700'
                      : 'bg-pink-600 text-white border-pink-700';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSlotClick(day, time)}
                      disabled={blocked}
                      title={blocked ? 'Horário indisponível' : undefined}
                      className={`${base} ${
                        blocked
                          ? isDarkMode
                            ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed'
                          : booked
                          ? appointmentStyles
                          : available
                      }`}
                    >
                      {appointment && !blocked && (
                        <div className="flex items-center gap-1 text-left truncate font-semibold text-sm leading-tight">
                          <UserIcon className="w-3.5 h-3.5 text-white" />
                          <span className="truncate">{appointment.patientName}</span>
                        </div>
                      )}
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

      <Dialog open={quickDialogOpen} onOpenChange={handleQuickDialogToggle}>
        {/* CORREÇÃO 3: DialogContent como card */}
        <DialogContent className="max-w-5xl w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Criar nova marcação</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha rapidamente um dia específico e um horário disponível
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {/* CORREÇÃO 3: items-end garante alinhamento do botão com os campos */}
            {/* Forçar wrap em todos os breakpoints para evitar que o botão ultrapasse o card */}
            <div className="flex items-end gap-4 flex-wrap">
              
              {/* Campo Ano (Select/Dropdown) */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Ano</Label>
                <Select
                  value={String(quickYear)}
                  onValueChange={(value) => setQuickYear(Number(value))}
                >
                  <SelectTrigger className="min-w-[120px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {quickYearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Mês */}
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Mês</Label>
                <Select
                  value={String(quickMonth)}
                  onValueChange={(value) => setQuickMonth(Number(value))}
                >
                  <SelectTrigger className="min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {Array.from({ length: 12 }).map((_, index) => {
                      const monthDate = new Date(quickYear, index, 1);
                      return (
                        <SelectItem key={index} value={String(index)}>
                          {monthDate.toLocaleDateString('pt-PT', { month: 'long' })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Dia (Com Scrollbar) */}
              <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Dia</Label>
                <Select
                  value={String(quickDay)}
                  onValueChange={(value) => setQuickDay(Number(value))}
                >
                  <SelectTrigger className="min-w-[120px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  {/* CORREÇÃO 2: Scrollbar para os dias */}
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {Array.from({ length: getDaysInMonth(quickYear, quickMonth) }).map((_, index) => {
                      const day = index + 1;
                      return (
                        <SelectItem key={day} value={String(day)}>
                          {day.toString().padStart(2, '0')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Horário (Com Scrollbar) */}
              <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase">Horário</Label>
                <Select
                  value={quickTime}
                  onValueChange={setQuickTime}
                  disabled={!quickSlots.length}
                >
                  <SelectTrigger className="min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-10">
                    <SelectValue placeholder="Sem horários disponíveis" />
                  </SelectTrigger>
                  {/* CORREÇÃO 2: Scrollbar para os horários */}
                  <SelectContent className={selectMenuClassName} style={selectMenuStyle}>
                    {quickSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-8 text-base rounded-lg w-full"
              onClick={handleConfirmQuickAppointment}
              disabled={!quickTime}
            >
              Escolher
            </Button>

            {!quickSlots.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Não existem horários disponíveis para esta data.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
