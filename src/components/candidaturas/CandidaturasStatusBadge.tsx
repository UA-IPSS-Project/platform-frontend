import type { CandidaturaEstado } from '../../services/api';
import { cn } from '../ui/utils';

type CandidaturasStatusBadgeProps = {
  status: CandidaturaEstado;
  label: string;
  className?: string;
};

const statusClassNames: Record<CandidaturaEstado, string> = {
  APROVADA: 'bg-status-success-soft text-status-success border border-status-success/20',
  REJEITADA: 'bg-status-error-soft text-status-error border border-status-error/20',
  PENDENTE: 'bg-status-warning-soft text-status-warning border border-status-warning/20',
  LISTA_ESPERA: 'bg-status-info-soft text-status-info border border-status-info/20',
  RASCUNHO: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

export function CandidaturasStatusBadge({ status, label, className }: CandidaturasStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        statusClassNames[status],
        className
      )}
    >
      {label}
    </span>
  );
}