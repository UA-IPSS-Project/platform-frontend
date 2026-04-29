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

const getDisplayStatus = (candidatura: CandidaturaResponse): CandidaturaEstado | 'LISTA_DE_ESPERA' => {
  return getCatlStatus(candidatura) ?? candidatura.estado;
};

const toUiStatus = (candidatura: CandidaturaResponse, t: (key: string) => string) => {
  const status = getDisplayStatus(candidatura);

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

  if (status === 'LISTA_DE_ESPERA') {
    return {
      label: 'Lista de espera',
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

const getRespostaString = (candidatura: CandidaturaResponse, key: string): string | undefined => {
  const value = candidatura.respostas?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const getBirthDate = (candidatura: CandidaturaResponse): string | undefined =>
  getRespostaString(candidatura, 'birthDate');

const getAgeFromBirthDate = (birthDate?: string): number | null => {
  if (!birthDate) return null;

  const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedBirthDate.getTime())) return null;

  const today = new Date();
  let age = today.getUTCFullYear() - parsedBirthDate.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - parsedBirthDate.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < parsedBirthDate.getUTCDate())) {
    age -= 1;
  }

  return age;
};

const getSignatureState = (candidatura: CandidaturaResponse): 'COM_ASSINATURA' | 'SEM_ASSINATURA' | null => {
  const directSignature = candidatura.respostas?.assinatura;
  if (typeof directSignature === 'string') {
    const normalized = directSignature.trim().toLowerCase();
    if (['com assinatura', 'assinado', 'signed', 'yes', 'sim'].includes(normalized)) {
      return 'COM_ASSINATURA';
    }
    if (['sem assinatura', 'não assinado', 'nao assinado', 'unsigned', 'no', 'nao'].includes(normalized)) {
      return 'SEM_ASSINATURA';
    }
  }

  const agreeToTerms = candidatura.respostas?.agreeToTerms;
  if (typeof agreeToTerms === 'boolean') {
    return agreeToTerms ? 'COM_ASSINATURA' : 'SEM_ASSINATURA';
  }

  return null;
};

const getGenderFromResposta = (candidatura: CandidaturaResponse): 'F' | 'M' | null => {
  const explicit = getRespostaString(candidatura, 'gender') ?? getRespostaString(candidatura, 'sexo') ?? getRespostaString(candidatura, 'sex');
  if (!explicit) return null;
  const n = explicit.trim().toLowerCase();
  if (n.startsWith('f') || n.includes('mulher') || n.includes('feminino')) return 'F';
  if (n.startsWith('m') || n.includes('homem') || n.includes('masculino')) return 'M';
  return null;
};



const getCatlStatus = (candidatura: CandidaturaResponse): 'PENDENTE' | 'LISTA_DE_ESPERA' | 'APROVADA' | 'REJEITADA' | null => {
  const explicitStatus = getRespostaString(candidatura, 'estado') ?? getRespostaString(candidatura, 'status');
  if (!explicitStatus) return null;

  const normalized = explicitStatus.trim().toUpperCase();
  if (normalized === 'PENDENTE' || normalized === 'APROVADA' || normalized === 'REJEITADA' || normalized === 'LISTA_DE_ESPERA') {
    return normalized;
  }

  return null;
};

const sortCandidaturasByDate = (
  candidaturasList: CandidaturaResponse[],
  direction: 'dataAsc' | 'dataDesc',
): CandidaturaResponse[] => {
  const factor = direction === 'dataAsc' ? 1 : -1;

  return [...candidaturasList].sort((left, right) => {
    const leftDate = left.criadoEm ? new Date(left.criadoEm).getTime() : 0;
    const rightDate = right.criadoEm ? new Date(right.criadoEm).getTime() : 0;

    return (leftDate - rightDate) * factor;
  });
};

const sanitizeNameFilter = (value: string): string => {
  return value
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();
};

const sanitizeNifFilter = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

const sanitizeAgeFilter = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const parsed = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed) || parsed < 0) return '';

  return String(parsed);
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
  const [nifFilter, setNifFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [signatureFilter, setSignatureFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('criterios');
  const [appliedNameFilter, setAppliedNameFilter] = useState('');
  const [appliedNifFilter, setAppliedNifFilter] = useState('');
  const [appliedGenderFilter, setAppliedGenderFilter] = useState('');
  const [appliedAgeFilter, setAppliedAgeFilter] = useState('');
  const [appliedSignatureFilter, setAppliedSignatureFilter] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedDateFilter, setAppliedDateFilter] = useState('');
  const [appliedSortFilter, setAppliedSortFilter] = useState('criterios');
  const [nifError, setNifError] = useState('');

  const [selectedCandidatura, setSelectedCandidatura] = useState<CandidaturaResponse | null>(null);

  const normalizedType = candidaturaType.trim().toUpperCase();
  const isCatl = normalizedType === 'CATL';
  const isFilteredType = normalizedType === 'CATL' || normalizedType === 'CRECHE' || normalizedType === 'ERPI';
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
        nextCandidaturas = nextCandidaturas.filter((item) => {
          if (appliedStatusFilter === 'LISTA_DE_ESPERA') {
            return getCatlStatus(item) === 'LISTA_DE_ESPERA';
          }

          return item.estado === appliedStatusFilter;
        });
      }

      if (mode === 'secretaria' && appliedDateFilter) {
        nextCandidaturas = nextCandidaturas.filter((item) => isWithinDayRange(item.criadoEm, appliedDateFilter));
      }

      if (isFilteredType && appliedNifFilter) {
        const normalizedNif = appliedNifFilter.replace(/\D/g, '');
        nextCandidaturas = nextCandidaturas.filter((item) => {
          const nif = getRespostaString(item, 'guardianNif');
          return typeof nif === 'string' && nif.replace(/\D/g, '').includes(normalizedNif);
        });
      }

      if (isFilteredType && appliedAgeFilter && normalizedType !== 'ERPI') {
        const targetAge = Number.parseInt(appliedAgeFilter, 10);
        if (!Number.isNaN(targetAge)) {
          nextCandidaturas = nextCandidaturas.filter((item) => getAgeFromBirthDate(getBirthDate(item)) === targetAge);
        }
      }

      if (isFilteredType && appliedSignatureFilter) {
        nextCandidaturas = nextCandidaturas.filter((item) => getSignatureState(item) === appliedSignatureFilter);
      }

      const isErpi = normalizedType === 'ERPI';
      if (isErpi && appliedGenderFilter) {
        nextCandidaturas = nextCandidaturas.filter((item) => getGenderFromResposta(item) === appliedGenderFilter);
      }

      

      if (isFilteredType && appliedSortFilter === 'dataAsc') {
        nextCandidaturas = sortCandidaturasByDate(nextCandidaturas, 'dataAsc');
      }

      if (isFilteredType && appliedSortFilter === 'dataDesc') {
        nextCandidaturas = sortCandidaturasByDate(nextCandidaturas, 'dataDesc');
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
  }, [selectedFormId, mode, currentUserId, appliedNameFilter, appliedNifFilter, appliedAgeFilter, appliedSignatureFilter, appliedStatusFilter, appliedDateFilter, appliedSortFilter, appliedGenderFilter, isCatl]);

  const visibleCandidaturas = useMemo(() => {
    const normalizedName = appliedNameFilter.trim().toLowerCase();
    if (!normalizedName) return candidaturas;

    return candidaturas.filter((item) => getCandidateName(item).toLowerCase().includes(normalizedName));
  }, [candidaturas, appliedNameFilter]);

  const handleApplyFilters = () => {
    const normalizedNif = nifFilter.replace(/\D/g, '');
    if (nifFilter && normalizedNif.length !== 9) {
      setNifError('O NIF deve ter exatamente 9 dígitos');
      return;
    }

    setNifError('');
    setAppliedNameFilter(nameFilter);
    setAppliedNifFilter(nifFilter);
    setAppliedGenderFilter(genderFilter);
    setAppliedAgeFilter(ageFilter);
    setAppliedSignatureFilter(signatureFilter);
    setAppliedStatusFilter(statusFilter);
    setAppliedDateFilter(dateFilter);
    setAppliedSortFilter(sortFilter);
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setNifFilter('');
    setGenderFilter('');
    setAgeFilter('');
    setSignatureFilter('');
    setStatusFilter('');
    setDateFilter('');
    setSortFilter('criterios');
    setAppliedNameFilter('');
    setAppliedNifFilter('');
    setAppliedGenderFilter('');
    setAppliedAgeFilter('');
    setAppliedSignatureFilter('');
    setAppliedStatusFilter('');
    setAppliedDateFilter('');
    setAppliedSortFilter('criterios');
  };

  const handleNameFilterChange = (value: string) => {
    setNameFilter(sanitizeNameFilter(value));
  };

  const handleNifFilterChange = (value: string) => {
    const cleaned = sanitizeNifFilter(value);
    setNifFilter(cleaned);
    if (cleaned && cleaned.length !== 9) {
      setNifError('O NIF deve ter exatamente 9 dígitos');
    } else {
      setNifError('');
    }
  };

  const handleAgeFilterChange = (value: string) => {
    setAgeFilter(sanitizeAgeFilter(value));
  };

  const handleGenderFilterChange = (value: string) => {
    setGenderFilter(value);
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
        isCatl={isCatl}
        candidaturaType={normalizedType}
        nameFilter={nameFilter}
        onNameFilterChange={handleNameFilterChange}
        nifFilter={nifFilter}
        onNifFilterChange={handleNifFilterChange}
        genderFilter={genderFilter}
        onGenderFilterChange={handleGenderFilterChange}
        ageFilter={ageFilter}
        onAgeFilterChange={handleAgeFilterChange}
        signatureFilter={signatureFilter}
        onSignatureFilterChange={setSignatureFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        sortFilter={sortFilter}
        onSortFilterChange={setSortFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onNewCandidatura={
          mode === 'utente' ? () => navigate(`/dashboard/${candidaturaType.toLowerCase()}/new`) : undefined
        }
        disableApply={Boolean(nifError)}
      />

      <div className="border border-border rounded-xl p-4 sm:p-5 bg-muted/30">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('applications.flow.messages.loadingApplications')}</p>
        ) : visibleCandidaturas.length > 0 ? (
          <div className="space-y-3">
            {visibleCandidaturas.map((candidatura) => {
              const status = toUiStatus(candidatura, t);
              const candidateName = getCandidateName(candidatura);
              const code = candidatura.id;
              const signatureState = getSignatureState(candidatura);
              const signatureLabel = signatureState === 'COM_ASSINATURA' ? 'Com assinatura' : signatureState === 'SEM_ASSINATURA' ? 'Sem assinatura' : '-';

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
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${signatureState === 'SEM_ASSINATURA' ? 'border border-status-rose-3 bg-status-rose-soft text-status-rose-foreground' : 'border border-border/50 bg-muted/60 text-foreground'}`}>
                        {signatureLabel}
                      </span>
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
