import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeftIcon, UserIcon } from '../components/shared/CustomIcons';
import { utilizadoresApi } from '../services/api';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { ChangePasswordDialog } from '../components/auth/ChangePasswordDialog';
import { useIsMobile } from '../components/ui/use-mobile';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface ProfilePageProps {
  user: {
    id: number;
    name: string;
    nif: string;
    contact: string;
    email: string;
    birthDate?: string;
  };
  onBack: () => void;
  onUpdateUser: (user: { name: string; nif: string; contact: string; email: string }) => void;
  isDarkMode: boolean;
  isEmployee?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface ProfileFormData {
  fullName: string;
  address: string;
  postalCode: string;
  dateOfBirth: string;
  parish: string;
  phonePersonal: string;
  nif: string;
  email: string;
  profession: string;
  workLocation: string;
  workAddress: string;
  workPhone: string;
}

interface ProfileDraftState {
  isEditing: boolean;
  expanded: {
    personal: boolean;
    address: boolean;
    professional: boolean;
  };
  formData: ProfileFormData;
  baseData: ProfileFormData;
}

// Função para formatar data no formato português
const formatDateToPT = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateString;
  }
};

const createEmptyFormData = (): ProfileFormData => ({
  fullName: '',
  address: '',
  postalCode: '',
  dateOfBirth: '',
  parish: '',
  phonePersonal: '',
  nif: '',
  email: '',
  profession: '',
  workLocation: '',
  workAddress: '',
  workPhone: '',
});

const mapApiUserToFormData = (data: {
  nome: string;
  morada?: string;
  codigoPostal?: string;
  dataNascimento?: string;
  freguesia?: string;
  telefone?: string;
  nif: string;
  email: string;
  profissao?: string;
  localEmprego?: string;
  moradaEmprego?: string;
  telefoneEmprego?: string;
}): ProfileFormData => ({
  fullName: data.nome,
  address: data.morada || '',
  postalCode: data.codigoPostal || '',
  dateOfBirth: formatDateToPT(data.dataNascimento),
  parish: data.freguesia || '',
  phonePersonal: data.telefone || '',
  nif: data.nif,
  email: data.email,
  profession: data.profissao || '',
  workLocation: data.localEmprego || '',
  workAddress: data.moradaEmprego || '',
  workPhone: data.telefoneEmprego || '',
});

export const getProfileDraftStorageKey = (userId: number) => `profile-page-draft:${userId}`;

const mergeDraftWithLatestData = (draft: ProfileDraftState, latestData: ProfileFormData): ProfileFormData => {
  const merged = { ...latestData };

  (Object.keys(latestData) as Array<keyof ProfileFormData>).forEach((key) => {
    if (draft.formData[key] !== draft.baseData[key]) {
      merged[key] = draft.formData[key];
    }
  });

  return merged;
};

export function ProfilePage({ user, onBack, onUpdateUser, isDarkMode, isEmployee = false, onDirtyChange }: ProfilePageProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [expanded, setExpanded] = useState({
    personal: true,
    address: false,
    professional: false
  });

  const [formData, setFormData] = useState<ProfileFormData>(createEmptyFormData());
  const [baseData, setBaseData] = useState<ProfileFormData>(createEmptyFormData());
  const storageKey = getProfileDraftStorageKey(user.id);

  const loadUserData = useCallback(async (options?: { restoreDraft?: boolean }) => {
    const shouldRestoreDraft = options?.restoreDraft ?? true;
    setLoading(true);
    try {
      const data = await utilizadoresApi.obterPorId(user.id);
      const mappedData = mapApiUserToFormData(data);
      const savedDraftRaw = sessionStorage.getItem(storageKey);

      if (shouldRestoreDraft && savedDraftRaw) {
        try {
          const savedDraft = JSON.parse(savedDraftRaw) as ProfileDraftState;
          setExpanded(savedDraft.expanded);

          if (savedDraft.isEditing) {
            setIsEditing(true);
            setFormData(mergeDraftWithLatestData(savedDraft, mappedData));
            setBaseData(savedDraft.baseData);
          } else {
            setIsEditing(false);
            setFormData(mappedData);
            setBaseData(mappedData);
          }
        } catch {
          setFormData(mappedData);
          setBaseData(mappedData);
        }
      } else {
        setFormData(mappedData);
        setBaseData(mappedData);
      }

      return data;
    } catch (error) {
      console.error('Erro ao carregar dados do utilizador:', error);
      toast.error(t('profile.errors.loadProfile'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [storageKey, user.id]);

  // Carregar dados do utilizador da API
  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const draftState: ProfileDraftState = {
      isEditing,
      expanded,
      formData,
      baseData: createEmptyFormData(),
    };

    const savedDraftRaw = sessionStorage.getItem(storageKey);
    if (savedDraftRaw) {
      try {
        const savedDraft = JSON.parse(savedDraftRaw) as ProfileDraftState;
        draftState.baseData = savedDraft.baseData;
      } catch {
        draftState.baseData = formData;
      }
    } else {
      draftState.baseData = formData;
    }

    if (!isEditing) {
      draftState.baseData = formData;
    }

    sessionStorage.setItem(storageKey, JSON.stringify(draftState));
  }, [expanded, formData, isEditing, loading, storageKey]);

  const handleSave = async () => {
    try {
      setLoading(true);
      // Apenas enviar campos editáveis (não enviar nome, email, nif, dataNascimento)
      await utilizadoresApi.atualizar(user.id, {
        telefone: formData.phonePersonal,
        morada: formData.address,
        codigoPostal: formData.postalCode,
        freguesia: formData.parish,
        profissao: formData.profession,
        localEmprego: formData.workLocation,
        moradaEmprego: formData.workAddress,
        telefoneEmprego: formData.workPhone,
      });

      // Recarregar dados da API após salvar
      const dadosAtualizados = await loadUserData();

      if (!dadosAtualizados) {
        return;
      }

      onUpdateUser({
        name: dadosAtualizados.nome,
        nif: dadosAtualizados.nif,
        contact: dadosAtualizados.telefone || '',
        email: dadosAtualizados.email,
      });

      setIsEditing(false);
      sessionStorage.removeItem(storageKey);
      toast.success(t('profile.messages.updatedSuccess'));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(t('profile.errors.updateProfile'));
    } finally {
      setLoading(false);
    }
  };

  const resetDraftAndExitEditMode = useCallback(async () => {
    sessionStorage.removeItem(storageKey);
    await loadUserData({ restoreDraft: false });
    setIsEditing(false);
  }, [loadUserData, storageKey]);

  // Computed: whether the user has unsaved changes
  const hasUnsavedChanges = isEditing && JSON.stringify(formData) !== JSON.stringify(baseData);

  // Notify parent when dirty state changes
  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Guard: show dialog before leaving if there are unsaved changes
  const requestLeave = (action?: () => void) => {
    if (hasUnsavedChanges) {
      pendingActionRef.current = action ?? null;
      setShowUnsavedDialog(true);
    } else {
      action?.();
    }
  };

  const confirmDiscard = async () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    await resetDraftAndExitEditMode();

    setShowUnsavedDialog(false);
    action?.();
  };

  const cancelDiscard = () => {
    pendingActionRef.current = null;
    setShowUnsavedDialog(false);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      requestLeave();
      return;
    }

    // No changes: just leave edit mode immediately.
    setIsEditing(false);
    sessionStorage.removeItem(storageKey);
  };

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderField = (label: string, value: string, field: string, editable: boolean = true, placeholder: string = '', colSpan: string = '') => (
    <div className={colSpan}>
      <Label className="text-sm text-foreground mb-1 block">{label}</Label>
      {isEditing ? (
        editable ? (
          <Input
            value={value}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={placeholder}
            className="bg-background border border-border text-foreground placeholder:text-muted-foreground"
          />
        ) : (
          <div className="px-3 py-2 rounded bg-muted text-muted-foreground border border-border cursor-not-allowed select-none">
            {value || <span className="text-muted-foreground italic">{placeholder}</span>}
          </div>
        )
      ) : (
        <div className="px-3 py-2 rounded bg-muted/60 text-foreground border border-transparent">
          {value || <span className="text-muted-foreground italic">{placeholder}</span>}
        </div>
      )}
    </div>
  );

  const renderSectionHeader = (title: string, sectionKey: keyof typeof expanded) => (
    <div
      className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-accent/60 p-2 rounded-lg transition-colors -ml-2"
      onClick={() => toggleSection(sectionKey)}
    >
      {expanded[sectionKey] ? (
        <ChevronDown className="w-5 h-5 text-primary" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
      <h2 className="text-foreground font-medium text-lg">{title}</h2>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-muted-foreground">{t('profile.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-10">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => requestLeave(onBack)}
          className="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>

        {/* Profile Card */}
        <div className="bg-card rounded-lg shadow-lg p-5 sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl text-foreground">{t('profile.title')}</h1>
                <p className="text-sm text-primary">{formData.email}</p>
              </div>
            </div>
            {!isEditing && (
              <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-center border-border text-foreground hover:bg-accent"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isMobile ? t('profile.passwordShort') : t('profile.changePassword')}
                </Button>
                <Button
                  onClick={() => { setBaseData({ ...formData }); setIsEditing(true); }}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={loading}
                >
                  {t('common.edit')}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-12">
            {/* Personal Information */}
            <div>
              {renderSectionHeader(t('profile.sections.personal'), 'personal')}

              {expanded.personal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pl-2">
                  {renderField(t('profile.fullName'), formData.fullName, 'fullName', false, t('profile.placeholders.nameUnavailable'), 'md:col-span-2')}
                  {renderField('NIF', formData.nif, 'nif', false)}
                  {renderField(t('profile.birthDate'), formData.dateOfBirth, 'dateOfBirth', false)}
                  {renderField('Email', formData.email, 'email', false, t('profile.placeholders.emailUnavailable'), 'md:col-span-2')}
                  {renderField(t('profile.phone'), formData.phonePersonal, 'phonePersonal', true, t('profile.placeholders.addContact'))}
                </div>
              )}
            </div>

            {/* Address Information (New Subdivision) */}
            <div>
              {renderSectionHeader(t('profile.sections.address'), 'address')}

              {expanded.address && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pl-2">
                  {renderField(t('profile.address'), formData.address, 'address', true, t('profile.placeholders.addAddress'), 'md:col-span-2')}
                  {renderField(t('profile.parish'), formData.parish, 'parish', true, t('profile.placeholders.addParish'))}
                  {renderField(t('profile.postalCode'), formData.postalCode, 'postalCode', true, t('profile.placeholders.addPostalCode'))}
                </div>
              )}
            </div>

            {/* Professional Information - Hidden for employees */}
            {!isEmployee && (
              <div>
                {renderSectionHeader(t('profile.sections.professional'), 'professional')}

                {expanded.professional && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pl-2">
                    {renderField(t('profile.profession'), formData.profession, 'profession', true, t('profile.placeholders.addProfession'))}
                    {renderField(t('profile.workLocation'), formData.workLocation, 'workLocation', true, t('profile.placeholders.addWorkLocation'))}
                    {renderField(t('profile.workAddress'), formData.workAddress, 'workAddress', true, t('profile.placeholders.addWorkAddress'))}
                    {renderField(t('profile.workPhone'), formData.workPhone, 'workPhone', true, t('profile.placeholders.addWorkPhone'))}
                  </div>
                )}
              </div>
            )}

            {isEditing && (
              <div className={`flex gap-2 pt-4 border-t border-border ${isMobile ? 'flex-col' : 'justify-end'}`}>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className={`border-border ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  {t('appointmentDialog.actions.cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  className={`bg-primary hover:bg-primary/90 text-primary-foreground ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  {loading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />

      <AlertDialog open={showUnsavedDialog} onOpenChange={(open) => { if (!open) cancelDiscard(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.unsaved.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.unsaved.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDiscard}>{t('profile.unsaved.stay')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {t('profile.unsaved.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
