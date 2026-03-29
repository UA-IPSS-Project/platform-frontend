import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { DatePickerField } from '../../ui/date-picker-field';
import { AlertCircle } from 'lucide-react';
import {
  formatLotacao,
  formatVehicleTitle,
  getCoberturaMensagem,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { VehicleSelectionCard } from './VehicleSelectionCard';
import { TransporteCatalogo, TransporteCategoria } from '../../../services/api';

interface RequisitionsCreateTransportFormProps {
  destinoTransporte: string;
  onChangeDestino: (value: string) => void;
  dataSaida: string;
  onChangeDataSaida: (value: string) => void;
  horaSaida: string;
  onChangeHoraSaida: (value: string) => void;
  dataRegresso: string;
  onChangeDataRegresso: (value: string) => void;
  horaRegresso: string;
  onChangeHoraRegresso: (value: string) => void;
  numeroPassageiros: string;
  onChangeNumeroPassageiros: (value: string) => void;
  condutorTransporte: string;
  onChangeCondutor: (value: string) => void;
  selectedTransportIds: string[];
  onToggleTransport: (transporteId: number, checked: boolean) => void;
  onRemoveTransport: (transporteId: number) => void;
  transportesPorCategoria: Array<{
    categoria: TransporteCategoria;
    label: string;
    items: TransporteCatalogo[];
  }>;
  selectedTransportes: TransporteCatalogo[];
  transportesIndisponiveis: Set<number>;
  recommendedTransportIds: number[];
  selectedTransportesCapacidade: number;
  passageirosSolicitados: number;
  lugaresEmFalta: number;
  loadingCatalogo: boolean;
  createErrors?: Partial<{
    destino: string;
    dataSaida: string;
    horaSaida: string;
    dataRegresso: string;
    horaRegresso: string;
    numeroPassageiros: string;
    transporteIds: string;
    condutor: string;
  }>;
  inputFieldClassName: string;
  onApplySuggestion: () => void;
  t: (key: string, options?: any) => string;
}

export function RequisitionsCreateTransportForm({
  destinoTransporte,
  onChangeDestino,
  dataSaida,
  onChangeDataSaida,
  horaSaida,
  onChangeHoraSaida,
  dataRegresso,
  onChangeDataRegresso,
  horaRegresso,
  onChangeHoraRegresso,
  numeroPassageiros,
  onChangeNumeroPassageiros,
  condutorTransporte,
  onChangeCondutor,
  selectedTransportIds,
  onToggleTransport,
  onRemoveTransport,
  transportesPorCategoria,
  selectedTransportes,
  transportesIndisponiveis,
  recommendedTransportIds,
  selectedTransportesCapacidade,
  passageirosSolicitados,
  lugaresEmFalta,
  loadingCatalogo,
  createErrors,
  inputFieldClassName,
  onApplySuggestion,
  t,
}: Readonly<RequisitionsCreateTransportFormProps>) {
  const dataHoraSaidaSelecionada = dataSaida && horaSaida ? `${dataSaida}T${horaSaida}` : '';
  const dataHoraRegressoSelecionada = dataRegresso && horaRegresso ? `${dataRegresso}T${horaRegresso}` : '';

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Planeamento da deslocação</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.transportPlanningHint')}</p>
          <div className="flex items-start gap-2 p-3 mt-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {t('requisitions.ui.capacityHint')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label htmlFor="req-create-transporte-destino" className="text-sm text-gray-600 dark:text-gray-300">
              {t('requisitions.ui.destination')} {t('common.optional', { defaultValue: '(opcional)' })}
            </label>
            <div className="relative group">
              <Input
                id="req-create-transporte-destino"
                className={`${inputFieldClassName} pr-10`}
                value={destinoTransporte}
                onChange={(e) => onChangeDestino(e.target.value)}
                placeholder={t('requisitions.ui.destinationPlaceholder')}
                list="destinations-list"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <datalist id="destinations-list">
              <option value={t('requisitions.ui.destinations.school')} />
              <option value={t('requisitions.ui.destinations.user')} />
              <option value={t('requisitions.ui.destinations.exterior')} />
              <option value={t('requisitions.ui.destinations.stateVisit')} />
            </datalist>
          </div>

          <div>
            <label htmlFor="req-create-transporte-condutor" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.driverRequired')}</label>
            <Input
              id="req-create-transporte-condutor"
              className={`${inputFieldClassName} ${createErrors?.condutor ? '!border-red-500 !ring-red-500' : ''}`}
              value={condutorTransporte}
              onChange={(e) => onChangeCondutor(e.target.value)}
              placeholder={t('requisitions.ui.driverPlaceholder')}
            />
            {createErrors?.condutor && <p className="text-red-500 text-xs mt-1">{createErrors.condutor}</p>}
            
            {createErrors?.condutor && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold italic">
                  {t('requisitions.ui.driverHint', { defaultValue: 'OBRIGATÓRIO: Indicar a pessoa (pode ser "Motorista externo" ou "A definir").' })}
                </p>
                
                {selectedTransportes.some(t => (t.lotacao ?? 0) > 9) && (
                  <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <p className="text-[10px] font-bold italic uppercase tracking-tight">
                      {t('requisitions.ui.licenseWarning', { defaultValue: 'OBRIGATÓRIO: Veículo com mais de 9 lugares requer condutor com carta D1 ou D.' })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="req-create-transporte-passageiros" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.passengersCount')} *</label>
            <Input
              id="req-create-transporte-passageiros"
              type="number"
              min="0"
              className={`${inputFieldClassName} ${createErrors?.numeroPassageiros ? '!border-red-500 !ring-red-500' : ''}`}
              value={numeroPassageiros}
              onChange={(e) => onChangeNumeroPassageiros(e.target.value)}
              placeholder={t('requisitions.ui.passengersPlaceholder')}
            />
            {createErrors?.numeroPassageiros && <p className="text-red-500 text-xs mt-1">{createErrors.numeroPassageiros}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-create-transporte-data-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureDate')} *</label>
            <DatePickerField
              id="req-create-transporte-data-saida"
              value={dataSaida}
              onChange={(value) => {
                onChangeDataSaida(value);
                // Rigid sync: if return date is missing OR earlier than new departure date, update it
                if (!dataRegresso || dataRegresso < value) {
                  onChangeDataRegresso(value);
                }
              }}
              buttonClassName={`mt-1 ${createErrors?.dataSaida ? '!border-red-500 !ring-red-500' : ''}`}
            />
            {createErrors?.dataSaida && <p className="text-red-500 text-xs mt-1">{createErrors.dataSaida}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureTime')} *</label>
            <Input
              id="req-create-transporte-hora-saida"
              type="time"
              lang="pt-PT"
              step="60"
              className={`${inputFieldClassName} mt-1 ${createErrors?.horaSaida ? '!border-red-500 !ring-red-500' : ''}`}
              value={horaSaida}
              onChange={(e) => {
                const value = e.target.value;
                onChangeHoraSaida(value);
                // Rigid sync: if same day and return time is earlier/equal, update it
                if (dataSaida === dataRegresso && horaRegresso && value >= horaRegresso) {
                  onChangeHoraRegresso(value);
                }
              }}
            />
            {createErrors?.horaSaida && <p className="text-red-500 text-xs mt-1">{createErrors.horaSaida}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-data-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnDate')} *</label>
            <DatePickerField
              id="req-create-transporte-data-regresso"
              value={dataRegresso}
              onChange={onChangeDataRegresso}
              buttonClassName={`mt-1 ${createErrors?.dataRegresso ? '!border-red-500 !ring-red-500' : ''}`}
            />
            {createErrors?.dataRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.dataRegresso}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnTime')} *</label>
            <Input
              id="req-create-transporte-hora-regresso"
              type="time"
              lang="pt-PT"
              step="60"
              className={`${inputFieldClassName} mt-1 ${createErrors?.horaRegresso ? '!border-red-500 !ring-red-500' : ''}`}
              value={horaRegresso}
              onChange={(e) => onChangeHoraRegresso(e.target.value)}
            />
            {createErrors?.horaRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.horaRegresso}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.suggestedAndSelectedVehicles')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.suggestionHint')}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={onApplySuggestion}>
              {t('requisitions.ui.applySuggestion')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50/80 dark:bg-gray-800/50">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('requisitions.ui.selectionMode')}</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{t('requisitions.ui.automatic')}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3 bg-gray-50/80 dark:bg-gray-800/50">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('requisitions.ui.passengerCapacity')}</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{t('requisitions.ui.seatsCount', { count: selectedTransportesCapacidade })}</p>
          </div>
          <div className={`rounded-lg border px-3 py-3 ${lugaresEmFalta > 0
            ? 'border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20'
            : 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20'
            }`}>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('requisitions.ui.coverage')}</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
              {getCoberturaMensagem(passageirosSolicitados, lugaresEmFalta)}
            </p>
          </div>
        </div>

        {createErrors?.transporteIds && (
          <p className="text-red-500 text-xs">{createErrors.transporteIds}</p>
        )}

        {transportesIndisponiveis.size > 0 && dataHoraSaidaSelecionada && dataHoraRegressoSelecionada && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('requisitions.ui.unavailableVehiclesCount', { count: transportesIndisponiveis.size })}
          </p>
        )}

        {selectedTransportIds.length > 0 && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('requisitions.ui.currentSelection')}</p>
            <div className="space-y-2">
              {selectedTransportes.map((transporte) => (
                <div key={transporte.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatVehicleTitle(transporte)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('requisitions.ui.capacityLabel')}: {formatLotacao(transporte.lotacao)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3"
                    onClick={() => onRemoveTransport(transporte.id)}
                  >
                    {t('requisitions.ui.remove')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingCatalogo && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
            {t('requisitions.ui.loadingVehicles')}
          </div>
        )}

        {!loadingCatalogo && transportesPorCategoria.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
            {t('requisitions.ui.noVehiclesInCatalog')}
          </div>
        )}

        {!loadingCatalogo && transportesPorCategoria.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {transportesPorCategoria.flatMap(grupo => grupo.items).map((transporte) => (
              <VehicleSelectionCard
                key={transporte.id}
                transporte={transporte}
                isSelected={selectedTransportIds.includes(String(transporte.id))}
                isRecommended={recommendedTransportIds.includes(transporte.id)}
                isUnavailable={transportesIndisponiveis.has(transporte.id)}
                onToggle={onToggleTransport}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
