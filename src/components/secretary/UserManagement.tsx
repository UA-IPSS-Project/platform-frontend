import { useState, useEffect } from 'react';
import { utilizadoresApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Search, UserPlus, Send, Eraser, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface UserManagementProps {
    isDarkMode: boolean;
}

export function UserManagement({ isDarkMode }: UserManagementProps) {
    const [formData, setFormData] = useState({
        nif: '',
        name: '',
        contact: '',
        isEmployee: false,
        role: '',
        email: ''
    });

    const [users, setUsers] = useState<any[]>([]); // Use appropriate type if possible
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await utilizadoresApi.listarFuncionarios();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            // toast.error("Erro ao carregar utilizadores");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await utilizadoresApi.aprovarFuncionario(id);
            toast.success("Funcionário aprovado com sucesso!");
            fetchUsers(); // Refresh list
        } catch (error) {
            toast.error("Erro ao aprovar funcionário");
        }
    };

    const handleClear = () => {
        setFormData({
            nif: '',
            name: '',
            contact: '',
            isEmployee: false,
            role: '',
            email: ''
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Funcionalidade de criação via dashboard em breve.");
    };

    // Filter users
    const filteredUsers = users.filter(user =>
        user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.nif.includes(searchQuery)
    );

    const pendingCount = users.filter(u => u.active === false).length;

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Utilizadores</h1>
                <p className="text-gray-500 dark:text-gray-400">Criação e recuperação de contas</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Left Panel: Create Account Form */}
                <div className="w-full md:w-[450px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/20">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Criação de Conta</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Registar novo utente ou funcionário</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">NIF *</Label>
                                <Input
                                    placeholder="Número de identificação fiscal"
                                    className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 focus:ring-purple-500 h-11"
                                    value={formData.nif}
                                    onChange={e => setFormData({ ...formData, nif: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">Nome Completo *</Label>
                                <Input
                                    placeholder="Nome e apelido"
                                    className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 focus:ring-purple-500 h-11"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300 font-medium">Contacto</Label>
                            <Input
                                placeholder="Número de telefone"
                                className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 focus:ring-purple-500 h-11"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            />
                        </div>

                        {/* Employee Checkbox Area */}
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="isEmployee"
                                    className="mt-1 data-[state=checked]:bg-purple-600 border-purple-300 dark:border-purple-700"
                                    checked={formData.isEmployee}
                                    onCheckedChange={(c) => setFormData({ ...formData, isEmployee: !!c })}
                                />
                                <div>
                                    <label htmlFor="isEmployee" className="font-semibold text-gray-800 dark:text-gray-200 block cursor-pointer">
                                        É funcionário?
                                    </label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Marque se esta pessoa é colaboradora da instituição
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Employee Fields */}
                        {formData.isEmployee && (
                            <div className="space-y-6 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5V21" /><path d="M9 9h.01" /><path d="M9 12h.01" /><path d="M9 15h.01" /><path d="M13 9h.01" /><path d="M13 12h.01" /><path d="M13 15h.01" /></svg>
                                    <span>Dados do Funcionário</span>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">Função</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 h-11">
                                            <SelectValue placeholder="Selecione a função" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Secretaria">Secretaria</SelectItem>
                                            <SelectItem value="Balneário Social">Balneário Social</SelectItem>
                                            <SelectItem value="Escola">Escola</SelectItem>
                                            <SelectItem value="Serviços Internos">Serviços Internos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">Email Institucional</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                        </div>
                                        <Input
                                            placeholder="email@instituicao.pt"
                                            className="pl-10 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 focus:ring-purple-500 h-11"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-11 border-gray-200 hover:bg-gray-50 text-gray-700"
                                onClick={handleClear}
                            >
                                Limpar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/20 font-medium"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Notificar
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right Panel: Registered Users List */}
                <div className="flex-1 w-full min-w-0 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Utilizadores Registados</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Pendentes</span>
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] flex items-center justify-center font-bold">{pendingCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Pesquisar por nome ou NIF..."
                            className="pl-10 h-11 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Users Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full">
                            <thead className="text-sm font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="text-left pb-3 pl-2 font-medium">Nome</th>
                                    <th className="text-left pb-3 font-medium">NIF</th>
                                    <th className="text-left pb-3 font-medium">Função</th>
                                    <th className="text-left pb-3 font-medium">Estado</th>
                                    <th className="text-left pb-3 font-medium">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400">
                                            Carregando...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400">
                                            Nenhum utilizador encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((user: any, index) => (
                                        <tr key={index} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-3 pl-2 font-medium text-gray-900 dark:text-gray-200">{user.nome}</td>
                                            <td className="py-3 text-gray-600 dark:text-gray-400">{user.nif}</td>
                                            <td className="py-3 text-gray-600 dark:text-gray-400">
                                                {user.funcao ? (
                                                    {
                                                        'SECRETARIA': 'Secretaria',
                                                        'BALNEARIO': 'Balneário Social',
                                                        'ESCOLA': 'Escola',
                                                        'INTERNOS': 'Serviços Internos',
                                                        'OUTRO': 'Outro'
                                                    }[user.funcao] || user.funcao
                                                ) : '-'}
                                            </td>
                                            <td className="py-3 text-left">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.active
                                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }`}>
                                                    {user.active ? 'Ativo' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-left">
                                                {!user.active && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                                                        onClick={() => handleApprove(user.id)}
                                                    >
                                                        Aprovar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[3rem] text-center">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
