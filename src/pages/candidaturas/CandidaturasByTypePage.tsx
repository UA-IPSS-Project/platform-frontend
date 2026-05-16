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
import { Plus } from 'lucide-react';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

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

  const [form, setForm] = useState<FormResponse | null>(null);
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createNif, setCreateNif] = useState('');
  const [createNome, setCreateNome] = useState('');
  const [createNifError, setCreateNifError] = useState('');
  const [creating, setCreating] = useState(false);

  const canChangeStatus = mode === 'secretaria' && user?.role === 'SECRETARIA';
  const canCreate = mode === 'secretaria' && form?.status === 'ATIVO';

  useEffect(() => {
    const loadForm = async () => {
      try {
        const data = await candidaturasApi.obterFormularioPorId(candidaturaType);
        setForm(data);
      } catch {
        toast.error(t('applications.flow.messages.loadFormsError'));
      }
    };
    void loadForm();
  }, [candidaturaType]);

  const loadCandidaturas = async () => {
    try {
      setLoading(true);
      const data = await candidaturasApi.listarCandidaturas({
        formId: candidaturaType,
        estado: appliedStatusFilter as CandidaturaEstado || undefined,
        nif: appliedNifFilter || undefined,
        nome: appliedNameFilter || undefined,
        utenteId: mode === 'utente' ? currentUserId : undefined,
      });
      setCandidaturas(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('applications.flow.messages.loadApplicationsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCandidaturas();
  }, [candidaturaType, mode, currentUserId, appliedNameFilter, appliedNifFilter, appliedStatusFilter]);

  const handleOpenCreateDialog = () => {
    setCreateNif('');
    setCreateNome('');
    setCreateNifError('');
    setCreateDialogOpen(true);
  };

  const handleCreateCandidatura = async () => {
    const normalizedNif = createNif.replace(/\D/g, '');
    if (normalizedNif.length !== 9) {
      setCreateNifError('O NIF deve ter exatamente 9 dígitos');
      return;
    }
    if (!createNome.trim()) return;

    try {
      setCreating(true);
      const created = await candidaturasApi.criarCandidatura({
        formId: candidaturaType,
        nif: normalizedNif,
        nome: createNome.trim(),
        respostas: {},
        estado: 'RASCUNHO',
      });
      setCreateDialogOpen(false);
      toast.success('Candidatura criada com sucesso');
      navigate(`/dashboard/${candidaturaType}/${created.id}/fill`);
    } catch {
      toast.error('Erro ao criar candidatura');
    } finally {
      setCreating(false);
    }
  };

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {form ? form.name : <span className="text-muted-foreground italic">{t('applications.flow.messages.loadingApplications')}</span>}
        </h1>
        {canCreate ? (
          <Button
            type="button"
            onClick={handleOpenCreateDialog}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar candidatura
          </Button>
        ) : null}
      </div>

      <CandidaturasFilters
        mode={mode}
        candidaturaType={candidaturaType}
        nameFilter={nameFilter}
        onNameFilterChange={handleNameFilterChange}
        nifFilter={nifFilter}
        onNifFilterChange={handleNifFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onNewCandidatura={
          mode === 'utente' && form?.status === 'ATIVO'
            ? () => navigate(`/dashboard/${candidaturaType}/new`)
            : undefined
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
            {mode === 'utente' && form?.status !== 'ATIVO'
              ? 'Este formulário não está disponível de momento.'
              : currentUserName
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

      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) setCreateDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar candidatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">NIF</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={createNif}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setCreateNif(val);
                  setCreateNifError(val.length > 0 && val.length !== 9 ? 'O NIF deve ter exatamente 9 dígitos' : '');
                }}
                placeholder="123456789"
              />
              {createNifError ? <p className="mt-1 text-xs text-destructive">{createNifError}</p> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
              <Input
                type="text"
                value={createNome}
                onChange={(e) => setCreateNome(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateCandidatura}
              disabled={creating || createNif.length !== 9 || !createNome.trim()}
            >
              {creating ? 'A criar...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CandidaturasCard>
  );
}
