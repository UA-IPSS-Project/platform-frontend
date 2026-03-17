import { Badge } from '../ui/badge';
import { AlertTriangleIcon } from './CustomIcons';
import { cn } from '../ui/utils';
import { Appointment } from '../../types';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
    status: Appointment['status'] | string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const { t } = useTranslation();

    switch (status) {
        case 'in-progress':
            return <Badge className={cn("rounded-full px-2 py-0.5 text-xs bg-[#ede9fe] text-[#5b21b6] dark:bg-[#4c1d95] dark:text-[#c4b5fd]", className)}>{t('statusBadge.inProgress')}</Badge>;
        case 'scheduled':
            return <Badge className={cn("rounded-full px-2 py-0.5 text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200", className)}>{t('statusBadge.scheduled')}</Badge>;
        case 'warning':
            return (
                <Badge className={cn("rounded-full border border-amber-300 bg-transparent text-amber-700 dark:border-amber-500 dark:text-amber-400 px-2 py-0.5 text-xs flex items-center gap-1", className)}>
                    <AlertTriangleIcon className="w-3 h-3" />
                    {t('statusBadge.warning')}
                </Badge>
            );
        case 'completed':
            return <Badge className={cn("rounded-full px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200", className)}>{t('statusBadge.completed')}</Badge>;
        case 'cancelled':
            return <Badge className={cn("rounded-full border border-red-300 bg-transparent text-red-600 dark:border-red-500 dark:text-red-500 px-2 py-0.5 text-xs", className)}>{t('statusBadge.cancelled')}</Badge>;
        case 'no-show':
            return <Badge variant="outline" className={cn("rounded-full border border-amber-300 bg-transparent !bg-transparent text-amber-700 dark:border-amber-500 dark:text-amber-400 dark:bg-transparent dark:!bg-transparent px-2 py-0.5 text-xs", className)}>{t('statusBadge.noShow')}</Badge>;
        case 'reserved':
            return <Badge className={cn("rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200", className)}>{t('statusBadge.reserved')}</Badge>;
        default:
            return null;
    }
}
