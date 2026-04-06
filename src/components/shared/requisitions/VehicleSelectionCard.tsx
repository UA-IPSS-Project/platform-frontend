import { Checkbox } from '../../ui/checkbox';
import { Info } from 'lucide-react';
import { formatLotacao, formatVehicleTitle, formatTransporteCategoria } from '../../../pages/requisitions/sharedRequisitions.helpers';

export type TransporteLike = {
  id: number;
  codigo?: string;
  tipo?: string;
  categoria?: string;
  matricula?: string;
  marca?: string;
  modelo?: string;
  lotacao?: number;
  dataMatricula?: string;
  nome?: string;
};

interface VehicleSelectionCardProps {
  transporte: TransporteLike;
  isSelected?: boolean;
  isUnavailable?: boolean;
  isRecommended?: boolean;
  onToggle?: (transporteId: number, checked: boolean) => void;
  showCheckbox?: boolean;
  showCategory?: boolean;
  variant?: 'card' | 'minimal';
  t: (key: string, options?: any) => string;
}

export function VehicleSelectionCard({
  transporte,
  isSelected = false,
  isUnavailable = false,
  isRecommended = false,
  onToggle,
  showCheckbox = true,
  showCategory = true,
  variant = 'card',
  t,
}: Readonly<VehicleSelectionCardProps>) {
  const handleToggle = () => {
    if (!isUnavailable && onToggle) {
      onToggle(transporte.id, !isSelected);
    }
  };

  const isMinimal = variant === 'minimal';

  let cardStyles = "transition-all duration-200";
  if (isSelected) {
    cardStyles = "border-status-success bg-status-success-soft/50 shadow-sm ring-1 ring-status-success/30";
  } else if (isUnavailable) {
    cardStyles = "opacity-60 grayscale-[0.3] border-status-warning/40 bg-status-warning-soft/40 cursor-not-allowed";
  } else {
    cardStyles = "border-border bg-card hover:border-primary/50";
  }

  const content = (
    <div className={`space-y-2 w-full ${isMinimal ? 'py-1' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {showCategory && (
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
              {formatTransporteCategoria(transporte.categoria)}
            </span>
          )}
          {isRecommended && (
            <span className="inline-flex items-center rounded-full bg-status-info-soft px-2 py-0.5 text-[10px] font-bold text-status-info uppercase tracking-tighter">
              {t('requisitions.ui.suggested')}
            </span>
          )}
          {isUnavailable && (
            <span className="inline-flex items-center rounded-full bg-status-warning-soft px-2 py-0.5 text-[10px] font-bold text-status-warning uppercase tracking-tighter">
              {t('requisitions.ui.unavailable')}
            </span>
          )}
        </div>
        
        {showCheckbox && !isMinimal && (
          <Checkbox
            checked={isSelected}
            disabled={isUnavailable}
            onCheckedChange={() => handleToggle()}
            className="mt-0.5"
          />
        )}
      </div>
      
      <div className="pl-1 py-0.5 space-y-1">
        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
          {formatVehicleTitle(transporte)}
        </h4>
        <p className="text-[11px] font-medium text-muted-foreground">
          {t('requisitions.ui.capacityLabel')}: <span className="font-bold text-foreground/85">{formatLotacao(transporte.lotacao)}</span>
        </p>
      </div>

      {isUnavailable && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-status-warning">
          <Info className="w-3 h-3" />
          <span>{t('requisitions.ui.overlapWarning')}</span>
        </div>
      )}
    </div>
  );

  if (isMinimal) {
    return content;
  }

  return (
    <div
      onClick={handleToggle}
      className={`group rounded-2xl border p-4 flex flex-col gap-3 ${cardStyles} ${onToggle && !isUnavailable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {content}
      </div>
    </div>
  );
}
