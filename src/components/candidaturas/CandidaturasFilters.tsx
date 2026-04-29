import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTranslation } from 'react-i18next';
import { CandidaturasCard } from './CandidaturasCard';

interface CandidaturasFiltersProps {
  mode: 'secretaria' | 'utente';
  isCatl?: boolean;
  candidaturaType?: string;
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  nifFilter?: string;
  onNifFilterChange?: (value: string) => void;
  genderFilter?: string;
  onGenderFilterChange?: (value: string) => void;
  ageFilter?: string;
  onAgeFilterChange?: (value: string) => void;
  signatureFilter?: string;
  onSignatureFilterChange?: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  sortFilter?: string;
  onSortFilterChange?: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onNewCandidatura?: () => void;
  disableApply?: boolean;
}

export function CandidaturasFilters({
  mode,
  isCatl = false,
  candidaturaType,
  nameFilter,
  onNameFilterChange,
  nifFilter,
  genderFilter,
  onGenderFilterChange,
  onNifFilterChange,
  ageFilter,
  onAgeFilterChange,
  signatureFilter,
  onSignatureFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  sortFilter,
  onSortFilterChange,
  onApplyFilters,
  onClearFilters,
  onNewCandidatura,
  disableApply = false,
}: Readonly<CandidaturasFiltersProps>) {
  const { t } = useTranslation();
  const upperType = (candidaturaType || '').toUpperCase();
  const isFiltered = isCatl || upperType === 'CRECHE' || upperType === 'ERPI';
  const inputClassName =
    'h-11 rounded-xl border-border/70 bg-gradient-to-b from-background to-muted/30 px-4 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30';
  const selectClassName =
    'w-full h-11 appearance-none rounded-xl border border-border/70 bg-gradient-to-b from-background to-muted/30 px-4 pr-10 text-sm text-foreground shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30';
  const dateClassName =
    'w-full h-11 rounded-xl border border-border/70 bg-gradient-to-b from-background to-muted/30 px-4 text-sm text-foreground shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <CandidaturasCard className="mb-6 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('applications.flow.filters.candidateName')}
          </label>
          <Input
            type="text"
            value={nameFilter}
            onChange={(event) => onNameFilterChange(event.target.value)}
            placeholder={t('applications.flow.filters.candidateNamePlaceholder')}
            pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s-]*"
            title="Use apenas letras, acentos, espaços e hífen (-)"
            className={inputClassName}
          />
        </div>

        { (isCatl || (candidaturaType || '').toUpperCase() === 'CRECHE' || (candidaturaType || '').toUpperCase() === 'ERPI') && mode === 'secretaria' ? (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                NIF
              </label>
              <div>
                <Input
                  type="text"
                  value={nifFilter || ''}
                  onChange={(event) => onNifFilterChange?.(event.target.value)}
                  placeholder="Introduza o NIF"
                  inputMode="numeric"
                  pattern="\\d{9}"
                  title="O NIF deve ter exatamente 9 dígitos"
                  maxLength={9}
                  className={inputClassName}
                />
              </div>
            </div>

            {(candidaturaType || '').toUpperCase() === 'ERPI' ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Género
                </label>
                <div className="relative">
                  <select
                    value={genderFilter || ''}
                    onChange={(event) => onGenderFilterChange?.(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Todos</option>
                    <option value="F">Mulher</option>
                    <option value="M">Homem</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Idade
                </label>
                <Input
                  type="number"
                  min={0}
                  value={ageFilter || ''}
                  onChange={(event) => onAgeFilterChange?.(event.target.value)}
                  placeholder="Ex.: 6"
                  className={inputClassName}
                />
              </div>
            )}
          </>
        ) : null}

        {isFiltered && mode === 'secretaria' ? (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado da candidatura
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => onStatusFilterChange(event.target.value)}
                  className={selectClassName}
                >
                  <option value="">{t('applications.flow.status.all')}</option>
                  <option value="PENDENTE">{t('applications.flow.status.pending')}</option>
                  {isFiltered ? <option value="LISTA_DE_ESPERA">Lista de espera</option> : null}
                  <option value="APROVADA">{t('applications.flow.status.approved')}</option>
                  <option value="REJEITADA">{t('applications.flow.status.rejected')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {isFiltered ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estado da assinatura
                </label>
                <div className="relative">
                  <select
                    value={signatureFilter || ''}
                    onChange={(event) => onSignatureFilterChange?.(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Todos</option>
                    <option value="COM_ASSINATURA">Com assinatura</option>
                    <option value="SEM_ASSINATURA">Sem assinatura</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            ) : null}

            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('applications.flow.filters.applicationDate')}
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => onDateFilterChange(event.target.value)}
                className={dateClassName}
              />
            </div>

            {isFiltered && mode === 'secretaria' ? (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ordenação
                </label>
                <div className="relative">
                  <select
                    value={sortFilter || 'criterios'}
                    onChange={(event) => onSortFilterChange?.(event.target.value)}
                    className={selectClassName}
                  >
                    <option value="criterios">Critérios</option>
                    <option value="dataAsc">Data: mais recentes</option>
                    <option value="dataDesc">Data: mais antigas</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:col-span-2 lg:col-span-4 lg:justify-end lg:pt-1">
          {mode === 'secretaria' ? (
            <>
              <Button
                type="button"
                onClick={onApplyFilters}
                disabled={disableApply}
                className={`w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-sm transition-all hover:-translate-y-0.5 ${disableApply ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  {t('applications.flow.actions.search')}
                </span>
              </Button>
              <Button
                type="button"
                onClick={onClearFilters}
                variant="outline"
                className="w-full sm:w-auto rounded-xl px-6 border-border bg-background shadow-sm transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {t('applications.flow.actions.clearFilters')}
                </span>
              </Button>
            </>
          ) : null}

          {mode === 'utente' && onNewCandidatura ? (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={onNewCandidatura}
            >
              {t('applications.flow.actions.newApplication')}
            </Button>
          ) : null}
        </div>
      </div>
    </CandidaturasCard>
  );
}
