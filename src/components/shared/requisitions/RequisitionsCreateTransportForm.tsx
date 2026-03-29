import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { DatePickerField } from '../../ui/date-picker-field';
import { AlertCircle, Info } from 'lucide-react';
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
            <label htmlFor="req-create-transporte-destino" className="text-sm text-gray-600 dark:text-gray-300">
              {t('requisitions.ui.destination')} {t('common.optional')}
            </label>
            <Input
              id="req-create-transporte-destino"
              className={inputFieldClassName}
              value={destinoTransporte}
              onChange={(e) => onChangeDestino(e.target.value)}
              placeholder={t('requisitions.ui.destinationPlaceholder')}
              list="destinations-list"
            />
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
          </div>

          <div>
            <label htmlFor="req-create-transporte-passageiros" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.passengersCount')}</label>
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
              buttonClassName={`mt-1 ${createErrors?.dataSaida ? '!border-red-500 !ring-red-500' : ''}`}
            />
            {createErrors?.dataSaida && <p className="text-red-500 text-xs mt-1">{createErrors.dataSaida}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-saida" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.departureTime')}</label>
            <Input
              id="req-create-transporte-hora-saida"
              type="time"
              className={`${inputFieldClassName} mt-1 ${createErrors?.horaSaida ? '!border-red-500 !ring-red-500' : ''}`}
              value={horaSaida}
              onChange={(e) => onChangeHoraSaida(e.target.value)}
            />
            {createErrors?.horaSaida && <p className="text-red-500 text-xs mt-1">{createErrors.horaSaida}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-data-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnDate')}</label>
            <DatePickerField
              id="req-create-transporte-data-regresso"
              value={dataRegresso}
              onChange={onChangeDataRegresso}
              buttonClassName={`mt-1 ${createErrors?.dataRegresso ? '!border-red-500 !ring-red-500' : ''}`}
            />
            {createErrors?.dataRegresso && <p className="text-red-500 text-xs mt-1">{createErrors.dataRegresso}</p>}
          </div>

          <div>
            <label htmlFor="req-create-transporte-hora-regresso" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.returnTime')}</label>
            <Input
              id="req-create-transporte-hora-regresso"
              type="time"
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
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-700 dark:text-red-300">
            {t('requisitions.ui.capacityHint')}
          </p>
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
            {transportesPorCategoria.flatMap(grupo => grupo.items).map((transporte) => {
              const isSelected = selectedTransportIds.includes(String(transporte.id));
              const isRecommended = recommendedTransportIds.includes(transporte.id);
              const detailsOpen = expandedTransporteDetalhes[transporte.id] === true;
              const isUnavailable = transportesIndisponiveis.has(transporte.id);
              
              let cardStyles = "cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-all";
              if (isSelected) {
                cardStyles = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/50";
              } else if (isUnavailable) {
                cardStyles = "opacity-60 grayscale-[0.5] border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 cursor-not-allowed";
              } else {
                cardStyles = "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950";
              }

              const handleToggle = () => {
                if (!isUnavailable) {
                  onToggleTransport(transporte.id, !isSelected);
                }
              };

              return (
                <div
                  key={transporte.id}
                  onClick={handleToggle}
                  className={`group rounded-2xl border p-4 flex flex-col justify-between gap-4 ${cardStyles}`}
                >
                  <div className="space-y-3">
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
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {formatVehicleTitle(transporte)}
                        </h4>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md">
                              {transporte.codigo ?? `#${transporte.id}`}
                           </span>
                           <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                              {formatTransporteCategoria(transporte.categoria)}
                           </span>
                        </div>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        disabled={isUnavailable}
                        onCheckedChange={() => handleToggle()}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.ui.capacityLabel')}</p>
                        <p className="text-[11px] font-black text-gray-800 dark:text-gray-200">{formatLotacao(transporte.lotacao)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.ui.licensePlate')}</p>
                        <p className="text-[11px] font-black text-gray-800 dark:text-gray-200">{transporte.matricula || '—'}</p>
                      </div>
                    </div>

                    {isUnavailable && (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <Info className="w-3 h-3" />
                        <span>{t('requisitions.ui.overlapWarning')}</span>
                      </div>
                    )}
                  </div>

                  <div>
                     <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-8 text-xs font-bold text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTransporteDetalhes(transporte.id);
                        }}
                      >
                        {detailsOpen ? t('requisitions.ui.hideDetails') : t('requisitions.ui.details')}
                      </Button>
                      
                      {detailsOpen && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-800 space-y-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 animate-in fade-in slide-in-from-top-1 duration-200">
                           {[transporte.marca, transporte.modelo].filter(Boolean).length > 0 && (
                             <p><span className="font-bold text-gray-400 uppercase tracking-tighter mr-1">{t('requisitions.ui.brandModel')}:</span> {[transporte.marca, transporte.modelo].filter(Boolean).join(' ')}</p>
                           )}
                           {transporte.dataMatricula && (
                             <p><span className="font-bold text-gray-400 uppercase tracking-tighter mr-1">{t('requisitions.ui.licenseDate')}:</span> {new Date(transporte.dataMatricula).toLocaleDateString('pt-PT')}</p>
                           )}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
