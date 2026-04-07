import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOutIcon, UserIcon, SettingsIcon } from './CustomIcons';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const displayName = nome.trim() || t('dashboard.user');

    const handleLogout = () => {
        const shouldLogout = window.confirm(t('common.confirmLogout'));
        if (shouldLogout) {
            onLogout();
        }
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors overflow-hidden shrink-0"
                    aria-label={`${t('header.language')}: ${displayName}`}
                    title={displayName}
                >
                    {photoUrl ? (
                        <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <span>{getInitials(displayName)}</span>
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-[10000] min-w-[180px] rounded-lg border border-border bg-popover shadow-lg py-1 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                >
                    {/* User name header */}
                    <div className="px-3 py-2 border-b border-border">
                        <p className="text-xs font-medium text-muted-foreground truncate">
                            {displayName}
                        </p>
                    </div>

                    <DropdownMenu.Item
                        onSelect={onProfile}
                        aria-label={t('sidebar.profile')}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-popover-foreground hover:bg-accent cursor-pointer select-none outline-none transition-colors"
                    >
                        <UserIcon className="w-4 h-4 shrink-0" />
                        {t('sidebar.profile')}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={onSettings}
                        aria-label={t('sidebar.settings')}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-popover-foreground hover:bg-accent cursor-pointer select-none outline-none transition-colors"
                    >
                        <SettingsIcon className="w-4 h-4 shrink-0" />
                        {t('sidebar.settings')}
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-border" />

                    <DropdownMenu.Item
                        onSelect={handleLogout}
                        aria-label={t('header.logout')}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-status-error hover:bg-status-error-soft cursor-pointer select-none outline-none transition-colors"
                    >
                        <LogOutIcon className="w-4 h-4 shrink-0" />
                        {t('header.logout')}
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
