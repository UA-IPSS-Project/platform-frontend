import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { DatePickerField } from '../../ui/date-picker-field';
import { AlertCircle } from 'lucide-react';
import { TRANSPORTE_DESTINOS_PERMITIDOS } from '../../../utils/validations/requisition.validation';
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
  quilometrosTransporte: string;
  onChangeQuilometros: (value: string) => void;
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
    quilometros: string;
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
  quilometrosTransporte,
  onChangeQuilometros,
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
      <div className="rounded-xl border border-border bg-card/80 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground/85">Planeamento da deslocação</p>
          <p className="text-xs text-muted-foreground">{t('requisitions.ui.transportPlanningHint')}</p>
          <div className="flex items-start gap-2 p-3 mt-2 rounded-lg bg-status-info-soft/40 border border-status-info/30">
            <AlertCircle className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
            <p className="text-xs font-semibold text-status-info">
              {t('requisitions.ui.capacityHint')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-create-transporte-destino" className="text-sm text-muted-foreground">
              {t('requisitions.ui.destination')} *
            </label>
            <div className="relative group">
              <Input
                id="req-create-transporte-destino"
                className={`${inputFieldClassName} pr-10 ${createErrors?.destino ? '!border-status-error !ring-status-error' : ''}`}
                value={destinoTransporte}
                onChange={(e) => onChangeDestino(e.target.value)}
                placeholder={t('requisitions.ui.destinationPlaceholder')}
                list="destinations-list"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground group-hover:text-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <datalist id="destinations-list">
              {TRANSPORTE_DESTINOS_PERMITIDOS.map((destino) => (
                <option key={destino} value={destino} />
              ))}
            </datalist>
            {createErrors?.destino && <p className="text-status-error text-xs mt-1">{createErrors.destino}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-quilometros" className="text-sm text-muted-foreground">{t('requisitions.ui.kilometers')} *</label>
            <Input
              id="req-create-transporte-quilometros"
              type="number"
              min="0.01"
              step="0.01"
              className={`${inputFieldClassName} ${createErrors?.quilometros ? '!border-status-error !ring-status-error' : ''}`}
              value={quilometrosTransporte}
              onChange={(e) => onChangeQuilometros(e.target.value)}
              placeholder={t('requisitions.ui.kilometersPlaceholder')}
            />
            {createErrors?.quilometros && <p className="text-status-error text-xs mt-1">{createErrors.quilometros}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-condutor" className="text-sm text-muted-foreground">{t('requisitions.ui.driverRequired')}</label>
            <Input
              id="req-create-transporte-condutor"
              className={`${inputFieldClassName} ${createErrors?.condutor ? '!border-status-error !ring-status-error' : ''}`}
              value={condutorTransporte}
              onChange={(e) => onChangeCondutor(e.target.value)}
              placeholder={t('requisitions.ui.driverPlaceholder')}
            />
            {createErrors?.condutor && <p className="text-status-error text-xs mt-1">{createErrors.condutor}</p>}
            
            {createErrors?.condutor && selectedTransportes.some(t => (t.lotacao ?? 0) > 9) && (
              <div className="mt-2 flex items-center gap-1.5 text-status-error font-bold italic">
                <AlertCircle className="w-3 h-3" />
                <p className="text-[10px] uppercase tracking-tight">
                  {t('requisitions.ui.licenseWarning', { defaultValue: 'OBRIGATÓRIO: Veículo com mais de 9 lugares requer condutor com carta D1 ou D.' })}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="req-create-transporte-passageiros" className="text-sm text-muted-foreground">{t('requisitions.ui.passengersCount')} *</label>
            <Input
              id="req-create-transporte-passageiros"
              type="number"
              min="0"
              className={`${inputFieldClassName} ${createErrors?.numeroPassageiros ? '!border-status-error !ring-status-error' : ''}`}
              value={numeroPassageiros}
              onChange={(e) => onChangeNumeroPassageiros(e.target.value)}
              placeholder={t('requisitions.ui.passengersPlaceholder')}
            />
            {createErrors?.numeroPassageiros && <p className="text-status-error text-xs mt-1">{createErrors.numeroPassageiros}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-create-transporte-data-saida" className="text-sm text-muted-foreground">{t('requisitions.ui.departureDate')} *</label>
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
              buttonClassName={`mt-1 ${createErrors?.dataSaida ? '!border-status-error !ring-status-error' : ''}`}
            />
            {createErrors?.dataSaida && <p className="text-status-error text-xs mt-1">{createErrors.dataSaida}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-saida" className="text-sm text-muted-foreground">{t('requisitions.ui.departureTime')} *</label>
            <Input
              id="req-create-transporte-hora-saida"
              type="time"
              lang="pt-PT"
              step="60"
              className={`${inputFieldClassName} mt-1 ${createErrors?.horaSaida ? '!border-status-error !ring-status-error' : ''}`}
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
            {createErrors?.horaSaida && <p className="text-status-error text-xs mt-1">{createErrors.horaSaida}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-data-regresso" className="text-sm text-muted-foreground">{t('requisitions.ui.returnDate')} *</label>
            <DatePickerField
              id="req-create-transporte-data-regresso"
              value={dataRegresso}
              onChange={onChangeDataRegresso}
              buttonClassName={`mt-1 ${createErrors?.dataRegresso ? '!border-status-error !ring-status-error' : ''}`}
            />
            {createErrors?.dataRegresso && <p className="text-status-error text-xs mt-1">{createErrors.dataRegresso}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-regresso" className="text-sm text-muted-foreground">{t('requisitions.ui.returnTime')} *</label>
            <Input
              id="req-create-transporte-hora-regresso"
              type="time"
              lang="pt-PT"
              step="60"
              className={`${inputFieldClassName} mt-1 ${createErrors?.horaRegresso ? '!border-status-error !ring-status-error' : ''}`}
              value={horaRegresso}
              onChange={(e) => onChangeHoraRegresso(e.target.value)}
            />
            {createErrors?.horaRegresso && <p className="text-status-error text-xs mt-1">{createErrors.horaRegresso}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/80 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground/85">{t('requisitions.ui.suggestedAndSelectedVehicles')}</p>
            <p className="text-xs text-muted-foreground">{t('requisitions.ui.suggestionHint')}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={onApplySuggestion}>
              {t('requisitions.ui.applySuggestion')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-border px-3 py-3 bg-muted/60">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.selectionMode')}</p>
            <p className="mt-1 font-semibold text-foreground">{t('requisitions.ui.automatic')}</p>
          </div>
          <div className="rounded-lg border border-border px-3 py-3 bg-muted/60">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.passengerCapacity')}</p>
            <p className="mt-1 font-semibold text-foreground">{t('requisitions.ui.seatsCount', { count: selectedTransportesCapacidade })}</p>
          </div>
          <div className={`rounded-lg border px-3 py-3 ${lugaresEmFalta > 0
            ? 'border-status-warning/40 bg-status-warning-soft/40'
            : 'border-status-success/40 bg-status-success-soft/40'
            }`}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.coverage')}</p>
            <p className="mt-1 font-semibold text-foreground">
              {getCoberturaMensagem(passageirosSolicitados, lugaresEmFalta)}
            </p>
          </div>
        </div>

        {createErrors?.transporteIds && (
          <p className="text-status-error text-xs">{createErrors.transporteIds}</p>
        )}

        {transportesIndisponiveis.size > 0 && dataHoraSaidaSelecionada && dataHoraRegressoSelecionada && (
          <p className="text-xs text-status-warning">
            {t('requisitions.ui.unavailableVehiclesCount', { count: transportesIndisponiveis.size })}
          </p>
        )}

        {selectedTransportIds.length > 0 && (
          <div className="rounded-lg border border-status-success/40 bg-status-success-soft/40 p-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-status-success">{t('requisitions.ui.currentSelection')}</p>
            <div className="space-y-2">
              {selectedTransportes.map((transporte) => (
                <div key={transporte.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{formatVehicleTitle(transporte)}</p>
                    <p className="text-xs text-muted-foreground">{t('requisitions.ui.capacityLabel')}: {formatLotacao(transporte.lotacao)}</p>
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
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            {t('requisitions.ui.loadingVehicles')}
          </div>
        )}

        {!loadingCatalogo && transportesPorCategoria.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
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
