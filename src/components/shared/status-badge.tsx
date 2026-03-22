import { Badge } from '../ui/badge';
import { AlertTriangleIcon } from './CustomIcons';
import { cn } from '../ui/utils';
import { Appointment } from '../../types';
import { useAppointmentStatus } from '../../hooks/useAppointmentStatus';
import { VALID_APPOINTMENT_STATUSES } from '../../config/appointmentStatusConfig';

interface StatusBadgeProps {
    status: Appointment['status'] | string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export function StatusBadge({ status, className, size = 'md', showIcon = true }: StatusBadgeProps) {
    const { getStatusLabel, isOutlineVariant, getBorderClasses, shouldShowAlertIcon, getStatusClasses } = useAppointmentStatus();

    // NOTE: Explicitly detect invalid status instead of silently coercing to 'scheduled'
    // This helps surface upstream bugs rather than masking them.
    // Invalid statuses are passed through to getStatusConfig, which will console.warn them.
    const isValidStatus = VALID_APPOINTMENT_STATUSES.includes(status as any);
    
    // If status is invalid, use it anyway and let the hook handle the warning.
    // This ensures the warning in getStatusConfig will be triggered.
    const displayStatus = isValidStatus ? (status as Appointment['status']) : (status as any);

    const sizeClasses = {
        sm: 'px-1.5 py-0.25 text-xs',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    const baseClasses = cn(
        'rounded-full flex items-center gap-1',
        sizeClasses[size],
        getStatusClasses(displayStatus)
    );

    const borderClasses = isOutlineVariant(displayStatus)
        ? cn('border', getBorderClasses(displayStatus))
        : '';

    const shouldShowAlert = shouldShowAlertIcon(displayStatus) && showIcon;

    return (
        <Badge className={cn(baseClasses, borderClasses, className)}>
            {shouldShowAlert && <AlertTriangleIcon className="w-3 h-3" />}
            {getStatusLabel(displayStatus)}
        </Badge>
    );
}
