import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { RequisicaoEstado, RequisicaoResponse } from '../../../services/api';
import {
  formatMaterialCategoria,
  formatManutencaoCategoriaDisplay,
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
    const grupos = new Map<string, Array<{ id: string; label: string; matricula: string; meta: string }>>();
    getRequisicaoTransportes(requisicao).forEach((transporte) => {
      const categoria = formatTransporteCategoria(transporte.categoria);
      const key = categoria || t('requisitions.labels.noCategory');
      const grupoAtual = grupos.get(key) ?? [];
      grupoAtual.push({
        id: `${transporte.id}-${transporte.codigo ?? 'sem-codigo'}`,
        label: formatVehicleTitle(transporte),
        matricula: transporte.matricula ?? '—',
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

    items.forEach((item) => {
      if (!item.manutencaoItem) return;

      const key = item.manutencaoItem.categoria || 'SEM_CATEGORIA';
      const grupoAtual = grupos.get(key) ?? {
        categoriaLabel: formatManutencaoCategoriaDisplay(item.manutencaoItem.categoria),
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
      <DialogContent className="max-w-3xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
          <DialogTitle className="text-xl font-black tracking-tight text-purple-600 dark:text-purple-400">
            # {selectedRequisicao ? formatTipo(selectedRequisicao.tipo) : t('requisitions.ui.requestDetails')}
          </DialogTitle>
        </DialogHeader>

        {selectedRequisicao && (
          <div className="p-6 space-y-6">
            {/* Informação principal - Premium Card */}
            <div className="rounded-2xl border-2 border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 p-5 shadow-sm">
              <h3 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Informação Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.currentStatus')}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-sm">
                    {formatEstado(selectedRequisicao.estado)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.priority')}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                    selectedRequisicao.prioridade === 'URGENTE' 
                      ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50' 
                      : selectedRequisicao.prioridade === 'ALTA'
                      ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50'
                      : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50'
                  }`}>
                    {formatPrioridade(selectedRequisicao.prioridade)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.createdBy')}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedRequisicao.criadoPor?.nome || '—'}</p>
                </div>
                <div className="space-y-1 text-right md:text-left">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Criado a</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{formatDateTimeOrDash(selectedRequisicao.criadoEm)}</p>
                </div>
                {selectedRequisicao.geridoPor && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.managedBy')}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedRequisicao.geridoPor.nome}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.lastUpdate')}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{formatDateTimeOrDash(selectedRequisicao.ultimaAlteracaoEstadoEm)}</p>
                </div>
              </div>
            </div>

            {/* Detalhes Específicos */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">Detalhes da Requisição</h3>
                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.description')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 leading-relaxed">
                    {selectedRequisicao.descricao || '—'}
                  </p>
                </div>


                {selectedRequisicao.tipo === 'MATERIAL' && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.quantity')}</p>
                      <p className="text-sm font-black text-purple-600 dark:text-purple-400">
                        {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                          ? selectedRequisicao.itens.reduce((sum: number, item: RequisicaoItem) => sum + (item.quantidade || 0), 0)
                          : selectedRequisicao.quantidade || '—'}
                      </p>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.materials')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {materiaisAgrupados.length > 0 ? materiaisAgrupados.map((grupo) => (
                          <div key={grupo.categoria} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-900 shadow-sm">
                            <p className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-tighter mb-2">{grupo.categoria}</p>
                            <ul className="list-inside space-y-1">
                              {grupo.itens.map((item) => (
                                <li key={item.id} className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                  {item.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-900 dark:text-gray-100">—</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedRequisicao.tipo === 'TRANSPORTE' && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.destination')}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedRequisicao.destino || '—'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.passengers')}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedRequisicao.numeroPassageiros || '—'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.departure')}</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">{formatDateTimeOrDash(selectedRequisicao.dataHoraSaida)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.return')}</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">{formatDateTimeOrDash(selectedRequisicao.dataHoraRegresso)}</p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.driver')}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedRequisicao.condutor || t('requisitions.labels.toBeDefined')}</p>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.vehicles')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupTransportesPorCategoria(selectedRequisicao).length > 0 ? groupTransportesPorCategoria(selectedRequisicao).map((grupo) => (
                          <div key={grupo.categoria} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-900 shadow-sm">
                            <p className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-tighter mb-2">{grupo.categoria}</p>
                            <div className="space-y-2">
                              {grupo.itens.map((transporte: any) => (
                                <div key={transporte.id} className="border-l-2 border-purple-100 dark:border-purple-900/50 pl-3 py-0.5">
                                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                    {transporte.label} · {transporte.matricula}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )) : (
                          <p className="text-gray-900 dark:text-gray-100">—</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedRequisicao.tipo === 'MANUTENCAO' && (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('requisitions.labels.subject')}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">{selectedRequisicao.assunto || '—'}</p>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Itens de manutenção</p>
                      <div className="grid grid-cols-1 gap-3">
                        {manutencaoAgrupada.length > 0 ? manutencaoAgrupada.map((grupo) => (
                          <div key={grupo.categoriaLabel} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <p className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">{grupo.categoriaLabel}</p>
                              {grupo.observacoes ? (
                                <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">
                                  Com observações
                                </span>
                              ) : null}
                            </div>
                            {grupo.observacoes ? (
                              <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                                {grupo.observacoes}
                              </p>
                            ) : null}
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {grupo.itens.map((item) => (
                                <li key={item.id} className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-purple-300 dark:bg-purple-700" />
                                  {item.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )) : (
                          <p className="text-gray-900 dark:text-gray-100">—</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ações de Gestão */}
            {canManageRequests && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="req-estado-modal" className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    {t('requisitions.labels.newStatus')}
                  </label>
                  <select
                    id="req-estado-modal"
                    value={estadoEdicao}
                    onChange={(e) => onChangeEstadoEdicao(e.target.value as RequisicaoEstado)}
                    disabled={!podeAtualizarEstado}
                    className="w-full h-11 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100 transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ESTADO_SECRETARIA_OPTIONS
                      .filter((option) => estadosVisiveisSelecionados.includes(option.value))
                      .map((option) => (
                        <option key={option.value} value={option.value}>{t(option.label)}</option>
                      ))}
                  </select>
                  {!podeAtualizarEstado && (
                    <p className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                      {t('requisitions.labels.finalStateRuleHint')}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={updatingEstadoId === selectedRequisicao.id}
                    className="rounded-xl font-bold text-sm h-11 px-6 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t('requisitions.ui.close')}
                  </Button>
                  <Button
                    onClick={onSaveStatus}
                    disabled={updatingEstadoId === selectedRequisicao.id || !podeAtualizarEstado}
                    className="min-w-[140px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm h-11 px-8 shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
                  >
                    {updatingEstadoId === selectedRequisicao.id ? t('common.saving') : t('requisitions.ui.saveStatus')}
                  </Button>
                </div>
              </div>
            )}
            
            {!canManageRequests && (
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl font-bold text-sm h-11 px-8"
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
