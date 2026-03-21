import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { DatePickerField } from '../../ui/date-picker-field';
import {
  formatTransporteCategoria,
  formatLotacao,
  formatVehicleTitle,
  getCoberturaMensagem,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
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
  expandedTransporteCategorias: Partial<Record<TransporteCategoria, boolean>>;
  onToggleTransporteCategoriaExpansion: (categoria: TransporteCategoria) => void;
  expandedTransporteDetalhes: Record<number, boolean>;
  onToggleTransporteDetalhes: (transporteId: number) => void;
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
    transporteIds: string;
  }>;
  inputFieldClassName: string;
  selectFieldClassName: string;
  onApplySuggestion: () => void;
  onSearch?: () => void;
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
  expandedTransporteCategorias,
  onToggleTransporteCategoriaExpansion,
  expandedTransporteDetalhes,
  onToggleTransporteDetalhes,
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label htmlFor="req-create-transporte-destino" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.destination')}</label>
            <Input
              id="req-create-transporte-destino"
              className={inputFieldClassName}
              value={destinoTransporte}
              onChange={(e) => onChangeDestino(e.target.value)}
              placeholder={t('requisitions.ui.destinationPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="req-create-transporte-condutor" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.driverOptional')}</label>
            <Input
              id="req-create-transporte-condutor"
              className={inputFieldClassName}
              value={condutorTransporte}
              onChange={(e) => onChangeCondutor(e.target.value)}
              placeholder={t('requisitions.ui.driverPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="req-create-transporte-passageiros" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.passengersCount')}</label>
            <Input
              id="req-create-transporte-passageiros"
              type="number"
              min="1"
              className={inputFieldClassName}
              value={numeroPassageiros}
              onChange={(e) => onChangeNumeroPassageiros(e.target.value)}
              placeholder={t('requisitions.ui.passengersPlaceholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="req-create-transporte-data-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureDate')}</label>
            <DatePickerField
              id="req-create-transporte-data-saida"
              value={dataSaida}
              onChange={(value) => {
                onChangeDataSaida(value);
                if (!dataRegresso) {
                  onChangeDataRegresso(value);
                }
              }}
              buttonClassName="mt-1"
            />
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureTime')}</label>
            <Input
              id="req-create-transporte-hora-saida"
              type="time"
              className={inputFieldClassName}
              value={horaSaida}
              onChange={(e) => onChangeHoraSaida(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="req-create-transporte-data-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnDate')}</label>
            <DatePickerField
              id="req-create-transporte-data-regresso"
              value={dataRegresso}
              onChange={onChangeDataRegresso}
              buttonClassName="mt-1"
            />
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnTime')}</label>
            <Input
              id="req-create-transporte-hora-regresso"
              type="time"
              className={inputFieldClassName}
              value={horaRegresso}
              onChange={(e) => onChangeHoraRegresso(e.target.value)}
            />
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
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.capacityHint')}</p>

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
          <div className="space-y-4">
            {transportesPorCategoria.map((grupo) => (
              <div key={grupo.categoria} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => onToggleTransporteCategoriaExpansion(grupo.categoria)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t(grupo.label)}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.vehiclesCount', { count: grupo.items.length })}</span>
                  </p>
                  {expandedTransporteCategorias[grupo.categoria] ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {expandedTransporteCategorias[grupo.categoria] && (
                  <div className="px-3 pb-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {grupo.items.map((transporte) => {
                      const isSelected = selectedTransportIds.includes(String(transporte.id));
                      const isRecommended = recommendedTransportIds.includes(transporte.id);
                      const detailsOpen = expandedTransporteDetalhes[transporte.id] === true;
                      const isUnavailable = transportesIndisponiveis.has(transporte.id);
                      let transporteCardClass = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
                      if (isSelected) {
                        transporteCardClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm';
                      } else if (isUnavailable) {
                        transporteCardClass = 'border-amber-300 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/10';
                      }

                      return (
                        <div
                          key={transporte.id}
                          className={`rounded-xl border p-4 transition-all ${transporteCardClass}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                  }`}>
                                  {transporte.codigo ?? `#${transporte.id}`}
                                </span>
                                {isRecommended && (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                    {t('requisitions.ui.suggested')}
                                  </span>
                                )}
                                {isUnavailable && (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                    {t('requisitions.ui.unavailable')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatVehicleTitle(transporte)}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{t('requisitions.ui.capacityLabel')}: {formatLotacao(transporte.lotacao)}</p>
                              {isUnavailable && (
                                <p className="text-xs text-amber-700 dark:text-amber-300">{t('requisitions.ui.overlapWarning')}</p>
                              )}
                            </div>
                            <Checkbox
                              checked={isSelected}
                              disabled={isUnavailable}
                              onCheckedChange={(checked) => onToggleTransport(transporte.id, !!checked)}
                            />
                          </div>

                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-3 text-xs"
                              onClick={() => onToggleTransporteDetalhes(transporte.id)}
                            >
                              {detailsOpen ? t('requisitions.ui.hideDetails') : t('requisitions.ui.details')}
                            </Button>
                          </div>

                          {detailsOpen && (
                            <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              <p>{formatTransporteCategoria(transporte.categoria)}</p>
                              <p>{t('requisitions.ui.licensePlate')}: {transporte.matricula ?? t('requisitions.ui.noLicensePlate')}</p>
                              <p>{t('requisitions.ui.brandModel')}: {[transporte.marca, transporte.modelo].filter(Boolean).join(' ') || t('requisitions.ui.notDefined')}</p>
                              <p>{t('requisitions.ui.licenseDate')}: {transporte.dataMatricula ? new Date(transporte.dataMatricula).toLocaleDateString('pt-PT') : t('requisitions.ui.notDefined')}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
