import { Checkbox } from '../../ui/checkbox';
import { Info } from 'lucide-react';
import { formatLotacao, formatVehicleTitle } from '../../../pages/requisitions/sharedRequisitions.helpers';
import { TransporteCatalogo } from '../../../services/api';

interface VehicleSelectionCardProps {
  transporte: TransporteCatalogo;
  isSelected?: boolean;
  isUnavailable?: boolean;
  isRecommended?: boolean;
  onToggle?: (transporteId: number, checked: boolean) => void;
  showCheckbox?: boolean;
  t: (key: string, options?: any) => string;
}

export function VehicleSelectionCard({
  transporte,
  isSelected = false,
  isUnavailable = false,
  isRecommended = false,
  onToggle,
  showCheckbox = true,
  t,
}: Readonly<VehicleSelectionCardProps>) {
  const handleToggle = () => {
    if (!isUnavailable && onToggle) {
      onToggle(transporte.id, !isSelected);
    }
  };

  let cardStyles = "transition-all duration-200";
  if (isSelected) {
    cardStyles = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30";
  } else if (isUnavailable) {
    cardStyles = "opacity-60 grayscale-[0.3] border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 cursor-not-allowed";
  } else {
    cardStyles = "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-purple-300 dark:hover:border-purple-700";
  }

  return (
    <div
      onClick={handleToggle}
      className={`group rounded-2xl border p-4 flex flex-col gap-2 ${cardStyles} ${onToggle && !isUnavailable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex gap-1.5 flex-wrap">
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
          
          <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
            {formatVehicleTitle(transporte)}
          </h4>
          
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t('requisitions.ui.capacityLabel')}: <span className="text-gray-900 dark:text-gray-100">{formatLotacao(transporte.lotacao)}</span>
          </p>
        </div>

        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            disabled={isUnavailable}
            onCheckedChange={() => handleToggle()}
            className="mt-1"
          />
        )}
      </div>

      {isUnavailable && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1">
          <Info className="w-3 h-3" />
          <span>{t('requisitions.ui.overlapWarning')}</span>
        </div>
      )}
    </div>
  );
}
