import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { CandidaturaStatusChangeDialog } from '../../components/candidaturas/CandidaturaStatusChangeDialog';
import { CandidaturasFilters } from '../../components/candidaturas/CandidaturasFilters';
import { useAuth } from '../../contexts/AuthContext';
import {
  candidaturasApi,
  type CandidaturaEstado,
  type CandidaturaResponse,
  type FormularioResponse,
} from '../../services/api';

interface CandidaturasByTypePageProps {
  mode: 'secretaria' | 'utente';
  candidaturaType: string;
  currentUserName?: string;
  currentUserId?: number;
}

const getCandidateName = (candidatura: CandidaturaResponse): string => {
  const nome = candidatura.respostas?.nome;
  const childName = candidatura.respostas?.childName;

  if (typeof nome === 'string' && nome.trim()) return nome;
  if (typeof childName === 'string' && childName.trim()) return childName;
  return 'Sem nome';
};

const toUiStatus = (status: CandidaturaEstado, t: (key: string) => string) => {
  if (status === 'APROVADA') {
    return {
      label: t('applications.flow.status.approved'),
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    };
  }

  if (status === 'REJEITADA') {
    return {
      label: t('applications.flow.status.rejected'),
      className: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    };
  }

  return {
    label: t('applications.flow.status.pending'),
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  };
};

const formatDate = (isoDate?: string): string => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('pt-PT');
};

const toDayRange = (day: string): { dataInicio: string; dataFim: string } => {
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(`${day}T23:59:59.999Z`);
  return {
    dataInicio: start.toISOString(),
    dataFim: end.toISOString(),
  };
};

export function CandidaturasByTypePage({
  mode,
  candidaturaType,
  currentUserName,
  currentUserId,
}: Readonly<CandidaturasByTypePageProps>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [forms, setForms] = useState<FormularioResponse[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [candidaturas, setCandidaturas] = useState<CandidaturaResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedDateFilter, setAppliedDateFilter] = useState('');

  const [selectedCandidatura, setSelectedCandidatura] = useState<CandidaturaResponse | null>(null);

  const normalizedType = candidaturaType.trim().toUpperCase();
  const canChangeStatus = mode === 'secretaria' && user?.role === 'SECRETARIA';

  const loadForms = async () => {
    try {
      const data = await candidaturasApi.listarFormularios(normalizedType);
      setForms(Array.isArray(data) ? data : []);
      setSelectedFormId(data[0]?.id || '');
    } catch (error) {
      toast.error(t('applications.flow.messages.loadFormsError'));
    }
  };

  useEffect(() => {
    void loadForms();
  }, [normalizedType]);

  const loadCandidaturas = async () => {
    if (!selectedFormId) {
      setCandidaturas([]);
      return;
    }

    try {
      setLoading(true);
      const filters: {
        formId: string;
        criadoPor?: number;
        estado?: CandidaturaEstado;
        dataInicio?: string;
        dataFim?: string;
      } = {
        formId: selectedFormId,
      };

      if (mode === 'utente' && typeof currentUserId === 'number') {
        filters.criadoPor = currentUserId;
      }

      if (mode === 'secretaria' && appliedStatusFilter) {
        filters.estado = appliedStatusFilter as CandidaturaEstado;
      }

      if (mode === 'secretaria' && appliedDateFilter) {
        const range = toDayRange(appliedDateFilter);
        filters.dataInicio = range.dataInicio;
        filters.dataFim = range.dataFim;
      }

      const data = await candidaturasApi.listarCandidaturas(filters);
      setCandidaturas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('applications.flow.messages.loadApplicationsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidaturas();
  }, [selectedFormId, mode, currentUserId, appliedStatusFilter, appliedDateFilter]);

  const visibleCandidaturas = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    if (!normalizedName) return candidaturas;

    return candidaturas.filter((item) => getCandidateName(item).toLowerCase().includes(normalizedName));
  }, [candidaturas, nameFilter]);

  const handleApplyFilters = () => {
    setAppliedStatusFilter(statusFilter);
    setAppliedDateFilter(dateFilter);
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setDateFilter('');
    setAppliedStatusFilter('');
    setAppliedDateFilter('');
  };

  const handleChangeStatus = async (newStatus: CandidaturaEstado) => {
    if (!selectedCandidatura) return;

    try {
      await candidaturasApi.atualizarEstado(selectedCandidatura.id, { estado: newStatus });
      toast.success(t('applications.flow.messages.statusUpdatedSuccess'));
      setSelectedCandidatura(null);
      await loadCandidaturas();
    } catch (error: any) {
      toast.error(error?.message || t('applications.flow.messages.statusUpdateError'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-4 p-6 sm:p-8 bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('applications.flow.labels.titleByType', { type: normalizedType })}</h1>
        {forms.length > 1 ? (
          <select
            value={selectedFormId}
            onChange={(event) => setSelectedFormId(event.target.value)}
            className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 text-sm text-gray-800 dark:text-gray-100"
          >
            {forms.map((form) => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      <CandidaturasFilters
        mode={mode}
        nameFilter={nameFilter}
        onNameFilterChange={setNameFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onNewCandidatura={
          mode === 'utente' ? () => navigate(`/dashboard/${candidaturaType.toLowerCase()}/new`) : undefined
        }
      />

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 bg-white/70 dark:bg-gray-900/40">
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('applications.flow.messages.loadingApplications')}</p>
        ) : visibleCandidaturas.length > 0 ? (
          <div className="space-y-3">
            {visibleCandidaturas.map((candidatura) => {
              const status = toUiStatus(candidatura.estado, t);
              const candidateName = getCandidateName(candidatura);
              const code = candidatura.id;

              return (
                <button
                  key={candidatura.id}
                  type="button"
                  className="w-full text-left rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30 p-5 shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/${candidaturaType.toLowerCase()}/${candidatura.id}`)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('applications.flow.labels.code')}: {code}</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{candidateName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('applications.flow.labels.applicationDate')}: {formatDate(candidatura.criadoEm)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                      {canChangeStatus ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedCandidatura(candidatura);
                          }}
                        >
                          {t('applications.flow.actions.changeStatus')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {currentUserName
              ? t('applications.flow.messages.noResultsForUser', { name: currentUserName })
              : t('applications.flow.messages.noResults')}
          </p>
        )}
      </div>

      {selectedCandidatura ? (
        <CandidaturaStatusChangeDialog
          open={Boolean(selectedCandidatura)}
          candidaturaCode={selectedCandidatura.id}
          currentStatus={selectedCandidatura.estado}
          onOpenChange={(open) => {
            if (!open) setSelectedCandidatura(null);
          }}
          onConfirm={handleChangeStatus}
        />
      ) : null}
    </div>
  );
}
