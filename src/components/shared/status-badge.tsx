import { Badge } from '../ui/badge';
import { AlertTriangleIcon } from './CustomIcons';
import { cn } from '../ui/utils';
import { Appointment } from '../../types';
import { useAppointmentStatus } from '../../hooks/useAppointmentStatus';

interface StatusBadgeProps {
    status: Appointment['status'] | string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export function StatusBadge({ status, className, size = 'md', showIcon = true }: StatusBadgeProps) {
    const { getStatusLabel, isOutlineVariant, getBorderClasses, shouldShowAlertIcon, getStatusClasses } = useAppointmentStatus();

    // Garantir que o status é válido
    const validStatus = ['scheduled', 'in-progress', 'warning', 'completed', 'cancelled', 'no-show', 'reserved'].includes(status as string)
        ? (status as Appointment['status'])
        : 'scheduled';

    const sizeClasses = {
        sm: 'px-1.5 py-0.25 text-xs',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    const baseClasses = cn(
        'rounded-full flex items-center gap-1',
        sizeClasses[size],
        getStatusClasses(validStatus)
    );

    const borderClasses = isOutlineVariant(validStatus)
        ? cn('border', getBorderClasses(validStatus))
        : '';

    const shouldShowAlert = shouldShowAlertIcon(validStatus) && showIcon;

    return (
        <Badge className={cn(baseClasses, borderClasses, className)}>
            {shouldShowAlert && <AlertTriangleIcon className="w-3 h-3" />}
            {getStatusLabel(validStatus)}
        </Badge>
    );
}
