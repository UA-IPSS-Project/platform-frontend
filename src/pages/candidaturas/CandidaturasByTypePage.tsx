import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { CandidaturaStatusChangeDialog } from '../../components/candidaturas/CandidaturaStatusChangeDialog';
import { CandidaturasFilters } from '../../components/candidaturas/CandidaturasFilters';
import { CandidaturasCard } from '../../components/candidaturas/CandidaturasCard';
import { CandidaturasStatusBadge } from '../../components/candidaturas/CandidaturasStatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { getMockCandidaturasForType, getMockFormularioForType, updateMockCandidatura } from './candidaturaMockData';
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
    };
  }

  if (status === 'REJEITADA') {
    return {
      label: t('applications.flow.status.rejected'),
    };
  }

  return {
    label: t('applications.flow.status.pending'),
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

const isWithinDayRange = (value: string | undefined, day: string): boolean => {
  if (!value) return false;

  const range = toDayRange(day);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return date >= new Date(range.dataInicio) && date <= new Date(range.dataFim);
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
      const mockForm = getMockFormularioForType(normalizedType);
      setForms(mockForm ? [mockForm] : []);
      setSelectedFormId(mockForm?.id || '');

      // API lookup kept here for reference only while the candidaturas area uses local mocks.
      // const data = await candidaturasApi.listarFormularios(normalizedType);
      // setForms(Array.isArray(data) ? data : []);
      // setSelectedFormId(data[0]?.id || '');
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

      const mockData = getMockCandidaturasForType(normalizedType, mode === 'utente' ? currentUserId : undefined);
      let nextCandidaturas = mockData.filter((item) => item.formId === selectedFormId);

      if (mode === 'secretaria' && appliedStatusFilter) {
        nextCandidaturas = nextCandidaturas.filter((item) => item.estado === appliedStatusFilter);
      }

      if (mode === 'secretaria' && appliedDateFilter) {
        nextCandidaturas = nextCandidaturas.filter((item) => isWithinDayRange(item.criadoEm, appliedDateFilter));
      }

      // API search kept here for reference only while the candidaturas area uses local mocks.
      // const data = await candidaturasApi.listarCandidaturas({
      //   formId: selectedFormId,
      //   estado: appliedStatusFilter as CandidaturaEstado,
      //   dataInicio: appliedDateFilter ? toDayRange(appliedDateFilter).dataInicio : undefined,
      //   dataFim: appliedDateFilter ? toDayRange(appliedDateFilter).dataFim : undefined,
      //   criadoPor: mode === 'utente' ? currentUserId : undefined,
      // });
      // setCandidaturas(Array.isArray(data) ? data : []);

      setCandidaturas(nextCandidaturas);
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
      if (mode === 'secretaria') {
        // API update kept here for reference only while the candidaturas area uses local mocks.
        // await candidaturasApi.atualizarEstado(selectedCandidatura.id, { estado: newStatus });
        const updated = updateMockCandidatura(selectedCandidatura.id, { estado: newStatus });
        if (!updated) {
          throw new Error('Candidatura mock não encontrada');
        }
      } else {
        await candidaturasApi.atualizarEstado(selectedCandidatura.id, { estado: newStatus });
      }
      toast.success(t('applications.flow.messages.statusUpdatedSuccess'));
      setSelectedCandidatura(null);
      await loadCandidaturas();
    } catch (error: any) {
      toast.error(error?.message || t('applications.flow.messages.statusUpdateError'));
    }
  };

  return (
    <CandidaturasCard className="mx-auto mt-4 max-w-6xl p-6 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t('applications.flow.labels.titleByType', { type: normalizedType })}</h1>
        {forms.length > 1 ? (
          <select
            value={selectedFormId}
            onChange={(event) => setSelectedFormId(event.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
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

      <div className="border border-border rounded-xl p-4 sm:p-5 bg-muted/30">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('applications.flow.messages.loadingApplications')}</p>
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
                  className="w-full text-left rounded-xl border border-border bg-background p-5 shadow-sm hover:bg-accent/40 hover:shadow-md transition-all"
                  onClick={() => navigate(`/dashboard/${candidaturaType.toLowerCase()}/${candidatura.id}`)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t('applications.flow.labels.code')}: {code}</p>
                      <p className="font-medium text-foreground">{candidateName}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('applications.flow.labels.applicationDate')}: {formatDate(candidatura.criadoEm)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <CandidaturasStatusBadge status={candidatura.estado} label={status.label} />
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
          <p className="text-sm text-muted-foreground">
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
    </CandidaturasCard>
  );
}
