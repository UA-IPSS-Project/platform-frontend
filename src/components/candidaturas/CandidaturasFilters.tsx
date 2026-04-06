import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

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
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 mb-6 bg-gray-50/70 dark:bg-gray-800/40">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {t('applications.flow.filters.candidateName')}
          </label>
          <input
            type="text"
            value={nameFilter}
            onChange={(event) => onNameFilterChange(event.target.value)}
            placeholder={t('applications.flow.filters.candidateNamePlaceholder')}
            className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {mode === 'secretaria' ? (
          <>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('applications.flow.filters.candidateStatus')}
              </label>
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t('applications.flow.status.all')}</option>
                <option value="PENDENTE">{t('applications.flow.status.pending')}</option>
                <option value="APROVADA">{t('applications.flow.status.approved')}</option>
                <option value="REJEITADA">{t('applications.flow.status.rejected')}</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t('applications.flow.filters.applicationDate')}
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => onDateFilterChange(event.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full md:w-auto bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {t('applications.flow.actions.applyFilters')}
              </Button>
              <Button
                type="button"
                onClick={onClearFilters}
                variant="outline"
                className="w-full md:w-auto"
              >
                {t('applications.flow.actions.clearFilters')}
              </Button>
            </>
          ) : null}

          {mode === 'utente' && onNewCandidatura ? (
            <Button
              type="button"
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onNewCandidatura}
            >
              {t('applications.flow.actions.newApplication')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
