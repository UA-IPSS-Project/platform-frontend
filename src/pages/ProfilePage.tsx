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
      toast.error('Erro ao carregar dados do perfil');
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
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    sessionStorage.removeItem(storageKey);
    await loadUserData({ restoreDraft: false });
    setIsEditing(false);
  };

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
  const requestLeave = (action: () => void) => {
    if (hasUnsavedChanges) {
      pendingActionRef.current = action;
      setShowUnsavedDialog(true);
    } else {
      action();
    }
  };

  const confirmDiscard = () => {
    setShowUnsavedDialog(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  const cancelDiscard = () => {
    pendingActionRef.current = null;
    setShowUnsavedDialog(false);
  };

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderField = (label: string, value: string, field: string, editable: boolean = true, placeholder: string = '', colSpan: string = '') => (
    <div className={colSpan}>
      <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">{label}</Label>
      {isEditing ? (
        editable ? (
          <Input
            value={value}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={placeholder}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        ) : (
          <div className="px-3 py-2 rounded bg-gray-300 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 cursor-not-allowed select-none">
            {value || <span className="text-gray-400 italic">{placeholder}</span>}
          </div>
        )
      ) : (
        <div className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-transparent">
          {value || <span className="text-gray-400 italic">{placeholder}</span>}
        </div>
      )}
    </div>
  );

  const renderSectionHeader = (title: string, sectionKey: keyof typeof expanded) => (
    <div
      className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors -ml-2"
      onClick={() => toggleSection(sectionKey)}
    >
      {expanded[sectionKey] ? (
        <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-500" />
      )}
      <h2 className="text-gray-900 dark:text-gray-100 font-medium text-lg">{title}</h2>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="text-gray-600 dark:text-gray-400">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-10">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => requestLeave(onBack)}
          className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl text-gray-900 dark:text-gray-100">Perfil do Utilizador</h1>
                <p className="text-sm text-purple-600 dark:text-purple-400">{formData.email}</p>
              </div>
            </div>
            {!isEditing && (
              <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
                <Button
                  variant="outline"
                  className={`border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${isMobile ? 'w-full justify-center' : ''}`}
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isMobile ? 'Palavra-passe' : 'Mudar Palavra-passe'}
                </Button>
                <Button
                  onClick={() => { setBaseData({ ...formData }); setIsEditing(true); }}
                  className={`bg-purple-600 hover:bg-purple-700 text-white ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  Editar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-12">
            {/* Personal Information */}
            <div>
              {renderSectionHeader('Informação Pessoal', 'personal')}

              {expanded.personal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pl-2">
                  {renderField('Nome Completo', formData.fullName, 'fullName', false, 'Nome indisponível', 'md:col-span-2')}
                  {renderField('NIF', formData.nif, 'nif', false)}
                  {renderField('Data de Nascimento', formData.dateOfBirth, 'dateOfBirth', false)}
                  {renderField('Email', formData.email, 'email', false, 'Email indisponível', 'md:col-span-2')}
                  {renderField('Telemóvel', formData.phonePersonal, 'phonePersonal', true, 'Adicione contacto')}
                </div>
              )}
            </div>

            {/* Address Information (New Subdivision) */}
            <div>
              {renderSectionHeader('Morada', 'address')}

              {expanded.address && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pl-2">
                  {renderField('Morada', formData.address, 'address', true, 'Adicione morada', 'md:col-span-2')}
                  {renderField('Freguesia', formData.parish, 'parish', true, 'Adicione freguesia')}
                  {renderField('Código Postal', formData.postalCode, 'postalCode', true, 'Adicione código postal')}
                </div>
              )}
            </div>

            {/* Professional Information - Hidden for employees */}
            {!isEmployee && (
              <div>
                {renderSectionHeader('Informação Profissional', 'professional')}

                {expanded.professional && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pl-2">
                    {renderField('Profissão', formData.profession, 'profession', true, 'Adicione profissão')}
                    {renderField('Local de Emprego', formData.workLocation, 'workLocation', true, 'Adicione local de emprego')}
                    {renderField('Freguesia de Emprego', formData.workAddress, 'workAddress', true, 'Adicione freguesia de emprego')}
                    {renderField('Telefone do Emprego', formData.workPhone, 'workPhone', true, 'Adicione telefone do emprego')}
                  </div>
                )}
              </div>
            )}

            {isEditing && (
              <div className={`flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                <Button
                  onClick={() => requestLeave(handleCancel)}
                  variant="outline"
                  className={`border-gray-300 dark:border-gray-700 ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className={`bg-purple-600 hover:bg-purple-700 text-white ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'A guardar...' : 'Guardar'}
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
            <AlertDialogTitle>Alterações por guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem mudanças por guardar. Deseja descartá-las?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDiscard}>Ficar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
