import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { RequisicaoEstado, RequisicaoResponse } from '../../../services/api';
import {
  formatMaterialCategoria,
  ESTADO_SECRETARIA_OPTIONS,
  RequisicaoItem,
  formatEstado,
  formatPrioridade,
  formatTipo,
  formatVehicleTitle,
  formatLotacao,
  formatTransporteCategoria,
  formatTransporteDisplay,
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

  const groupMateriaisPorCategoria = (items: RequisicaoItem[] = []) => {
    const grupos = new Map<string, Array<{ id: string; label: string }>>();
    items.forEach((item) => {
      const categoria = formatMaterialCategoria(item.material?.categoria);
      const nome = item.material?.nome ?? t('requisitions.labels.material');
      const variante = item.material?.valorAtributo ? ` ${item.material.valorAtributo}` : '';
      const quantidade = item.quantidade ?? 0;
      const linha = `${nome}${variante} ${quantidade}x`;
      const key = categoria || t('requisitions.labels.noCategory');
      const grupoAtual = grupos.get(key) ?? [];
      grupoAtual.push({
        id: `${item.material?.id ?? 'sem-id'}-${item.material?.atributo ?? 'sem-atributo'}-${item.material?.valorAtributo ?? 'sem-valor'}`,
        label: linha,
      });
      grupos.set(key, grupoAtual);
    });
    return Array.from(grupos.entries()).map(([categoria, itens]) => ({ categoria, itens }));
  };

  const groupTransportesPorCategoria = (requisicao: RequisicaoResponse) => {
    const grupos = new Map<string, Array<{ id: string; label: string; meta: string }>>();
    getRequisicaoTransportes(requisicao).forEach((transporte) => {
      const categoria = formatTransporteCategoria(transporte.categoria);
      const key = categoria || t('requisitions.labels.noCategory');
      const grupoAtual = grupos.get(key) ?? [];
      grupoAtual.push({
        id: `${transporte.id}-${transporte.codigo ?? 'sem-codigo'}`,
        label: formatVehicleTitle(transporte),
        meta: `${formatTransporteDisplay(transporte)}${transporte.lotacao ? ` - ${formatLotacao(transporte.lotacao)}` : ''}`,
      });
      grupos.set(key, grupoAtual);
    });
    return Array.from(grupos.entries()).map(([categoria, itens]) => ({ categoria, itens }));
  };

  const groupManutencaoPorCategoria = (items: RequisicaoItem[] = []) => {
    const grupos = new Map<string, {
      categoriaLabel: string;
      observacoes?: string;
      itens: Array<{ id: string; label: string }>;
    }>();

    const categoriaLabel = (categoria?: string) => {
      if (categoria === 'CATL') return 'CATL';
      if (categoria === 'RC') return 'R/C';
      if (categoria === 'PRE_ESCOLAR') return 'Pré Escolar';
      if (categoria === 'CRECHE') return 'Crech';
      return categoria || t('requisitions.labels.noCategory');
    };

    items.forEach((item) => {
      if (!item.manutencaoItem) return;

      const key = item.manutencaoItem.categoria || 'SEM_CATEGORIA';
      const grupoAtual = grupos.get(key) ?? {
        categoriaLabel: categoriaLabel(item.manutencaoItem.categoria),
        observacoes: undefined,
        itens: [],
      };

      grupoAtual.itens.push({
        id: `${item.id ?? 'sem-id'}-${item.manutencaoItem.id}`,
        label: `${item.manutencaoItem.espaco ?? '—'} - ${item.manutencaoItem.itemVerificacao ?? '—'}`,
      });

      // Observacao e comum a categoria. Guarda apenas uma vez.
      if (!grupoAtual.observacoes && item.observacoes?.trim()) {
        grupoAtual.observacoes = item.observacoes.trim();
      }

      grupos.set(key, grupoAtual);
    });

    return Array.from(grupos.values());
  };

  const materiaisAgrupados = selectedRequisicao?.tipo === 'MATERIAL'
    ? groupMateriaisPorCategoria(selectedRequisicao.itens ?? [])
    : [];

  const manutencaoAgrupada = selectedRequisicao?.tipo === 'MANUTENCAO'
    ? groupManutencaoPorCategoria(selectedRequisicao.itens ?? [])
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle># {selectedRequisicao ? formatTipo(selectedRequisicao.tipo) : t('requisitions.ui.requestDetails')}</DialogTitle>
        </DialogHeader>

        {selectedRequisicao && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Informação principal</h3>
              <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-start">
                <p><span className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.currentStatus')}:</span> <span className="text-gray-900 dark:text-gray-100">{formatEstado(selectedRequisicao.estado)}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.priority')}:</span> <span className="text-gray-900 dark:text-gray-100">{formatPrioridade(selectedRequisicao.prioridade)}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.createdBy')}:</span> <span className="text-gray-900 dark:text-gray-100">{selectedRequisicao.criadoPor?.nome || '—'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.managedBy')}:</span> <span className="text-gray-900 dark:text-gray-100">{selectedRequisicao.geridoPor?.nome || '—'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Criado a:</span> <span className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.criadoEm)}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.deadline')}:</span> <span className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.tempoLimite)}</span></p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Detalhes</h3>
              <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-start">
                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.description')}</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.descricao || '—'}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.type')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatTipo(selectedRequisicao.tipo)}</p>

                <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.lastUpdate')}</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDateTimeOrDash(selectedRequisicao.ultimaAlteracaoEstadoEm)}</p>

                {selectedRequisicao.tipo === 'MATERIAL' && (
                  <>
                    <p className="text-gray-500 dark:text-gray-400">{t('requisitions.labels.quantity')}</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                        ? selectedRequisicao.itens.reduce((sum: number, item: RequisicaoItem) => sum + (item.quantidade || 0), 0)
                        : selectedRequisicao.quantidade || '—'}
                    </p>

                    <p className="text-gray-500 dark:text-gray-400 md:col-span-2">{t('requisitions.labels.materials')}</p>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {materiaisAgrupados.length > 0 ? materiaisAgrupados.map((grupo) => (
                        <div key={grupo.categoria} className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{grupo.categoria}:</p>
                          <ul className="mt-1 list-disc list-inside text-gray-700 dark:text-gray-300 space-y-0.5">
                            {grupo.itens.map((item) => (
                              <li key={item.id}>{item.label}</li>
                            ))}
                          </ul>
                        </div>
                      )) : (
                        <p className="text-gray-900 dark:text-gray-100">—</p>
                      )}
                    </div>
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

                    <p className="text-gray-500 dark:text-gray-400 md:col-span-2">{t('requisitions.labels.vehicles')}</p>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupTransportesPorCategoria(selectedRequisicao).length > 0 ? groupTransportesPorCategoria(selectedRequisicao).map((grupo) => (
                        <div key={grupo.categoria} className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{grupo.categoria}:</p>
                          <div className="mt-1 space-y-1">
                            {grupo.itens.map((transporte) => (
                              <div key={transporte.id}>
                                <p className="text-gray-900 dark:text-gray-100">{transporte.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{transporte.meta}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <p className="text-gray-900 dark:text-gray-100">—</p>
                      )}
                    </div>
                  </>
                )}
                {selectedRequisicao.tipo === 'MANUTENCAO' && (
                  <>
                    <p className="text-gray-500 dark:text-gray-400 md:col-span-2">{t('requisitions.labels.subject')}</p>
                    <div className="md:col-span-2 rounded-md border border-gray-200 dark:border-gray-700 p-3">
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.assunto || '—'}</p>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 md:col-span-2">Itens de manutenção</p>
                    <div className="md:col-span-2 grid grid-cols-1 gap-4">
                      {manutencaoAgrupada.length > 0 ? manutencaoAgrupada.map((grupo) => (
                        <div key={grupo.categoriaLabel} className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{grupo.categoriaLabel}</p>
                          {grupo.observacoes ? (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Obs: {grupo.observacoes}</p>
                          ) : null}
                          <ul className="mt-1 list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                            {grupo.itens.map((item) => (
                              <li key={item.id}>{item.label}</li>
                            ))}
                          </ul>
                        </div>
                      )) : (
                        <p className="text-gray-900 dark:text-gray-100">—</p>
                      )}
                    </div>
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
