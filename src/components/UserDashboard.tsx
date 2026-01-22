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
import { ArrowLeftIcon, BellIcon, CalendarIcon, FileTextIcon as FolderIcon, HistoryIcon, HomeIcon, LogOutIcon, MenuIcon, UserIcon, ClockIcon, SunIcon, MoonIcon, ClipboardListIcon as ClipboardIcon } from './CustomIcons';
import type { Appointment } from './SecretaryDashboard';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { marcacoesApi } from '../services/api';
import { notificationsApi, Notificacao } from '../services/notificationsApi';

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
  const { user: authUser } = useAuth();
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [blockedAppointments, setBlockedAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  // Navigation History Stack
  const [viewHistory, setViewHistory] = useState<ViewType[]>(() => {
    const saved = localStorage.getItem('userDashboardView');
    return saved ? [saved as ViewType] : ['appointments'];
  });

  const currentView = viewHistory[viewHistory.length - 1] || 'appointments';

  const navigateTo = (view: ViewType) => {
    setViewHistory(prev => [...prev, view]);
  };

  const navigateBack = () => {
    setViewHistory(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return ['appointments'];
    });
  };
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

  // Carregar marcações da API
  const carregarMarcacoes = async () => {
    if (!authUser?.id) return;

    console.log('authUser no UserDashboard:', authUser);

    setIsLoadingAppointments(true);
    try {
      // Carregar marcações próprias
      const marcacoes = await marcacoesApi.obterPorUtente(authUser.id);

      // Converter formato da API para o formato do componente
      const appointmentsFromAPI: Appointment[] = marcacoes.map((m) => {
        const dataHora = new Date(m.data);

        // Mapear estado da API para o formato esperado
        let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'no-show' = 'scheduled';
        if (m.estado) {
          const estadoUpper = m.estado.toUpperCase();
          if (estadoUpper === 'AGENDADO') status = 'scheduled';
          else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
          else if (estadoUpper === 'AVISO') status = 'warning';
          else if (estadoUpper === 'CONCLUIDO') status = 'completed';
          else if (estadoUpper === 'CANCELADO') status = 'cancelled';
          else if (estadoUpper === 'NAO_COMPARECIDO') status = 'no-show';
        }

        return {
          id: m.id.toString(),
          date: dataHora,
          time: `${dataHora.getHours().toString().padStart(2, '0')}:${dataHora.getMinutes().toString().padStart(2, '0')}`,
          duration: 15,
          patientNIF: authUser?.nif || '',
          patientName: authUser?.nome || '',
          patientContact: authUser?.telefone || '',
          patientEmail: authUser?.email || '',
          subject: m.marcacaoSecretaria?.assunto || 'Sem assunto',
          description: m.marcacaoSecretaria?.descricao || '',
          status: status,
          attendantName: m.atendenteNome,
        };
      });

      setAllAppointments(appointmentsFromAPI);

      const bloqueadas = await marcacoesApi.obterMarcacoesBloqueadas(authUser.id);
      const blockedFromAPI: Appointment[] = bloqueadas.map((b: any) => {
        const dataHora = new Date(b.data);
        const isReserved = b.estado === 'EM_PREENCHIMENTO';

        return {
          id: b.id.toString(),
          date: dataHora,
          time: `${dataHora.getHours().toString().padStart(2, '0')}:${dataHora.getMinutes().toString().padStart(2, '0')}`,
          duration: 15,
          patientNIF: '',
          patientName: isReserved ? 'Reservado' : 'Ocupado',
          patientContact: '',
          patientEmail: '',
          subject: isReserved ? 'Horário Indisponível' : 'Ocupado',
          description: '',
          status: isReserved ? 'reserved' : 'scheduled', // 'reserved' fica "reserved", 'scheduled' (de outro) fica bloqueado normal
        };
      });

      setBlockedAppointments(blockedFromAPI);
      console.log(`${appointmentsFromAPI.length} marcações próprias e ${blockedFromAPI.length} bloqueadas carregadas`);
    } catch (error) {
      console.error('Erro ao carregar marcações:', error);
      toast.error('Erro ao carregar marcações');
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Carregar marcações ao montar o componente
  useEffect(() => {
    carregarMarcacoes();
  }, [authUser?.id]);

  // Recarregar marcações quando volta ao separador de appointments
  useEffect(() => {
    if (currentView === 'appointments') {
      carregarMarcacoes();
    }
  }, [currentView]);

  // Persist view changes
  useEffect(() => {
    localStorage.setItem('userDashboardView', currentView);
  }, [currentView]);

  // Atualização automática a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentView === 'appointments') {
        carregarMarcacoes();
      }
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [currentView]);

  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const carregarNotificacoes = async () => {
    try {
      console.log('Fetching notifications for user:', authUser?.id);
      const data = await notificationsApi.listar();
      console.log('Notifications fetched:', data);
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      carregarNotificacoes();
    }
  }, [authUser?.id]);

  // Atualizar notificações no intervalo
  useEffect(() => {
    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      await notificationsApi.marcarComoLida(id);
      // carregarNotificacoes(); // Optional to ensure sync
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      await notificationsApi.marcarTodasComoLidas();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  const visibleAppointments = useMemo(
    () => allAppointments.filter((apt) => apt.patientNIF === user.nif),
    [allAppointments, user.nif]
  );

  const handleCreateAppointment = async (date: Date, time: string) => {
    // Recarregar marcações antes de abrir o dialog
    await carregarMarcacoes();
    setEditingSlot({ date, time });
    setShowClientDialog(true);
  };

  const handleViewAppointment = async (appointment: Appointment) => {
    try {
      // Fetch fresh data
      const latestData = await marcacoesApi.obterPorId(parseInt(appointment.id));

      const dateTime = new Date(latestData.data);
      const utente = latestData.marcacaoSecretaria?.utente;

      // Determine if this is own appointment or blocked slot (other user)
      const isOwnAppointment = utente?.nif === user.nif || appointment.patientNIF === user.nif;

      let status: 'scheduled' | 'in-progress' | 'warning' | 'completed' | 'cancelled' | 'reserved' | 'no-show' = 'scheduled';
      const estadoUpper = latestData.estado?.toUpperCase();

      if (latestData.estado) {
        if (estadoUpper === 'EM_PREENCHIMENTO') status = 'reserved';
        else if (estadoUpper === 'AGENDADO') status = 'scheduled';
        else if (estadoUpper === 'EM_PROGRESSO' || estadoUpper === 'EM PROGRESSO') status = 'in-progress';
        else if (estadoUpper === 'AVISO') status = 'warning';
        else if (estadoUpper === 'CONCLUIDO') status = 'completed';
        else if (estadoUpper === 'CANCELADO') status = 'cancelled';
        else if (estadoUpper === 'NAO_COMPARECIDO') status = 'no-show';
      }

      const freshAppointment: Appointment = {
        id: latestData.id.toString(),
        version: latestData.version,
        date: dateTime,
        time: dateTime.toTimeString().slice(0, 5),
        duration: 15,
        // For own appointments show full info, for others show restricted info
        patientNIF: isOwnAppointment ? (utente?.nif || 'N/A') : '',
        patientName: isOwnAppointment ? (utente?.nome || 'Nome não disponível') : '',
        patientContact: isOwnAppointment ? (utente?.telefone || 'N/A') : '',
        patientEmail: isOwnAppointment ? (utente?.email || 'Email não disponível') : '',
        subject: isOwnAppointment ? (latestData.marcacaoSecretaria?.assunto || 'Sem assunto') : '',
        description: isOwnAppointment ? (latestData.marcacaoSecretaria?.descricao || '') : '',
        status: status,
        attendantName: latestData.atendenteNome,
      };

      // Update in appropriate list
      if (isOwnAppointment) {
        setAllAppointments(prev => prev.map(apt => apt.id === freshAppointment.id ? freshAppointment : apt));
      } else {
        // If it's a blocked appointment (other user), update blocked list if needed
        // Assuming blocked list structure is simpler, but keeping consistency
      }

      setSelectedAppointment(freshAppointment);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Erro ao atualizar marcação:', error);
      toast.error('Não foi possível carregar os dados mais recentes da marcação.');
      carregarMarcacoes();
    }
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

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen relative">
        <div className="relative">
          <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 relative z-10">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={isDarkMode ? '/assets/LogoModoEscuro1.png' : '/assets/LogoSemTextoUltimo.png'}
                  alt="Logo Florinhas do Vouga"
                  className="h-10 w-auto object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-700 dark:text-gray-200"
                >
                  <MenuIcon className="w-5 h-5" />
                </Button>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={currentView === 'appointments' ? 'default' : 'ghost'}
                  onClick={() => navigateTo('appointments')}
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
                  onSelect={(id) => navigateTo(id as ViewType)}
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
                      notifications={notifications.map(n => ({
                        id: n.id.toString(),
                        title: n.titulo,
                        message: n.mensagem,
                        timestamp: n.dataCriacao,
                        isRead: n.lida,
                        icon: n.tipo === 'LEMBRETE' ? 'calendar' : n.tipo === 'FICHEIRO' ? 'document' : 'alert'
                      }))}
                      onMarkAsRead={(id) => handleMarkAsRead(parseInt(id))}
                      onMarkAllAsRead={handleMarkAllAsRead}
                      onClose={() => setShowNotifications(false)}
                      onNavigateToPage={() => navigateTo('notificacoes')}
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
                notifications={notifications.map(n => ({
                  id: n.id.toString(),
                  title: n.titulo,
                  message: n.mensagem,
                  timestamp: n.dataCriacao,
                  isRead: n.lida,
                  icon: n.tipo === 'LEMBRETE' ? 'calendar' : n.tipo === 'FICHEIRO' ? 'document' : 'alert' // Simple mapping
                }))}
                onBack={() => navigateBack()}
                onMarkAsRead={(id) => handleMarkAsRead(parseInt(id))}
                onMarkAllAsRead={handleMarkAllAsRead}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'profile' ? (
              <ProfilePage
                user={{
                  id: authUser?.id || 0,
                  name: authUser?.nome || user.name,
                  nif: authUser?.nif || user.nif,
                  contact: authUser?.telefone || user.contact,
                  email: authUser?.email || user.email,
                }}
                onBack={() => navigateBack()}
                onUpdateUser={() => { }}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'history' ? (
              <HistoryPage
                appointments={visibleAppointments.filter(apt =>
                  apt.status !== 'scheduled' &&
                  apt.status !== 'in-progress' &&
                  apt.status !== 'reserved'
                )}
                onBack={() => navigateBack()}
                onViewAppointment={handleViewAppointment}
                isDarkMode={isDarkMode}
              />
            ) : currentView === 'appointments' ? (
              <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-[1600px] mx-auto items-start">
                <div className="space-y-6">
                  <WeeklySchedule
                    appointments={visibleAppointments}
                    allAppointments={[...allAppointments, ...blockedAppointments]}
                    currentUserNif={user.nif}
                    isClient
                    onCreateAppointment={handleCreateAppointment}
                    onViewAppointment={handleViewAppointment}
                    onToggleView={() => { /* no-op: monthly view removed */ }}
                    isDarkMode={isDarkMode}
                    onRefresh={carregarMarcacoes}
                  />
                </div>

                <div>
                  <TodayAppointments
                    appointments={visibleAppointments}
                    onViewAppointment={handleViewAppointment}
                    onShowHistory={() => navigateTo('history')}
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
          onNavigate={(view) => navigateTo(view as ViewType)}
          onLogout={onLogout}
          isDarkMode={isDarkMode}
          mode="client"
        />

        {showClientDialog && editingSlot && authUser && (
          <ClientAppointmentDialog
            open={showClientDialog}
            onClose={() => {
              setShowClientDialog(false);
              setEditingSlot(null);
            }}
            date={editingSlot.date}
            time={editingSlot.time}
            utenteId={authUser.id}
            onSuccess={() => {
              carregarMarcacoes();
              carregarNotificacoes();
            }}
          />
        )}

        {showDetailsDialog && selectedAppointment && (
          <AppointmentDetailsDialog
            open={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedAppointment(null);
              carregarMarcacoes();
            }}
            appointment={selectedAppointment}
            onUpdate={handleUpdateSelectedAppointment}
            onCancel={(id, reason) => handleCancelAppointment(id, reason)}
            isClient={true}
            existingAppointments={[...allAppointments, ...blockedAppointments]}
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
