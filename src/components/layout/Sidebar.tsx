import { useState } from 'react';
import {
  CalendarIcon,
  HistoryIcon,
  DatabaseIcon,
  SlidersIcon,
  UserIcon,
  LogOutIcon,
  XIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  ClipboardListIcon,
  BuildingIcon,
  SchoolIcon,
  BabyIcon,
  UsersIcon,
  HeartIcon,
  ShieldCheckIcon,
  FileTextIcon
} from '../shared/CustomIcons';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  mode?: 'client' | 'secretaria' | 'balneario';
}

export function Sidebar({ isOpen, onClose, currentView, onNavigate, onLogout, isDarkMode, mode = 'secretaria' }: SidebarProps) {
  const { t } = useTranslation();
  const isClient = mode === 'client';
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };


  // Main menu structure with subitems for Secretary
  const secretaryMenuItems = [
    {
      id: 'home',
      label: t('sidebar.home'),
      icon: HomeIcon
    },
    {
      id: 'appointments',
      label: t('sidebar.appointments'),
      icon: CalendarIcon
    },
    {
      id: 'valencias',
      label: t('sidebar.services'),
      icon: BuildingIcon,
      subitems: [
        { id: 'balneario', label: t('sidebar.balneario'), icon: UsersIcon },
        { id: 'escola', label: t('sidebar.school'), icon: SchoolIcon },
      ]
    },
    {
      id: 'requisitions',
      label: t('sidebar.requisitions'),
      icon: ClipboardListIcon,
      subitems: [
        { id: 'requisitions', label: t('sidebar.requisitions'), icon: HomeIcon },
        { id: 'requisitions-create', label: t('sidebar.createRequisition'), icon: ClipboardListIcon },
      ]
    },
    {
      id: 'candidaturas',
      label: t('sidebar.applications'),
      icon: FileTextIcon,
      subitems: [
        { id: 'creche', label: t('sidebar.creche'), icon: BabyIcon },
        { id: 'catl', label: 'CATL', icon: UsersIcon },
        { id: 'erpi', label: 'ERPI', icon: HeartIcon },
      ]
    },
    {
      id: 'reports',
      label: t('sidebar.reports'),
      icon: HistoryIcon
    },
    {
      id: 'management',
      label: t('sidebar.management'),
      icon: DatabaseIcon,
      subitems: [
        { id: 'management', label: t('userManagement.title', 'Gestão de Utilizadores'), icon: UserIcon },
        { id: 'admin-area', label: t('userManagement.title2', 'Gestão da Plataforma'), icon: SlidersIcon },
      ]
    },
  ];

  // Main menu structure for Client (User Dashboard)
  const clientMenuItems = [
    {
      id: 'appointments',
      label: t('sidebar.secretary'),
      icon: CalendarIcon
    },
    {
      id: 'candidaturas',
      label: t('sidebar.applications'),
      icon: FileTextIcon,
      subitems: [
        { id: 'creche', label: t('sidebar.creche'), icon: BabyIcon },
        { id: 'catl', label: 'CATL', icon: UsersIcon },
        { id: 'erpi', label: 'ERPI', icon: HeartIcon },
      ]
    },
  ];

  const generalItems = [
    { id: 'notificacoes', label: t('sidebar.notifications'), icon: BellIcon },
    { id: 'profile', label: t('sidebar.profile'), icon: UserIcon },
    { id: 'settings', label: t('sidebar.settings'), icon: SlidersIcon },
  ];

  const secretaryGeneralItems = [
    { id: 'notificacoes', label: t('sidebar.notifications'), icon: BellIcon },
    { id: 'administrative', label: t('sidebar.administrativeArea'), icon: ShieldCheckIcon },
    { id: 'profile', label: t('sidebar.profile'), icon: UserIcon },
    { id: 'settings', label: t('sidebar.settings'), icon: SlidersIcon },
  ];

  // Main menu structure for Balneario
  const balnearioMenuItems = [
    { id: 'home', label: t('sidebar.home'), icon: HomeIcon },
    { id: 'appointments', label: t('sidebar.appointments'), icon: CalendarIcon },
    { id: 'consumos', label: t('sidebar.consumption'), icon: HistoryIcon },
    { id: 'requisitions', label: t('sidebar.requisitions'), icon: ClipboardListIcon },
    { id: 'reports', label: t('sidebar.reports'), icon: FileTextIcon },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-label={t('sidebar.closeSidebar')}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-card shadow-xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={isDarkMode ? '/assets/LogoSemTextoModoEscuro.png' : '/assets/LogoSemTexto.png'}
                alt="Logo Florinhas"
                className="h-12 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-tight">Florinhas do Vouga</span>
                <span className="text-xs text-muted-foreground">{t('sidebar.menu')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('sidebar.closeSidebar')}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <>
              <div className="space-y-1 mb-6">
                {((isClient ? clientMenuItems : (mode === 'balneario' ? balnearioMenuItems : secretaryMenuItems)) as any[]).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const hasSubitems = item.subitems && item.subitems.length > 0;
                  const isExpanded = expandedMenus.includes(item.id);

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => {
                          if (hasSubitems) {
                            toggleMenu(item.id);
                          } else {
                            onNavigate(item.id);
                            onClose();
                          }
                        }}
                        aria-label={hasSubitems ? `${item.label} — expandir submenu` : `Ir para ${item.label}`}
                        aria-current={isActive && !hasSubitems ? 'page' : undefined}
                        aria-expanded={hasSubitems ? isExpanded : undefined}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-foreground/80 hover:bg-primary/10 hover:text-primary'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                          <span>{item.label}</span>
                        </div>
                        {hasSubitems && (
                          isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )
                        )}
                      </button>

                      {/* Subitems */}
                      {hasSubitems && 'subitems' in item && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subitems!.map((subitem: any) => {
                            const SubIcon = subitem.icon;
                            const isSubActive = currentView === subitem.id;
                            return (
                              <button
                                key={subitem.id}
                                onClick={() => {
                                  onNavigate(subitem.id);
                                  onClose();
                                }}
                                aria-label={`Ir para ${subitem.label}`}
                                aria-current={isSubActive ? 'page' : undefined}
                                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${isSubActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                  }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" aria-hidden="true" />}
                                <span>{subitem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* GERAL section */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase px-4 mb-2">{t('sidebar.general')}</h3>
                <div className="space-y-1">
                  {(isClient ? generalItems : secretaryGeneralItems).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        aria-label={`Ir para ${item.label}`}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-foreground/80 hover:bg-primary/10 hover:text-primary'
                          }`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          </div>

          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                const confirmed = window.confirm('Tem a certeza que quer sair?');
                if (confirmed) {
                  onLogout();
                  onClose();
                }
              }}
              aria-label="Terminar sessão"
              className="w-full flex items-center gap-3 px-4 py-3 text-status-error hover:bg-status-error-soft rounded-lg transition-colors"
            >
              <LogOutIcon className="w-5 h-5" aria-hidden="true" />
              <span>{t('header.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
