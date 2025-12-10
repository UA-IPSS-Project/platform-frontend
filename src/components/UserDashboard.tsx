import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { NavDropdown } from './ui/NavDropdown';
import { NotificationsPanel } from './ui/NotificationsPanel';
import { NotificationsPage } from './NotificationsPage';
import { Sidebar } from './Sidebar';
import { WeeklySchedule } from './secretary/WeeklySchedule';
import { TodayAppointments } from './secretary/TodayAppointments';
import { HistoryPage } from './secretary/HistoryPage';
import { ProfilePage } from './ProfilePage';
import { ClientAppointmentDialog } from './client/ClientAppointmentDialog';
import { AppointmentDetailsDialog } from './secretary/AppointmentDetailsDialog';
import { DayScheduleDialog } from './secretary/DayScheduleDialog';
import { BellIcon, MenuIcon, MoonIcon, SunIcon, ClockIcon, LogOutIcon } from './CustomIcons';
import type { Appointment } from './SecretaryDashboard';
import { generateMockAppointments, normalizeMockAppointments } from './SecretaryDashboard';
import { toast } from 'sonner';

interface UserDashboardProps {
  user: {
    name: string;
    nif: string;
    contact: string;
    email: string;
  };
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type ViewType =
  | 'appointments'
  | 'history'
  | 'profile'
  | 'settings'
  | 'notificacoes'
  | 'balneario'
  | 'balneario-sobre'
  | 'voluntariado'
  | 'voluntariado-sobre'
  | 'requisitions'
  | 'valencias'
  | 'candidaturas'
  | 'reports'
  | 'management'
  | 'material'
  | 'manutencao'
  | 'transportes'
  | 'urgente'
  | 'escola'
  | 'creche'
  | 'catl'
  | 'erpi'
  | 'administrative'
  | 'home';

export function UserDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: UserDashboardProps) {
  const APPOINTMENTS_KEY = 'appointments';
  const userSeededRef = useRef(false);

  const loadAppointments = () => {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_KEY);
      if (raw) {
        const parsed: Appointment[] = JSON.parse(raw).map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          patientNIF: apt.patientName === 'Maria Silva' && apt.patientNIF === '123456789' ? '123450001' : apt.patientNIF,
        }));
        return normalizeMockAppointments(parsed);
      }
    } catch {
      /* ignore */
    }
    const seed = normalizeMockAppointments(generateMockAppointments());
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(seed));
    } catch {
      /* ignore */
    }
    return seed;
  };

  const [allAppointments, setAllAppointments] = useState<Appointment[]>(loadAppointments());
  const [currentView, setCurrentView] = useState<ViewType>('appointments');
  // Monthly view removed - always use weekly schedule
  const [scheduleView] = useState<'weekly' | 'monthly'>('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ date: Date; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDaySchedule, setShowDaySchedule] = useState<Date | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Sample notifications for user
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Marcação confirmada',
      message: 'A sua marcação para amanhã às 15:00 foi confirmada.',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      isRead: false,
      icon: 'calendar' as const,
    },
    {
      id: '2',
      title: 'Candidatura em análise',
      message: 'A sua candidatura para CATL está em análise. Aguarde aprovação.',
      timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
      isRead: false,
      icon: 'document' as const,
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const visibleAppointments = useMemo(
    () => allAppointments.filter((apt) => apt.patientNIF === user.nif),
    [allAppointments, user.nif]
  );

  const handleCreateAppointment = (date: Date, time: string) => {
    setEditingSlot({ date, time });
    setShowClientDialog(true);
  };

  const handleSaveClientAppointment = (payload: { subject: string; description: string; documents: string[] }) => {
    if (!editingSlot) {
      toast.error('Houve um erro, tente novamente');
      return;
    }

    try {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        date: editingSlot.date,
        time: editingSlot.time,
        duration: 15,
        patientNIF: user.nif,
        patientName: user.name,
        patientContact: user.contact,
        subject: payload.subject,
        description: payload.description,
        status: 'scheduled',
        documents: payload.documents.map((name) => ({ name })),
      };

      setAllAppointments([...allAppointments, newAppointment]);
      toast.success('Marcação feita com sucesso!');
      setShowClientDialog(false);
      setEditingSlot(null);
    } catch {
      toast.error('Houve um erro, tente novamente');
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAllAppointments(allAppointments.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt)));
  };

  const handleUpdateSelectedAppointment = (id: string, updates: Partial<Appointment>) => {
    handleUpdateAppointment(id, updates);
  };

  const handleCancelAppointment = (id: string, reason?: string) => {
    handleUpdateAppointment(id, { status: 'cancelled', cancellationReason: reason });
    setShowDetailsDialog(false);
    setSelectedAppointment(null);
  };

  const renderPlaceholder = (title: string) => (
    <div className="flex items-center justify-center h-[500px]">
      <div className="text-center">
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-500">Em desenvolvimento</p>
      </div>
    </div>
  );

  useEffect(() => {
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(allAppointments));
    } catch {
      /* ignore */
    }
  }, [allAppointments]);

  useEffect(() => {
    if (userSeededRef.current) return;
    const hasUserAppointment = allAppointments.some((apt) => apt.patientNIF === user.nif);
    if (!hasUserAppointment) {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      baseDate.setHours(15, 0, 0, 0);
      const newAppointment: Appointment = {
        id: `user-${Date.now()}`,
        date: baseDate,
        time: '15:00',
        duration: 15,
        patientNIF: user.nif,
        patientName: user.name,
        patientContact: user.contact,
        subject: 'Agendamento pessoal',
        description: 'Marcação criada para o seu utilizador',
        status: 'scheduled',
      };
      setAllAppointments((prev) => [...prev, newAppointment]);
      userSeededRef.current = true;
    } else {
      userSeededRef.current = true;
    }
  }, [allAppointments, user.contact, user.name, user.nif]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative">
        <div className="relative">
          <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 relative z-10">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-700 dark:text-gray-200"
                >
                  <MenuIcon className="w-5 h-5" />
                </Button>
                <span className="text-gray-700 dark:text-gray-200">Utilizador</span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={currentView === 'appointments' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('appointments')}
                  className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Secretaria
                </Button>

                <NavDropdown
                  label="Candidaturas"
                  items={[
                    { id: 'creche', label: 'Creche' },
                    { id: 'catl', label: 'CATL' },
                    { id: 'erpi', label: 'ERPI' },
                  ]}
                  isActive={['candidaturas', 'creche', 'catl', 'erpi'].includes(currentView)}
                  onSelect={(id) => setCurrentView(id as ViewType)}
                  isDarkMode={isDarkMode}
                />
              </nav>

              <div className="flex items-center gap-2">
                <div className="relative z-[10000]" ref={notificationsRef}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm transform translate-x-1/4 -translate-y-1/4">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  {showNotifications && (
                    <NotificationsPanel
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAllAsRead={handleMarkAllAsRead}
                      onClose={() => setShowNotifications(false)}
                      onNavigateToPage={() => setCurrentView('notificacoes')}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleDarkMode}
                  className="text-gray-700 dark:text-gray-200"
                >
                  {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-700 dark:text-gray-200">
                  <LogOutIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="w-full px-6 py-6">
            {currentView === 'notificacoes' ? (
              <NotificationsPage
                notifications={notifications}
                onBack={() => setCurrentView('appointments')}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'profile' ? (
              <ProfilePage
                user={user}
                onBack={() => setCurrentView('appointments')}
                onUpdateUser={() => {}}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'history' ? (
              <HistoryPage
                appointments={visibleAppointments}
                onBack={() => setCurrentView('appointments')}
                onViewAppointment={handleViewAppointment}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'appointments' ? (
              <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-[1600px] mx-auto items-start">
                <div className="space-y-6">
                  <WeeklySchedule
                    appointments={visibleAppointments}
                    allAppointments={allAppointments}
                    currentUserNif={user.nif}
                    isClient
                    onCreateAppointment={handleCreateAppointment}
                    onViewAppointment={handleViewAppointment}
                    onToggleView={() => { /* no-op: monthly view removed */ }}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div>
                  <TodayAppointments
                    appointments={visibleAppointments}
                    onViewAppointment={handleViewAppointment}
                    onShowHistory={() => setCurrentView('history')}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            ) : currentView === 'balneario' ? (
              renderPlaceholder('Balneário - Marcações')
            ) : currentView === 'balneario-sobre' ? (
              renderPlaceholder('Balneário - Sobre')
            ) : currentView === 'voluntariado' ? (
              renderPlaceholder('Voluntariado - Inscrição')
            ) : currentView === 'voluntariado-sobre' ? (
              renderPlaceholder('Voluntariado - Sobre')
            ) : currentView === 'settings' ? (
              renderPlaceholder('Definições')
            ) : (
              renderPlaceholder('Em desenvolvimento')
            )}

            {currentView === 'appointments' && (
              <div className="mt-6 max-w-[1600px] mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-purple-600">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-purple-600" />
                  <p className="text-gray-800 dark:text-gray-200">Consulte e agende os seus horários disponíveis.</p>
                </div>
              </div>
            )}
          </main>
        </div>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view as ViewType)}
          onLogout={onLogout}
          isDarkMode={isDarkMode}
          mode="client"
        />

        {showClientDialog && editingSlot && (
          <ClientAppointmentDialog
            open={showClientDialog}
            onClose={() => {
              setShowClientDialog(false);
              setEditingSlot(null);
            }}
            date={editingSlot.date}
            time={editingSlot.time}
            onSave={handleSaveClientAppointment}
          />
        )}

        {showDetailsDialog && selectedAppointment && (
          <AppointmentDetailsDialog
            open={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            onUpdate={handleUpdateSelectedAppointment}
            onCancel={(id, reason) => handleCancelAppointment(id, reason)}
            isClient={true}
          />
        )}

        {showDaySchedule && (
          <DayScheduleDialog
            open={!!showDaySchedule}
            onClose={() => setShowDaySchedule(null)}
            date={showDaySchedule}
            appointments={visibleAppointments}
            onCreateAppointment={handleCreateAppointment}
            onViewAppointment={handleViewAppointment}
          />
        )}
      </div>
    </div>
  );
}
