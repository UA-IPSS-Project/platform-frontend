import React from 'react';
import { Badge } from './badge';
import { AlertTriangleIcon } from '../CustomIcons';
import { cn } from './utils';
import { Appointment } from '../../types';

interface StatusBadgeProps {
    status: Appointment['status'] | string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    switch (status) {
        case 'in-progress':
            return <Badge className={cn("bg-purple-600 hover:bg-purple-700 text-white rounded-full px-2 py-0.5 text-xs", className)}>Em Curso</Badge>;
        case 'scheduled':
            return <Badge className={cn("bg-pink-600 hover:bg-pink-700 text-white rounded-full px-2 py-0.5 text-xs", className)}>Agendado</Badge>;
        case 'warning':
            return (
                <Badge className={cn("bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-full px-2 py-0.5 text-xs flex items-center gap-1", className)}>
                    <AlertTriangleIcon className="w-3 h-3" />
                    Agendado
                </Badge>
            );
        case 'completed':
            return <Badge className={cn("bg-green-600 hover:bg-green-700 text-white rounded-full px-2 py-0.5 text-xs", className)}>Concluído</Badge>;
        case 'cancelled':
            return <Badge className={cn("bg-red-600 hover:bg-red-700 text-white rounded-full px-2 py-0.5 text-xs", className)}>Cancelado</Badge>;
        case 'no-show':
            return <Badge className={cn("bg-red-500 hover:bg-red-600 text-white rounded-full px-2 py-0.5 text-xs", className)}>Não Compareceu</Badge>;
        case 'reserved':
            return <Badge className={cn("bg-gray-400 hover:bg-gray-500 text-white rounded-full px-2 py-0.5 text-xs", className)}>Reservado</Badge>;
        default:
            return null;
    }
}
