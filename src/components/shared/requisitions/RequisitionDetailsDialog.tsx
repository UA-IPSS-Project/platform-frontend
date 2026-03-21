import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { RequisicaoEstado, RequisicaoResponse } from '../../../services/api';
import {
  ESTADO_SECRETARIA_OPTIONS,
  RequisicaoItem,
  formatEstado,
  formatMaterialItemLabel,
  formatPrioridade,
  formatTipo,
  formatTransporteDisplay,
  formatTransporteMeta,
  getRequisicaoTransportes,
} from '../../../pages/requisitions/sharedRequisitions.helpers';

interface RequisitionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequisicao: RequisicaoResponse | null;
  canManageRequests: boolean;
  estadoEdicao: RequisicaoEstado;
  onChangeEstadoEdicao: (estado: RequisicaoEstado) => void;
  podeAtualizarEstado: boolean;
  estadosVisiveisSelecionados: RequisicaoEstado[];
  updatingEstadoId: number | null;
  onClose: () => void;
  onSaveStatus: () => void;
  locale: string;
  t: (key: string) => string;
}

export function RequisitionDetailsDialog({
  open,
  onOpenChange,
  selectedRequisicao,
  canManageRequests,
  estadoEdicao,
  onChangeEstadoEdicao,
  podeAtualizarEstado,
  estadosVisiveisSelecionados,
  updatingEstadoId,
  onClose,
  onSaveStatus,
  locale,
  t,
}: Readonly<RequisitionDetailsDialogProps>) {
  const formatDateTimeOrDash = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(locale);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>{t('requisitions.ui.requestDetails')}</DialogTitle>
        </DialogHeader>

        {selectedRequisicao && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-sm grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 items-start">
                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.description')}</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.descricao || '—'}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.type')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatTipo(selectedRequisicao.tipo)}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.priority')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatPrioridade(selectedRequisicao.prioridade)}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.currentStatus')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatEstado(selectedRequisicao.estado)}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.createdBy')}</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.criadoPor?.nome || '—'}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.managedBy')}</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.geridoPor?.nome || '—'}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.creationDate')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.criadoEm)}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.lastUpdate')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.ultimaAlteracaoEstadoEm)}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.deadline')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.tempoLimite)}</p>

                {selectedRequisicao.tipo === 'MATERIAL' && (
                  <>
                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.material')}</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                        ? selectedRequisicao.itens
                            .map((item: RequisicaoItem) => formatMaterialItemLabel(item.material, item.quantidade))
                            .join(', ')
                        : selectedRequisicao.material?.nome || '—'}
                    </p>

                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.quantity')}</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                        ? selectedRequisicao.itens.reduce((sum: number, item: RequisicaoItem) => sum + (item.quantidade || 0), 0)
                        : selectedRequisicao.quantidade || '—'}
                    </p>
                  </>
                )}
                {selectedRequisicao.tipo === 'TRANSPORTE' && (
                  <>
                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.destination')}</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.destino || '—'}</p>

                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.departure')}</p>
                    <p className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.dataHoraSaida)}</p>

                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.return')}</p>
                    <p className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.dataHoraRegresso)}</p>

                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.passengers')}</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.numeroPassageiros || '—'}</p>

                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.driver')}</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.condutor || t('requisitions.labels.toBeDefined')}</p>

                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.vehicles')}</p>
                    <div className="space-y-2">
                      {getRequisicaoTransportes(selectedRequisicao).length > 0 ? getRequisicaoTransportes(selectedRequisicao).map((transporte) => (
                        <div key={`${transporte.id}-${transporte.codigo ?? 'sem-codigo'}`} className="space-y-1">
                          <p className="text-gray-900 dark:text-gray-100">{formatTransporteDisplay(transporte)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatTransporteMeta(transporte)}</p>
                        </div>
                      )) : (
                        <p className="text-gray-900 dark:text-gray-100">—</p>
                      )}
                    </div>
                  </>
                )}
                {selectedRequisicao.tipo === 'MANUTENCAO' && (
                  <>
                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.subject')}</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.assunto || '—'}</p>
                  </>
                )}
              </div>
            </div>

            {canManageRequests ? (
              <>
                <div>
                  <label htmlFor="req-estado-modal" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.labels.newStatus')}</label>
                  <select
                    id="req-estado-modal"
                    value={estadoEdicao}
                    onChange={(e) => onChangeEstadoEdicao(e.target.value as RequisicaoEstado)}
                    disabled={!podeAtualizarEstado}
                    className="w-full mt-1 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 px-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none"
                  >
                    {ESTADO_SECRETARIA_OPTIONS
                      .filter((option) => estadosVisiveisSelecionados.includes(option.value))
                      .map((option) => (
                        <option key={option.value} value={option.value}>{t(option.label)}</option>
                      ))}
                  </select>
                  {!podeAtualizarEstado && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {t('requisitions.labels.finalStateRuleHint')}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={updatingEstadoId === selectedRequisicao.id}
                  >
                    {t('requisitions.ui.close')}
                  </Button>
                  <Button
                    onClick={onSaveStatus}
                    disabled={updatingEstadoId === selectedRequisicao.id || !podeAtualizarEstado}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {updatingEstadoId === selectedRequisicao.id ? t('common.saving') : t('requisitions.ui.saveStatus')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  {t('requisitions.ui.close')}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
