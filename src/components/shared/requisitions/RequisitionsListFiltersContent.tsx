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
  filterGeridoPorNome: string;
  setFilterGeridoPorNome: (value: string) => void;
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
  filterGeridoPorNome,
  setFilterGeridoPorNome,
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
  const geridoId = desktop ? 'req-filter-gerido-por-desktop' : 'req-filter-gerido-por';
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
          <label htmlFor={criadoId} className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.createdByName')}</label>
          <Input id={criadoId} className={inputFieldClassName} type="text" value={filterCriadoPorNome} onChange={(e) => setFilterCriadoPorNome(e.target.value)} placeholder={t('requisitions.ui.createdByPlaceholder')} />
        </div>

        <div>
          <label htmlFor={geridoId} className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.managedByName')}</label>
          <Input id={geridoId} className={inputFieldClassName} type="text" value={filterGeridoPorNome} onChange={(e) => setFilterGeridoPorNome(e.target.value)} placeholder={t('requisitions.ui.managedByPlaceholder')} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSearch} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
          {loading ? t('requisitions.ui.searching') : t('requisitions.ui.search')}
        </Button>
        <Button variant="outline" onClick={onClearFilters} disabled={loading}>{t('requisitions.ui.clearFilters')}</Button>
      </div>

      {requisicoes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
          {t('requisitions.ui.noRequestsForFilters')}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${desktop ? 'xl:grid-cols-2' : 'lg:grid-cols-2'} gap-3`}>
          {requisicoes.map((req) => (
            <div key={req.id} className="rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-gray-900 dark:text-gray-100"># {formatTipo(req.tipo)}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrioridade(req.prioridade)}</p>
                  <Button
                    variant="outline"
                    className="h-8 px-3"
                    onClick={() => onOpenRequisicao(req)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-1">
                <p>{t('requisitions.labels.status')}: {formatEstado(req.estado)}</p>
                <p>{t('requisitions.labels.createdBy')}: {req.criadoPor?.nome || req.criadoPor?.id || '—'}</p>
                <p>Criado a: {formatDateTimeOrDash(req.criadoEm)}</p>
                <p>{t('requisitions.labels.deadline')}: {formatDateTimeOrDash(req.tempoLimite)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
