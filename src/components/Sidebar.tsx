import { CalendarIcon, HistoryIcon, DatabaseIcon, SlidersIcon, UserIcon, LogOutIcon, XIcon, BellIcon } from './CustomIcons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  mode?: 'client' | 'secretaria';
}

export function Sidebar({ isOpen, onClose, currentView, onNavigate, onLogout, isDarkMode, mode = 'secretaria' }: SidebarProps) {
  const isClient = mode === 'client';

  const clientSections = [
    { heading: 'Secretaria', items: [
      { id: 'appointments', label: 'Marcações' },
      { id: 'history', label: 'Histórico' },
    ]},
    { heading: 'Balneário', items: [
      { id: 'balneario', label: 'Marcações' },
      { id: 'balneario-sobre', label: 'Sobre' },
    ]},
    { heading: 'Voluntariado', items: [
      { id: 'voluntariado', label: 'Inscrição' },
      { id: 'voluntariado-sobre', label: 'Sobre' },
    ]},
  ];

  const clientBottom = [
    { id: 'notificacoes', label: 'Notificações', icon: BellIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'settings', label: 'Definições', icon: SlidersIcon },
  ];

  const menuItems = [
    { id: 'appointments', label: 'Marcações', icon: CalendarIcon },
    { id: 'history', label: 'Histórico de marcações', icon: HistoryIcon },
  ];

  const sections = [
    { id: 'balneario', label: 'Balneário', parent: 'sections' },
    { id: 'escola', label: 'Escola', parent: 'sections' },
  ];

  const requisitions = [
    { id: 'transportes', label: 'Transportes', parent: 'requisitions' },
    { id: 'material', label: 'Material', parent: 'requisitions' },
    { id: 'manutencao', label: 'Manutenção', parent: 'requisitions' },
    { id: 'urgente', label: 'Prioridade Elevada', parent: 'requisitions' },
  ];

  const bottomItems = [
    { id: 'management', label: 'Gestão', icon: DatabaseIcon },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'settings', label: 'Definições', icon: SlidersIcon },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            <h2 className="text-lg text-gray-900 dark:text-gray-100">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isClient ? (
              <div className="space-y-6">
                {clientSections.map((section) => (
                  <div key={section.heading}>
                    <div className="px-4 text-xs text-gray-500 dark:text-gray-500 uppercase mb-2">{section.heading}</div>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onNavigate(item.id);
                              onClose();
                            }}
                            className={`w-full text-left px-6 py-3 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="space-y-1">
                  {clientBottom.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
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
            ) : (
              <>
                <div className="space-y-1 mb-6">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
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

                <div className="mb-6">
                  <h3 className="text-xs text-gray-500 dark:text-gray-500 uppercase px-4 mb-2">Secções</h3>
                  <div className="space-y-1">
                    {sections.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className="w-full text-left px-8 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xs text-gray-500 dark:text-gray-500 uppercase px-4 mb-2">Requisições</h3>
                  <div className="space-y-1">
                    {requisitions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className="w-full text-left px-8 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  {bottomItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
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
              </>
            )}
          </div>

          <div className="p-4 border-t dark:border-gray-800">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
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
