import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { ArrowLeftIcon, UserIcon } from './CustomIcons';
import { utilizadoresApi } from '../services/api';

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

export function ProfilePage({ user, onBack, onUpdateUser, isDarkMode }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
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
        toast.error('Erro ao carregar dados do perfil');
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
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
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

  const renderField = (label: string, value: string, field: string, editable: boolean = true) => (
    <div>
      <Label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">{label}</Label>
      {isEditing ? (
        editable ? (
          <Input
            value={value}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
        ) : (
          <div className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 border border-gray-300 dark:border-gray-600">
            {value}
          </div>
        )
      ) : (
        <div className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          {value}
        </div>
      )}
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
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={onBack}
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
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={loading}
              >
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-700"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'A guardar...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-gray-900 dark:text-gray-100 mb-4">Informação Pessoal</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {renderField('Nome Completo', formData.fullName, 'fullName', false)}
              {renderField('Data de Nascimento', formData.dateOfBirth, 'dateOfBirth', false)}
              {renderField('Morada', formData.address, 'address')}
              {renderField('Freguesia', formData.parish, 'parish')}
              {renderField('Código Postal', formData.postalCode, 'postalCode')}
              {renderField('Telemóvel Pessoal', formData.phonePersonal, 'phonePersonal')}
              {renderField('Email', formData.email, 'email', false)}
              {renderField('NIF', formData.nif, 'nif', false)}
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h2 className="text-gray-900 dark:text-gray-100 mb-4">Informação Profissional</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {renderField('Profissão', formData.profession, 'profession')}
              {renderField('Local de Emprego', formData.workLocation, 'workLocation')}
              {renderField('Morada do Emprego', formData.workAddress, 'workAddress')}
              {renderField('Telefone do Emprego', formData.workPhone, 'workPhone')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
