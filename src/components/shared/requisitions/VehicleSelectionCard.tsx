import { Checkbox } from '../../ui/checkbox';
import { Info } from 'lucide-react';
import { formatLotacao, formatVehicleTitle, formatTransporteCategoria } from '../../../pages/requisitions/sharedRequisitions.helpers';
import { TransporteCatalogo } from '../../../services/api';

interface VehicleSelectionCardProps {
  transporte: TransporteCatalogo;
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
    cardStyles = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30";
  } else if (isUnavailable) {
    cardStyles = "opacity-60 grayscale-[0.3] border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 cursor-not-allowed";
  } else {
    cardStyles = "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-purple-300 dark:hover:border-purple-700";
  }

  const content = (
    <div className={`space-y-3 w-full ${isMinimal ? 'py-1' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {showCategory && (
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-tighter">
              {formatTransporteCategoria(transporte.categoria)}
            </span>
          )}
          {isRecommended && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase tracking-tighter">
              {t('requisitions.ui.suggested')}
            </span>
          )}
          {isUnavailable && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-tighter">
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
      
      <div className="border-l-2 border-purple-100 dark:border-purple-900/50 pl-3 py-0.5 space-y-1">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
          {formatVehicleTitle(transporte)}
        </h4>
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {t('requisitions.ui.capacityLabel')}: <span className="font-bold text-gray-700 dark:text-gray-300">{formatLotacao(transporte.lotacao)}</span>
        </p>
      </div>

      {isUnavailable && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
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
