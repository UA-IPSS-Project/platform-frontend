import { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { NavDropdown } from './ui/NavDropdown';
import { NotificationsPanel } from './ui/NotificationsPanel';
import { NotificationsPage } from './NotificationsPage';
import { WeeklySchedule } from './secretary/WeeklySchedule';
import { TodayAppointments } from './secretary/TodayAppointments';
import { HistoryPage } from './secretary/HistoryPage';
import SecretaryHome from './secretary/SecretaryHome';
import { AppointmentDialog } from './secretary/AppointmentDialog';
import { AppointmentDetailsDialog } from './secretary/AppointmentDetailsDialog';
import { DayScheduleDialog } from './secretary/DayScheduleDialog';
import { Sidebar } from './Sidebar';
import { ProfilePage } from './ProfilePage';
import { BellIcon, MenuIcon, MoonIcon, SunIcon, ClockIcon, LogOutIcon } from './CustomIcons';
import { toast } from 'sonner';

interface SecretaryDashboardProps {
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

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  duration: number;
  patientNIF: string;
  patientName: string;
  patientContact: string;
  subject: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'warning' | 'cancelled';
  cancellationReason?: string;
  documents?: { name: string; invalid?: boolean; reason?: string }[];
}

const MARIA_OLD_NIF = '123456789';
const MARIA_NEW_NIF = '123450001';
const SEED_PATIENTS = new Set(['Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Oliveira', 'Carlos Mendes']);
const SEED_IDS = new Set(['1', '2', '3', '4', '5']);
const APPOINTMENTS_KEY = 'appointments';

const ensureWeekday = (date: Date) => {
  const adjusted = new Date(date.getTime());
  while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
};

export const generateMockAppointments = (): Appointment[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [
    {
      id: '1',
      date: new Date(today.getTime()),
      time: '09:00',
      duration: 15,
      patientNIF: MARIA_NEW_NIF,
      patientName: 'Maria Silva',
      patientContact: '912345678',
      subject: 'Pagar mensalidade',
      description: 'Pagamento mensal',
      status: 'scheduled',
      documents: [{ name: 'Comprovativo.pdf' }],
    },
    {
      id: '2',
      date: new Date(today.getTime()),
      time: '10:30',
      duration: 15,
      patientNIF: '987654321',
      patientName: 'João Santos',
      patientContact: '923456789',
      subject: 'Renovação de Documentos',
      description: 'Renovação anual',
      status: 'scheduled',
    },
    {
      id: '3',
      date: new Date(today.getTime()),
      time: '14:00',
      duration: 15,
      patientNIF: '456789123',
      patientName: 'Ana Costa',
      patientContact: '934567890',
      subject: 'Informações Gerais',
      description: 'Pedido de informações',
      status: 'in-progress',
    },
    {
      id: '4',
      date: new Date(today.getTime()),
      time: '15:30',
      duration: 15,
      patientNIF: '789123456',
      patientName: 'Pedro Oliveira',
      patientContact: '945678901',
      subject: 'Agendamento de Exame',
      description: 'Marcação de exame',
      status: 'warning',
      documents: [
        { name: 'Requisicao.pdf', invalid: true, reason: 'Documento ilegível' },
        { name: 'Documento2.pdf' },
      ],
    },
    {
      id: '5',
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      time: '10:00',
      duration: 15,
      patientNIF: '111222333',
      patientName: 'Carlos Mendes',
      patientContact: '911222333',
      subject: 'Reunião com educadora / assistente social',
      description: 'Reunião trimestral',
      status: 'scheduled',
    },
  ];
};

// Re-anchors the demo appointments to today so they don't stay stuck in past dates after syncing
export const normalizeMockAppointments = (appointments: Appointment[]): Appointment[] => {
  const today = ensureWeekday(new Date(new Date().setHours(0, 0, 0, 0)));

  return appointments.map((apt) => {
    const isSeed = SEED_IDS.has(apt.id) && SEED_PATIENTS.has(apt.patientName);
    if (!isSeed) return apt;

    const normalizedDate = new Date(today.getTime());
    if (apt.id === '5') {
      normalizedDate.setDate(normalizedDate.getDate() + 2);
    }

    return { ...apt, date: ensureWeekday(normalizedDate) };
  });
};

type ViewType = 'home' | 'requisitions' | 'sections' | 'appointments' | 'management' | 'more' | 'profile' | 'history' | 'settings' | 'administrative' | 'material' | 'manutencao' | 'transportes' | 'urgente' | 'balneario' | 'escola' | 'valencias' | 'candidaturas' | 'creche' | 'catl' | 'erpi' | 'reports' | string;

export function SecretaryDashboard({ user, onLogout, isDarkMode, onToggleDarkMode }: SecretaryDashboardProps) {
  const loadAppointments = () => {
    try {
      const raw = localStorage.getItem(APPOINTMENTS_KEY);
      if (raw) {
        const parsed: Appointment[] = JSON.parse(raw).map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          patientNIF: apt.patientName === 'Maria Silva' && apt.patientNIF === MARIA_OLD_NIF ? MARIA_NEW_NIF : apt.patientNIF,
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

  const [appointments, setAppointments] = useState<Appointment[]>(loadAppointments());
  const [userData, setUserData] = useState(user);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDaySchedule, setShowDaySchedule] = useState<Date | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<{ date: Date; time: string } | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  // Monthly view removed - always use weekly schedule
  const [scheduleView] = useState<'weekly' | 'monthly'>('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Sample notifications for secretary
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Relatório Mensal Disponível',
      message: 'O relatório mensal de dezembro já está disponível para consulta.',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      isRead: false,
      icon: 'document' as const,
    },
    {
      id: '2',
      title: 'Nova marcação agendada',
      message: 'João Santos agendou uma marcação para amanhã às 10:00.',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      isRead: false,
      icon: 'calendar' as const,
    },
    {
      id: '3',
      title: 'Candidatura aprovada',
      message: 'A candidatura de Maria Silva para CATL foi aprovada.',
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      isRead: true,
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

  const handleCreateAppointment = (date: Date, time: string) => {
    setEditingAppointment({ date, time });
    setShowAppointmentDialog(true);
  };

  const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    if (!editingAppointment) {
      toast.error('Houve um erro, tente novamente');
      return;
    }

    try {
      const newAppointment: Appointment = {
        ...appointmentData,
        id: Date.now().toString(),
        status: 'scheduled',
      };

      setAppointments([...appointments, newAppointment]);
      toast.success('Marcação feita com sucesso!');
      setShowAppointmentDialog(false);
      setEditingAppointment(null);
    } catch {
      toast.error('Houve um erro, tente novamente');
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsDialog(true);
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, ...updates } : apt
    ));
  };

  useEffect(() => {
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch {
      /* ignore */
    }
  }, [appointments]);

  const handleCancelAppointment = (id: string, reason: string) => {
    handleUpdateAppointment(id, { status: 'cancelled', cancellationReason: reason });
    toast.success('Marcação cancelada e utente notificado com o motivo');
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleUpdateUser = (updatedUser: { name: string; nif: string; contact: string; email: string }) => {
    setUserData(updatedUser);
  };

  const getCurrentActivity = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const todayAppointments = appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime() && apt.status !== 'cancelled';
      })
      .sort((a, b) => {
        const [aHour, aMin] = a.time.split(':').map(Number);
        const [bHour, bMin] = b.time.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
      });

    // Check for in-progress appointment
    const inProgressApt = todayAppointments.find(apt => apt.status === 'in-progress');
    if (inProgressApt) {
      return `Atendimento a decorrer - ${inProgressApt.patientName}`;
    }

    // Find next upcoming appointment
    for (const apt of todayAppointments) {
      const [hour, minute] = apt.time.split(':').map(Number);
      const aptTime = hour * 60 + minute;

      if (currentTime < aptTime) {
        const diff = aptTime - currentTime;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;

        if (hours > 0) {
          return `Próximo agendamento em ${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        } else {
          return `Próximo agendamento em ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
      }
    }

    return 'Ainda não existem marcações para hoje';
  };

  const currentActivity = getCurrentActivity();

  const renderPlaceholder = (view: ViewType) => (
    <div className="flex items-center justify-center h-[600px]">
      <div className="text-center">
        <h2 className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
          {view === 'requisitions' && 'Requisições'}
          {view === 'sections' && 'Secções'}
          {view === 'management' && 'Gestão'}
          {view === 'settings' && 'Definições'}
          {view === 'more' && 'Mais'}
          {view === 'administrative' && 'Área Administrativa'}
          {view === 'material' && 'Requisições - Material'}
          {view === 'manutencao' && 'Requisições - Manutenção'}
          {view === 'transportes' && 'Requisições - Transporte'}
          {view === 'urgente' && 'Requisições - Prioridade Alta'}
          {view === 'balneario' && 'Valências - Balneário'}
          {view === 'escola' && 'Valências - Escola'}
          {view === 'valencias' && 'Valências'}
          {view === 'candidaturas' && 'Candidaturas'}
          {view === 'creche' && 'Candidaturas - Creche'}
          {view === 'catl' && 'Candidaturas - CATL'}
          {view === 'erpi' && 'Candidaturas - ERPI'}
          {view === 'reports' && 'Relatórios'}
          {!['home', 'requisitions', 'sections', 'management', 'settings', 'more', 'appointments', 'profile', 'history', 'notificacoes', 'administrative', 'material', 'manutencao', 'transportes', 'urgente', 'balneario', 'escola', 'valencias', 'candidaturas', 'creche', 'catl', 'erpi', 'reports'].includes(view) && view.charAt(0).toUpperCase() + view.slice(1)}
        </h2>
        <p className="text-gray-500 dark:text-gray-500">Em desenvolvimento</p>
      </div>
    </div>
  );

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative">
        {/* Content */}
        <div className="relative">
          {/* Header - Full Width */}
          <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 relative z-10">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-gray-700 dark:text-gray-200">
                  <MenuIcon className="w-5 h-5" />
                </Button>
                <span className="text-gray-700 dark:text-gray-200">Secretaria</span>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <NavDropdown
                  label="Requisições"
                  items={[
                    { id: 'material', label: 'Material' },
                    { id: 'manutencao', label: 'Manutenção' },
                    { id: 'transportes', label: 'Transporte' },
                    { id: 'urgente', label: 'Prioridade Alta' },
                  ]}
                  isActive={['requisitions', 'material', 'manutencao', 'transportes', 'urgente'].includes(currentView)}
                  onSelect={(id) => setCurrentView(id as ViewType)}
                  isDarkMode={isDarkMode}
                />

                <NavDropdown
                  label="Valências"
                  items={[
                    { id: 'balneario', label: 'Balneário' },
                    { id: 'escola', label: 'Escola' },
                  ]}
                  isActive={['valencias', 'balneario', 'escola'].includes(currentView)}
                  onSelect={(id) => setCurrentView(id as ViewType)}
                  isDarkMode={isDarkMode}
                />

                <Button
                  variant={currentView === 'appointments' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('appointments')}
                  className={`text-sm ${currentView === 'appointments' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Marcações
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

                <Button
                  variant={currentView === 'reports' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('reports')}
                  className={`text-sm ${currentView === 'reports' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Relatórios
                </Button>

                <Button
                  variant={currentView === 'management' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('management')}
                  className={`text-sm ${currentView === 'management' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  Gestão
                </Button>
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

          {/* Main Content */}
          <main className="w-full px-6 py-6">
            {currentView === 'home' ? (
              <SecretaryHome
                isDarkMode={isDarkMode}
                onNavigate={setCurrentView}
              />
            ) : currentView === 'notificacoes' ? (
              <NotificationsPage
                notifications={notifications}
                onBack={() => setCurrentView('home')}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'profile' ? (
              <ProfilePage
                user={userData}
                onBack={() => setCurrentView('home')}
                onUpdateUser={handleUpdateUser}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'history' ? (
              <HistoryPage
                appointments={appointments}
                onBack={() => setCurrentView('home')}
                onViewAppointment={handleViewAppointment}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'appointments' ? (
              <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-[1600px] mx-auto items-start">
                {/* Left Column - Schedules */}
                <div className="space-y-6">
                  <WeeklySchedule
                    appointments={appointments}
                    onCreateAppointment={handleCreateAppointment}
                    onViewAppointment={handleViewAppointment}
                    onToggleView={() => { /* no-op: monthly view removed */ }}
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Right Column - Today's Appointments */}
                <div>
                  <TodayAppointments
                    appointments={appointments}
                    onViewAppointment={handleViewAppointment}
                    onShowHistory={() => setCurrentView('history')}
                    showFilter={true}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            ) : (
              renderPlaceholder(currentView)
            )}

            {/* Activity Banner - Always visible on appointments page */}
            {currentView === 'appointments' && (
              <div className="mt-6 max-w-[1600px] mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-l-4 border-purple-600">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-purple-600" />
                  <p className="text-gray-800 dark:text-gray-200">{currentActivity}</p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          isDarkMode={isDarkMode}
        />

        {/* Dialogs */}
        {showAppointmentDialog && editingAppointment && (
          <AppointmentDialog
            open={showAppointmentDialog}
            onClose={() => {
              setShowAppointmentDialog(false);
              setEditingAppointment(null);
            }}
            onSave={handleSaveAppointment}
            date={editingAppointment.date}
            time={editingAppointment.time}
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
            onUpdate={handleUpdateAppointment}
            onCancel={handleCancelAppointment}
          />
        )}



        {showDaySchedule && (
          <DayScheduleDialog
            open={!!showDaySchedule}
            onClose={() => setShowDaySchedule(null)}
            date={showDaySchedule}
            appointments={appointments}
            onCreateAppointment={handleCreateAppointment}
            onViewAppointment={handleViewAppointment}
          />
        )}
      </div>
    </div>
  );
}