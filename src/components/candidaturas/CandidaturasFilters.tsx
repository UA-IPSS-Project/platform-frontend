import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTranslation } from 'react-i18next';
import { CandidaturasCard } from './CandidaturasCard';

interface CandidaturasFiltersProps {
  mode: 'secretaria' | 'utente';
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onNewCandidatura?: () => void;
}

export function CandidaturasFilters({
  mode,
  nameFilter,
  onNameFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  onApplyFilters,
  onClearFilters,
  onNewCandidatura,
}: Readonly<CandidaturasFiltersProps>) {
  const { t } = useTranslation();

  return (
    <CandidaturasCard className="mb-6 p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('applications.flow.filters.candidateName')}
          </label>
          <Input
            type="text"
            value={nameFilter}
            onChange={(event) => onNameFilterChange(event.target.value)}
            placeholder={t('applications.flow.filters.candidateNamePlaceholder')}
          />
        </div>

        {mode === 'secretaria' ? (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('applications.flow.filters.candidateStatus')}
              </label>
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">{t('applications.flow.status.all')}</option>
                <option value="PENDENTE">{t('applications.flow.status.pending')}</option>
                <option value="APROVADA">{t('applications.flow.status.approved')}</option>
                <option value="REJEITADA">{t('applications.flow.status.rejected')}</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('applications.flow.filters.applicationDate')}
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => onDateFilterChange(event.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
          </>
        ) : null}

        <div className="md:ml-auto flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {mode === 'secretaria' ? (
            <>
              <Button
                type="button"
                onClick={onApplyFilters}
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-sm transition-all hover:-translate-y-0.5"
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
                className="w-full md:w-auto rounded-xl px-6 border-border bg-background shadow-sm transition-all hover:-translate-y-0.5"
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
              className="w-full md:w-auto"
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
