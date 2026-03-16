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
  PackageIcon,
  WrenchIcon,
  TruckIcon,
  AlertCircleIcon,
  SchoolIcon,
  BabyIcon,
  UsersIcon,
  HeartIcon,
  ShieldCheckIcon,
  FileTextIcon
} from '../shared/CustomIcons';

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
  const isClient = mode === 'client';
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const clientSections = [
    {
      heading: 'Secretaria', items: [
        { id: 'appointments', label: 'Marcações' },
        { id: 'history', label: 'Histórico' },
      ]
    },
    {
      heading: 'Balneário', items: [
        { id: 'balneario', label: 'Marcações' },
        { id: 'balneario-sobre', label: 'Sobre' },
      ]
    },
    {
      heading: 'Voluntariado', items: [
        { id: 'voluntariado', label: 'Inscrição' },
        { id: 'voluntariado-sobre', label: 'Sobre' },
      ]
    },
  ];

  const clientBottom = [
    { id: 'notificacoes', label: 'Notificações', icon: BellIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'settings', label: 'Definições', icon: SlidersIcon },
  ];

  // Main menu structure with subitems for Secretary
  const secretaryMenuItems = [
    {
      id: 'home',
      label: 'Início',
      icon: HomeIcon
    },
    {
      id: 'appointments',
      label: 'Marcações',
      icon: CalendarIcon
    },
    {
      id: 'valencias',
      label: 'Valências',
      icon: BuildingIcon,
      subitems: [
        { id: 'balneario', label: 'Balneário', icon: UsersIcon },
        { id: 'escola', label: 'Escola', icon: SchoolIcon },
      ]
    },
    {
      id: 'requisitions',
      label: 'Requisições',
      icon: ClipboardListIcon,
      subitems: [
        { id: 'requisitions', label: 'Geral', icon: HomeIcon },
        { id: 'material', label: 'Material', icon: PackageIcon },
        { id: 'manutencao', label: 'Manutenção', icon: WrenchIcon },
        { id: 'transportes', label: 'Transporte', icon: TruckIcon },
        { id: 'urgente', label: 'Prioridade Alta', icon: AlertCircleIcon },
      ]
    },
    {
      id: 'candidaturas',
      label: 'Candidaturas',
      icon: FileTextIcon,
      subitems: [
        { id: 'creche', label: 'Creche', icon: BabyIcon },
        { id: 'catl', label: 'CATL', icon: UsersIcon },
        { id: 'erpi', label: 'ERPI', icon: HeartIcon },
      ]
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: HistoryIcon
    },
    {
      id: 'management',
      label: 'Gestão',
      icon: DatabaseIcon
    },
  ];

  // Main menu structure for Client (User Dashboard)
  const clientMenuItems = [
    {
      id: 'appointments',
      label: 'Secretaria',
      icon: CalendarIcon
    },
    {
      id: 'candidaturas',
      label: 'Candidaturas',
      icon: FileTextIcon,
      subitems: [
        { id: 'creche', label: 'Creche', icon: BabyIcon },
        { id: 'catl', label: 'CATL', icon: UsersIcon },
        { id: 'erpi', label: 'ERPI', icon: HeartIcon },
      ]
    },
  ];

  const generalItems = [
    { id: 'notificacoes', label: 'Notificações', icon: BellIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'settings', label: 'Definições', icon: SlidersIcon },
  ];

  const secretaryGeneralItems = [
    { id: 'notificacoes', label: 'Notificações', icon: BellIcon },
    { id: 'administrative', label: 'Área Administrativa', icon: ShieldCheckIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'settings', label: 'Definições', icon: SlidersIcon },
  ];

  // Main menu structure for Balneario
  const balnearioMenuItems = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'appointments', label: 'Marcações', icon: CalendarIcon },
    { id: 'consumos', label: 'Consumos', icon: HistoryIcon }, // using HistoryIcon temporarily
    { id: 'requisitions', label: 'Requisições', icon: ClipboardListIcon },
    { id: 'reports', label: 'Relatórios', icon: FileTextIcon },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-label="Fechar menu lateral"
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800">
            <div className="flex items-center gap-3">
              <img
                src={isDarkMode ? '/assets/LogoModoEscuro1.png' : '/assets/LogoSemTextoUltimo.png'}
                alt="Logo Florinhas"
                className="h-12 w-auto object-contain"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">Florinhas do Vouga</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Menu</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-5 h-5" />}
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
                                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${isSubActive
                                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
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
                <h3 className="text-xs text-gray-500 dark:text-gray-500 uppercase px-4 mb-2">Geral</h3>
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          </div>

          <div className="p-4 border-t dark:border-gray-800">
            <button
              onClick={() => {
                const confirmed = window.confirm('Tem a certeza que quer sair?');
                if (confirmed) {
                  onLogout();
                  onClose();
                }
              }}
              aria-label="Terminar sessão"
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
