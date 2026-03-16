import { useState, useEffect } from 'react';
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

export function ProfilePage({ user, onBack, onUpdateUser, isDarkMode, isEmployee = false }: ProfilePageProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [expanded, setExpanded] = useState({
    personal: true,
    address: true, // User wanted to "hide fields", maybe default false? Keeping true for better UX unless specified "start hidden".
    professional: true
  });

  const [formData, setFormData] = useState({
    fullName: user.name,
    address: 'Rua das Flores, 123',
    postalCode: '1000-001',
    dateOfBirth: user?.birthDate || '15/01/1990',
    parish: 'São Pedro',
    phonePersonal: user.contact,
    nif: user.nif,
    email: user.email,
    profession: 'Engenheiro',
    workLocation: 'Tech Company',
    workAddress: 'Av. Principal, 456',
    workPhone: '217654321',
  });

  // Carregar dados do utilizador da API
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const data = await utilizadoresApi.obterPorId(user.id);
        setFormData({
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
      } catch (error) {
        console.error('Erro ao carregar dados do utilizador:', error);
        toast.error(t('profile.errors.loadProfile'));
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user.id]);

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
      const dadosAtualizados = await utilizadoresApi.obterPorId(user.id);
      setFormData({
        fullName: dadosAtualizados.nome,
        address: dadosAtualizados.morada || '',
        postalCode: dadosAtualizados.codigoPostal || '',
        dateOfBirth: formatDateToPT(dadosAtualizados.dataNascimento),
        parish: dadosAtualizados.freguesia || '',
        phonePersonal: dadosAtualizados.telefone || '',
        nif: dadosAtualizados.nif,
        email: dadosAtualizados.email,
        profession: dadosAtualizados.profissao || '',
        workLocation: dadosAtualizados.localEmprego || '',
        workAddress: dadosAtualizados.moradaEmprego || '',
        workPhone: dadosAtualizados.telefoneEmprego || '',
      });

      onUpdateUser({
        name: dadosAtualizados.nome,
        nif: dadosAtualizados.nif,
        contact: dadosAtualizados.telefone,
        email: dadosAtualizados.email,
      });

      setIsEditing(false);
      toast.success(t('profile.messages.updatedSuccess'));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(t('profile.errors.updateProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.name,
      address: 'Rua das Flores, 123',
      postalCode: '1000-001',
      dateOfBirth: user?.birthDate || '15/01/1990',
      parish: 'São Pedro',
      phonePersonal: user.contact,
      nif: user.nif,
      email: user.email,
      profession: 'Engenheiro',
      workLocation: 'Tech Company',
      workAddress: 'Av. Principal, 456',
      workPhone: '217654321',
    });
    setIsEditing(false);
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
        <div className="text-gray-600 dark:text-gray-400">{t('profile.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-10">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t('common.back')}</span>
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
            {!isEditing ? (
              <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
                <Button
                  variant="outline"
                  className={`border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${isMobile ? 'w-full justify-center' : ''}`}
                  onClick={() => setShowPasswordDialog(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isMobile ? t('profile.passwordShort') : t('profile.changePassword')}
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className={`bg-purple-600 hover:bg-purple-700 text-white ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  {t('common.edit')}
                </Button>
              </div>
            ) : (
              <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className={`border-gray-300 dark:border-gray-700 ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  {t('appointmentDialog.actions.cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  className={`bg-purple-600 hover:bg-purple-700 text-white ${isMobile ? 'w-full' : ''}`}
                  disabled={loading}
                >
                  {loading ? t('common.saving') : t('common.save')}
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
                  {renderField(t('auth.fullName'), formData.fullName, 'fullName', false, t('profile.placeholders.nameUnavailable'), 'md:col-span-2')}
                  {renderField(t('auth.nif'), formData.nif, 'nif', false)}
                  {renderField(t('appointmentDialog.fields.birthDate'), formData.dateOfBirth, 'dateOfBirth', false)}
                  {renderField(t('appointmentDialog.fields.email'), formData.email, 'email', false, t('profile.placeholders.emailUnavailable'), 'md:col-span-2')}
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
          </div>
        </div>
      </div>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </div>
  );
}
