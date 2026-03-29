import type { KeyboardEvent } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { DatePickerField } from '../../ui/date-picker-field';
import { 
  ESTADO_OPTIONS, 
  PRIORIDADE_OPTIONS, 
  REQUISICOES_TABS, 
  RequisicoesTab, 
  formatEstado, 
  formatPrioridade, 
  formatTipo 
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { RequisicaoEstado, RequisicaoPrioridade, RequisicaoResponse } from '../../../services/api';
import { Search, X } from 'lucide-react';

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

      <div className="space-y-4">
        {/* Row 1: Basic Status Filters */}
        <div className={`grid grid-cols-1 ${showCreatedByRoleFilter ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          <div className="space-y-1">
            <label htmlFor={estadoId} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
              {t('requisitions.ui.status')}
            </label>
            <select
              id={estadoId}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as RequisicaoEstado | '')}
              className={`${selectFieldClassName} rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all focus:ring-purple-500/20 text-sm`}
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{t(option.label)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor={prioridadeId} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
              {t('requisitions.ui.priority')}
            </label>
            <select
              id={prioridadeId}
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value as RequisicaoPrioridade | '')}
              className={`${selectFieldClassName} rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all focus:ring-purple-500/20 text-sm`}
            >
              <option value="">{t('requisitions.ui.allPriorities')}</option>
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(option.label)}</option>
              ))}
            </select>
          </div>

          {showCreatedByRoleFilter && (
            <div className="space-y-1">
              <label htmlFor={criadoTipoId} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
                {t('requisitions.ui.createdByRole')}
              </label>
              <select
                id={criadoTipoId}
                value={filterCriadoPorTipo}
                onChange={(e) => setFilterCriadoPorTipo?.(e.target.value as '' | 'SECRETARIA' | 'ESCOLA' | 'BALNEARIO' | 'INTERNO')}
                className={`${selectFieldClassName} rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all focus:ring-purple-500/20 text-sm`}
              >
                <option value="">{t('requisitions.ui.allRoles')}</option>
                <option value="SECRETARIA">{t('requisitions.ui.roleSecretary')}</option>
                <option value="ESCOLA">{t('requisitions.ui.roleSchool')}</option>
                <option value="BALNEARIO">{t('requisitions.ui.roleBalneario')}</option>
                <option value="INTERNO">{t('requisitions.ui.roleInterno')}</option>
              </select>
            </div>
          )}
        </div>

        {/* Row 2: Search and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor={criadoId} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
              {t('requisitions.ui.createdByName')}
            </label>
            <Input 
              id={criadoId} 
              className={`${inputFieldClassName} rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-purple-500/20 text-sm`} 
              type="text" 
              value={filterCriadoPorNome} 
              onChange={(e) => setFilterCriadoPorNome(e.target.value)} 
              placeholder={t('requisitions.ui.createdByPlaceholder')} 
            />
          </div>

          <div className="space-y-0.5 md:space-y-1">
            <label htmlFor={dataInicioId} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
              {t('requisitions.ui.startDate')}
            </label>
            <DatePickerField
              id={dataInicioId}
              value={filterDataInicio}
              onChange={setFilterDataInicio}
              placeholder="dd/mm/yyyy"
              buttonClassName="h-9 md:h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-purple-500/20 text-sm"
            />
          </div>

          <div className="space-y-0.5 md:space-y-1">
            <label htmlFor={dataFimId} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">
              {t('requisitions.ui.endDate')}
            </label>
            <DatePickerField
              id={dataFimId}
              value={filterDataFim}
              onChange={setFilterDataFim}
              placeholder="dd/mm/yyyy"
              buttonClassName="h-9 md:h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-purple-500/20 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Button 
          onClick={onSearch} 
          disabled={loading} 
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('requisitions.ui.searching')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              {t('requisitions.ui.search')}
            </span>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={onClearFilters} 
          disabled={loading}
          className="rounded-xl px-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <X className="w-4 h-4 mr-2" />
          {t('requisitions.ui.clearFilters')}
        </Button>
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
              onClick={() => onOpenRequisicao(req)}
              className="group relative rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md p-4 transition-all duration-300 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex flex-col gap-0.5">
                  <p className="font-extrabold text-base text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors tracking-tight">
                    # {formatTipo(req.tipo)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    req.prioridade === 'URGENTE' 
                      ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50' 
                      : req.prioridade === 'ALTA'
                      ? 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50'
                      : 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50'
                  }`}>
                    {formatPrioridade(req.prioridade)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all font-bold text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRequisicao(req);
                    }}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('requisitions.labels.status')}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{formatEstado(req.estado)}</p>
                </div>
                <div className="space-y-0.5 sm:text-center">
                  <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Criado a
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">{formatDateTimeOrDash(req.criadoEm)}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('requisitions.labels.createdBy')}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[140px] ml-auto">{req.criadoPor?.nome || req.criadoPor?.id || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
