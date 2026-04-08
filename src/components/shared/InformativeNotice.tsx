import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '../ui/utils';

interface InformativeNoticeProps {
  message: string;
  variant?: 'info' | 'warning';
  className?: string;
}

export function InformativeNotice({
  message,
  variant = 'info',
  className,
}: InformativeNoticeProps) {
  const isWarning = variant === 'warning';
  const Icon = isWarning ? AlertTriangle : Info;

  return (
    <div
      role="status"
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        isWarning
          ? 'border-status-warning/40 bg-status-warning/10 text-status-warning'
          : 'border-status-info/40 bg-status-info/10 text-status-info',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
}