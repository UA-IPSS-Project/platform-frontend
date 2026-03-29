import type { KeyboardEvent } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  ESTADO_OPTIONS,
  PRIORIDADE_OPTIONS,
  REQUISICOES_TABS,
  RequisicoesTab,
  formatEstado,
  formatPrioridade,
  formatTipo,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { RequisicaoEstado, RequisicaoPrioridade, RequisicaoResponse } from '../../../services/api';

interface RequisitionsListFiltersContentProps {
  desktop: boolean;
  activeTab: RequisicoesTab;
  onSelectTab: (tab: RequisicoesTab) => void;
  filterEstado: RequisicaoEstado | '';
  setFilterEstado: (value: RequisicaoEstado | '') => void;
  filterPrioridade: RequisicaoPrioridade | '';
  setFilterPrioridade: (value: RequisicaoPrioridade | '') => void;
  filterCriadoPorNome: string;
  setFilterCriadoPorNome: (value: string) => void;
  filterDataInicio: string;
  setFilterDataInicio: (value: string) => void;
  filterDataFim: string;
  setFilterDataFim: (value: string) => void;
  showCreatedByRoleFilter?: boolean;
  filterCriadoPorTipo?: '' | 'SECRETARIA' | 'ESCOLA' | 'BALNEARIO' | 'INTERNO';
  setFilterCriadoPorTipo?: (value: '' | 'SECRETARIA' | 'ESCOLA' | 'BALNEARIO' | 'INTERNO') => void;
  onSearch: () => void;
  onClearFilters: () => void;
  loading: boolean;
  requisicoes: RequisicaoResponse[];
  onOpenRequisicao: (requisicao: RequisicaoResponse) => void;
  selectFieldClassName: string;
  inputFieldClassName: string;
  formatDateTimeOrDash: (value?: string | null) => string;
  t: (key: string, options?: any) => string;
}

export function RequisitionsListFiltersContent({
  desktop,
  activeTab,
  onSelectTab,
  filterEstado,
  setFilterEstado,
  filterPrioridade,
  setFilterPrioridade,
  filterCriadoPorNome,
  setFilterCriadoPorNome,
  filterDataInicio,
  setFilterDataInicio,
  filterDataFim,
  setFilterDataFim,
  showCreatedByRoleFilter = false,
  filterCriadoPorTipo = '',
  setFilterCriadoPorTipo,
  onSearch,
  onClearFilters,
  loading,
  requisicoes,
  onOpenRequisicao,
  selectFieldClassName,
  inputFieldClassName,
  formatDateTimeOrDash,
  t,
}: Readonly<RequisitionsListFiltersContentProps>) {
  const estadoId = desktop ? 'req-filter-estado-desktop' : 'req-filter-estado';
  const prioridadeId = desktop ? 'req-filter-prioridade-desktop' : 'req-filter-prioridade';
  const criadoId = desktop ? 'req-filter-criado-por-desktop' : 'req-filter-criado-por';
  const dataInicioId = desktop ? 'req-filter-data-inicio-desktop' : 'req-filter-data-inicio';
  const dataFimId = desktop ? 'req-filter-data-fim-desktop' : 'req-filter-data-fim';
  const criadoTipoId = desktop ? 'req-filter-criado-tipo-desktop' : 'req-filter-criado-tipo';

  const tabsContainerProps = desktop
    ? {
        role: 'tablist' as const,
        tabIndex: 0,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          const { key } = event;
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
            return;
          }
          event.preventDefault();
          const tabs = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
          );
          if (tabs.length === 0) {
            return;
          }
          const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
          let nextIndex = currentIndex === -1 ? 0 : currentIndex;
          if (key === 'ArrowRight') {
            nextIndex = (currentIndex + 1 + tabs.length) % tabs.length;
          } else if (key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          } else if (key === 'Home') {
            nextIndex = 0;
          } else if (key === 'End') {
            nextIndex = tabs.length - 1;
          }
          const nextTab = tabs[nextIndex];
          if (!nextTab) {
            return;
          }
          const nextValue = nextTab.dataset.tabValue;
          if (nextValue) {
            onSelectTab(nextValue as RequisicoesTab);
          }
          nextTab.focus();
        },
      }
    : {};

  return (
    <>
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('requisitions.ui.listType')}</p>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 p-2"
          aria-label={t('requisitions.ui.requestTypeTabs')}
          {...tabsContainerProps}
        >
          {REQUISICOES_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <Button
                key={tab.value}
                type="button"
                variant="ghost"
                role={desktop ? 'tab' : undefined}
                aria-selected={desktop ? isActive : undefined}
                tabIndex={desktop ? (isActive ? 0 : -1) : undefined}
                data-tab-value={desktop ? tab.value : undefined}
                onClick={() => onSelectTab(tab.value)}
                className={`h-10 w-full justify-center rounded-lg border transition-all duration-200 ${isActive
                  ? 'border-purple-500 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'border-transparent bg-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-800/70'
                  }`}
                aria-pressed={!desktop ? isActive : undefined}
                aria-label={!desktop ? t('requisitions.ui.selectTab', { tab: t(tab.label) }) : undefined}
              >
                {t(tab.label)}
              </Button>
            );
          })}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showCreatedByRoleFilter ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3`}>
        <div>
          <label htmlFor={estadoId} className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.status')}</label>
          <select
            id={estadoId}
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as RequisicaoEstado | '')}
            className={selectFieldClassName}
          >
            {ESTADO_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>{t(option.label)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={prioridadeId} className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.priority')}</label>
          <select
            id={prioridadeId}
            value={filterPrioridade}
            onChange={(e) => setFilterPrioridade(e.target.value as RequisicaoPrioridade | '')}
            className={selectFieldClassName}
          >
            <option value="">{t('requisitions.ui.allPriorities')}</option>
            {PRIORIDADE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.label)}</option>
            ))}
          </select>
        </div>

        {showCreatedByRoleFilter && (
          <div>
            <label htmlFor={criadoTipoId} className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.createdByRole')}</label>
            <select
              id={criadoTipoId}
              value={filterCriadoPorTipo}
              onChange={(e) => setFilterCriadoPorTipo?.(e.target.value as '' | 'SECRETARIA' | 'ESCOLA' | 'BALNEARIO' | 'INTERNO')}
              className={selectFieldClassName}
            >
              <option value="">{t('requisitions.ui.allRoles')}</option>
              <option value="SECRETARIA">{t('requisitions.ui.roleSecretary')}</option>
              <option value="ESCOLA">{t('requisitions.ui.roleSchool')}</option>
              <option value="BALNEARIO">{t('requisitions.ui.roleBalneario')}</option>
              <option value="INTERNO">{t('requisitions.ui.roleInterno')}</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor={criadoId} className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5 block">{t('requisitions.ui.createdByName')}</label>
          <Input id={criadoId} className={`${inputFieldClassName} focus:ring-purple-500/20`} type="text" value={filterCriadoPorNome} onChange={(e) => setFilterCriadoPorNome(e.target.value)} placeholder={t('requisitions.ui.createdByPlaceholder')} />
        </div>

        <div>
          <label htmlFor={dataInicioId} className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5 block">{t('requisitions.ui.startDate')}</label>
          <Input id={dataInicioId} className={inputFieldClassName} type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} />
        </div>

        <div>
          <label htmlFor={dataFimId} className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1.5 block">{t('requisitions.ui.endDate')}</label>
          <Input id={dataFimId} className={inputFieldClassName} type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSearch} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
          {loading ? t('requisitions.ui.searching') : t('requisitions.ui.search')}
        </Button>
        <Button variant="outline" onClick={onClearFilters} disabled={loading}>{t('requisitions.ui.clearFilters')}</Button>
      </div>

      {requisicoes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-12 text-center bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('requisitions.ui.noRequestsForFilters')}</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${desktop ? 'xl:grid-cols-2' : 'lg:grid-cols-2'} gap-4 mt-6`}>
          {requisicoes.map((req) => (
            <div 
              key={req.id} 
              className="group relative rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-5 transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    # {formatTipo(req.tipo)}
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID: {req.id}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    req.prioridade === 'URGENTE' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                      : req.prioridade === 'ALTA'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {formatPrioridade(req.prioridade)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-semibold"
                    onClick={() => onOpenRequisicao(req)}
                  >
                    {t('requisitions.ui.details', 'Detalhes')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{t('requisitions.labels.status')}</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatEstado(req.estado)}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{t('requisitions.labels.createdBy')}</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{req.criadoPor?.nome || req.criadoPor?.id || '—'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">Criado a</p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 italic">{formatDateTimeOrDash(req.criadoEm)}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{t('requisitions.labels.deadline')}</p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 italic">{formatDateTimeOrDash(req.tempoLimite)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
