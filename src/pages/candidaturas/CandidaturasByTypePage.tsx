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
import {
  candidaturasApi,
  type CandidaturaEstado,
  type CandidaturaResponse,
  type FormResponse,
} from '../../services/api';

interface CandidaturasByTypePageProps {
  mode: 'secretaria' | 'utente';
  candidaturaType: string;
  currentUserName?: string;
  currentUserId?: number;
}

const getCandidateName = (candidatura: CandidaturaResponse): string => {
  if (candidatura.nome?.trim()) return candidatura.nome;
  const childName = candidatura.respostas?.childName;
  if (typeof childName === 'string' && childName.trim()) return childName;
  return 'Sem nome';
};

const getDisplayStatus = (candidatura: CandidaturaResponse): CandidaturaEstado => {
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

  if (status === 'LISTA_ESPERA') {
    return {
      label: t('applications.flow.status.waiting_list'),
    };
  }

  if (status === 'RASCUNHO') {
    return {
      label: t('applications.flow.status.draft'),
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




const getRespostaString = (candidatura: CandidaturaResponse, key: string): string | undefined => {
  const value = candidatura.respostas?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const getCatlStatus = (candidatura: CandidaturaResponse): CandidaturaEstado | null => {
  const explicitStatus = getRespostaString(candidatura, 'estado') ?? getRespostaString(candidatura, 'status');
  if (!explicitStatus) return null;

  const normalized = explicitStatus.trim().toUpperCase();
  if (normalized === 'PENDENTE' || normalized === 'APROVADA' || normalized === 'REJEITADA' || normalized === 'LISTA_ESPERA') {
    return normalized as CandidaturaEstado;
  }

  return null;
};

const getSignatureState = (candidatura: CandidaturaResponse): 'COM_ASSINATURA' | 'SEM_ASSINATURA' | null => {
  if (typeof candidatura.assinado === 'boolean') {
    return candidatura.assinado ? 'COM_ASSINATURA' : 'SEM_ASSINATURA';
  }

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

const sanitizeNameFilter = (value: string): string => {
  return value
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();
};

const sanitizeNifFilter = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
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

  const [forms, setForms] = useState<FormResponse[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [candidaturas, setCandidaturas] = useState<CandidaturaResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [nameFilter, setNameFilter] = useState('');
  const [nifFilter, setNifFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appliedNameFilter, setAppliedNameFilter] = useState('');
  const [appliedNifFilter, setAppliedNifFilter] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [nifError, setNifError] = useState('');

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

      const data = await candidaturasApi.listarCandidaturas({
        estado: appliedStatusFilter as CandidaturaEstado,
        nif: appliedNifFilter,
        nome: appliedNameFilter,
      });
      setCandidaturas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(t('applications.flow.messages.loadApplicationsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidaturas();
  }, [selectedFormId, mode, currentUserId, appliedNameFilter, appliedNifFilter, appliedStatusFilter]);

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
    setAppliedStatusFilter(statusFilter);
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setNifFilter('');
    setStatusFilter('');
    setAppliedNameFilter('');
    setAppliedNifFilter('');
    setAppliedStatusFilter('');
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
        ) : forms.length === 0 ? (
          <span className="text-sm text-muted-foreground font-normal italic">({t('applications.flow.messages.unavailableForms')})</span>
        ) : null}
      </div>

      <CandidaturasFilters
        mode={mode}
        candidaturaType={normalizedType}
        nameFilter={nameFilter}
        onNameFilterChange={handleNameFilterChange}
        nifFilter={nifFilter}
        onNifFilterChange={handleNifFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
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
