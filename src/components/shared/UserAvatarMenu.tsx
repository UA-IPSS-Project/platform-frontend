import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOutIcon, UserIcon, SettingsIcon } from './CustomIcons';

function getInitials(nome: string): string {
    const parts = nome.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface UserAvatarMenuProps {
    nome: string;
    photoUrl?: string;
    onProfile?: () => void;
    onSettings?: () => void;
    onLogout: () => void;
}

export function UserAvatarMenu({ nome, photoUrl, onProfile, onSettings, onLogout }: UserAvatarMenuProps) {
    const displayName = nome.trim() || 'Utilizador';

    const handleLogout = () => {
        const shouldLogout = window.confirm('Tem a certeza que quer sair?');
        if (shouldLogout) {
            onLogout();
        }
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-colors overflow-hidden shrink-0"
                    aria-label={`Abrir menu do utilizador: ${displayName}`}
                    title={displayName}
                >
                    {photoUrl ? (
                        <img src={photoUrl} alt={`Fotografia de ${displayName}`} className="w-full h-full object-cover" />
                    ) : (
                        <span>{getInitials(displayName)}</span>
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-[10000] min-w-[180px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                >
                    {/* User name header */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                            {displayName}
                        </p>
                    </div>

                    <DropdownMenu.Item
                        onSelect={onProfile}
                        aria-label="Abrir perfil"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer select-none outline-none transition-colors"
                    >
                        <UserIcon className="w-4 h-4 shrink-0" />
                        Perfil
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={onSettings}
                        aria-label="Abrir definições"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer select-none outline-none transition-colors"
                    >
                        <SettingsIcon className="w-4 h-4 shrink-0" />
                        Definições
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-800" />

                    <DropdownMenu.Item
                        onSelect={handleLogout}
                        aria-label="Terminar sessão"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer select-none outline-none transition-colors"
                    >
                        <LogOutIcon className="w-4 h-4 shrink-0" />
                        Sair
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
