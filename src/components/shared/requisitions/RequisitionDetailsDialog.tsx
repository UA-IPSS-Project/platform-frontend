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
  formatTransporteCategoria,
  getRequisicaoTransportes,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { VehicleSelectionCard } from './VehicleSelectionCard';

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
    const grupos = new Map<string, Array<any>>();
    getRequisicaoTransportes(requisicao).forEach((transporte) => {
      const categoria = formatTransporteCategoria(transporte.categoria);
      const key = categoria || t('requisitions.labels.noCategory');
      const grupoAtual = grupos.get(key) ?? [];
      grupoAtual.push(transporte);
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
      <DialogContent className="max-w-3xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl shadow-2xl">
        <DialogHeader className="p-6 border-b border-border bg-muted/50 backdrop-blur-md">
          <DialogTitle className="text-xl font-black tracking-tight text-primary">
            # {selectedRequisicao ? formatTipo(selectedRequisicao.tipo) : t('requisitions.ui.requestDetails')}
          </DialogTitle>
        </DialogHeader>

        {selectedRequisicao && (
          <div className="p-6 space-y-6">
            {/* Informação principal - Premium Card */}
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 shadow-sm">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Informação Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.currentStatus')}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-card border border-border text-foreground shadow-sm">
                    {formatEstado(selectedRequisicao.estado)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.priority')}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                    selectedRequisicao.prioridade === 'URGENTE' 
                      ? 'bg-status-error-soft text-status-error border-status-error/40' 
                      : selectedRequisicao.prioridade === 'ALTA'
                      ? 'bg-status-warning-soft text-status-warning border-status-warning/40'
                      : 'bg-status-info-soft text-status-info border-status-info/40'
                  }`}>
                    {formatPrioridade(selectedRequisicao.prioridade)}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.createdBy')}</p>
                  <p className="text-sm font-semibold text-foreground">{selectedRequisicao.criadoPor?.nome || '—'}</p>
                </div>
                <div className="space-y-1 text-right md:text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Criado a</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatDateTimeOrDash(selectedRequisicao.criadoEm)}</p>
                </div>
                {selectedRequisicao.geridoPor && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.managedBy')}</p>
                    <p className="text-sm font-semibold text-foreground">{selectedRequisicao.geridoPor.nome}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.lastUpdate')}</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatDateTimeOrDash(selectedRequisicao.ultimaAlteracaoEstadoEm)}</p>
                </div>
              </div>
            </div>

            {/* Detalhes Específicos */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Detalhes da Requisição</h3>
                <div className="h-px bg-border w-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.description')}</p>
                  <p className="text-sm text-foreground bg-muted p-3 rounded-xl border border-border leading-relaxed">
                    {selectedRequisicao.descricao || '—'}
                  </p>
                </div>


                {selectedRequisicao.tipo === 'MATERIAL' && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.quantity')}</p>
                      <p className="text-sm font-black text-primary">
                        {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                          ? selectedRequisicao.itens.reduce((sum: number, item: RequisicaoItem) => sum + (item.quantidade || 0), 0)
                          : selectedRequisicao.quantidade || '—'}
                      </p>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.materials')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {materiaisAgrupados.length > 0 ? materiaisAgrupados.map((grupo) => (
                          <div key={grupo.categoria} className="rounded-xl border border-border p-3 bg-card shadow-sm">
                            <p className="text-[11px] font-black text-primary uppercase tracking-tighter mb-2">{grupo.categoria}</p>
                            <ul className="list-inside space-y-1">
                              {grupo.itens.map((item) => (
                                <li key={item.id} className="text-xs font-semibold text-foreground flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                  {item.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )) : (
                          <p className="text-sm text-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedRequisicao.tipo === 'TRANSPORTE' && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.destination')}</p>
                      <p className="text-sm font-semibold text-foreground">{selectedRequisicao.destino || '—'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.passengers')}</p>
                      <p className="text-sm font-semibold text-foreground">{selectedRequisicao.numeroPassageiros || '—'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.departure')}</p>
                      <p className="text-sm font-medium text-foreground tabular-nums">{formatDateTimeOrDash(selectedRequisicao.dataHoraSaida)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.return')}</p>
                      <p className="text-sm font-medium text-foreground tabular-nums">{formatDateTimeOrDash(selectedRequisicao.dataHoraRegresso)}</p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.driver')}</p>
                      <p className="text-sm font-semibold text-foreground">{selectedRequisicao.condutor || t('requisitions.labels.toBeDefined')}</p>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.labels.vehicles')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupTransportesPorCategoria(selectedRequisicao).length > 0 ? groupTransportesPorCategoria(selectedRequisicao).map((grupo) => (
                          <div key={grupo.categoria} className="rounded-xl border border-border p-3 bg-card shadow-sm">
                            <p className="text-[11px] font-black text-primary uppercase tracking-tighter mb-2">{grupo.categoria}</p>
                             <div className="space-y-2">
                               {grupo.itens.map((transporte: any) => (
                                 <VehicleSelectionCard
                                   key={transporte.id}
                                   transporte={transporte}
                                   showCheckbox={false}
                                   showCategory={false}
                                   variant="minimal"
                                   t={t}
                                 />
                               ))}
                             </div>
                          </div>
                        )) : (
                          <p className="text-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedRequisicao.tipo === 'MANUTENCAO' && (
                  <>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Itens de manutenção</p>
                      <div className="grid grid-cols-1 gap-3">
                        {manutencaoAgrupada.length > 0 ? manutencaoAgrupada.map((grupo) => (
                          <div key={grupo.categoriaLabel} className="rounded-xl border border-border p-4 bg-card shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <p className="text-xs font-black text-primary uppercase tracking-wider">{grupo.categoriaLabel}</p>
                              {grupo.observacoes ? (
                                <span className="text-[9px] font-bold bg-status-warning-soft text-status-warning px-2 py-0.5 rounded-full border border-status-warning/30">
                                  Com observações
                                </span>
                              ) : null}
                            </div>
                            {grupo.observacoes ? (
                              <p className="mb-3 text-[11px] text-muted-foreground font-medium italic bg-muted p-2 rounded-lg">
                                {grupo.observacoes}
                              </p>
                            ) : null}
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {grupo.itens.map((item) => (
                                <li key={item.id} className="text-xs font-semibold text-foreground flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-primary/40" />
                                  {item.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )) : (
                          <p className="text-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ações de Gestão */}
            {canManageRequests && (
              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="req-estado-modal" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
                    {t('requisitions.labels.newStatus')}
                  </label>
                  <select
                    id="req-estado-modal"
                    value={estadoEdicao}
                    onChange={(e) => onChangeEstadoEdicao(e.target.value as RequisicaoEstado)}
                    disabled={!podeAtualizarEstado}
                    className="w-full h-11 rounded-xl border-2 border-border bg-card px-4 text-sm font-semibold text-foreground transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ESTADO_SECRETARIA_OPTIONS
                      .filter((option) => estadosVisiveisSelecionados.includes(option.value))
                      .map((option) => (
                        <option key={option.value} value={option.value}>{t(option.label)}</option>
                      ))}
                  </select>
                  {!podeAtualizarEstado && (
                    <p className="mt-1 text-[10px] font-bold text-status-warning uppercase tracking-tighter">
                      {t('requisitions.labels.finalStateRuleHint')}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={updatingEstadoId === selectedRequisicao.id}
                    className="rounded-xl font-bold text-sm h-11 px-6 hover:bg-accent"
                  >
                    {t('requisitions.ui.close')}
                  </Button>
                  <Button
                    onClick={onSaveStatus}
                    disabled={updatingEstadoId === selectedRequisicao.id || !podeAtualizarEstado}
                    className="min-w-[140px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-11 px-8 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
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
