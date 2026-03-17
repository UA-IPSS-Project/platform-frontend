import { useState, useEffect } from 'react';
import { utilizadoresApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Search, UserPlus, Send, Eraser, ChevronLeft, ChevronRight, Users, ChevronDown, ChevronUp, Lock, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '../ui/glass-card';
import { DatePickerField } from '../ui/date-picker-field';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import {
    validateName,
    validateNIF,
    validateContact,
    validateBirthDate,
    validateEmail
} from '../../lib/validations';
import { useTranslation } from 'react-i18next';

interface UserManagementProps {
    isDarkMode: boolean;
}

export function UserManagement({ isDarkMode }: UserManagementProps) {
    const { t } = useTranslation();

    // State for Create Account Form
    const [formData, setFormData] = useState({
        nif: '',
        name: '',
        contact: '',
        role: 'UTENTE',
        email: '',
        birthDate: '',
    });
    const [emailSelection, setEmailSelection] = useState<'auto' | 'manual'>('auto');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // State for "User Exists" Dialog
    const [showUserExistsDialog, setShowUserExistsDialog] = useState(false);
    const [existingUserForDialog, setExistingUserForDialog] = useState<any | null>(null);

    // State for "User Not Found" Dialog
    const [showUserNotFoundDialog, setShowUserNotFoundDialog] = useState(false);
    const [searchedNifForDialog, setSearchedNifForDialog] = useState('');

    // State for Recover Account Form
    const [recoverData, setRecoverData] = useState({
        nifSearch: '',
        foundUser: null as any | null, // Stores the user data if found
        // Editable fields for recovery
        name: '',
        birthDate: '',
        contact: '',
        email: ''
    });

    const [activeSection, setActiveSection] = useState<'create' | 'recover'>('create');

    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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
        } finally {
            setIsLoading(false);
        }
    };

    // Helper functions for email generation (from RegisterForm)
    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const generateInstitutionalEmail = (fullName: string) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 0) return '';

        // First name
        const first = normalizeString(parts[0]);
        if (parts.length === 1) return `${first}@florinhasdovouga.pt`;

        // Last name
        const last = normalizeString(parts[parts.length - 1]);

        // Middle initials
        let middles = '';
        if (parts.length > 2) {
            for (let i = 1; i < parts.length - 1; i++) {
                const p = normalizeString(parts[i]);
                if (p.length > 0) middles += p[0];
            }
        }

        return `${first}${middles}${last}@florinhasdovouga.pt`;
    };

    // Auto-update email for employees
    useEffect(() => {
        if (formData.role !== 'UTENTE' && emailSelection === 'auto') {
            const generated = generateInstitutionalEmail(formData.name);
            setFormData(prev => ({ ...prev, email: generated }));
        }
    }, [formData.name, formData.role, emailSelection]);


    const handleApprove = async (id: number) => {
        try {
            await utilizadoresApi.aprovarFuncionario(id);
            toast.success(t('userManagement.messages.employeeApproved'));
            fetchUsers();
        } catch (error) {
            toast.error(t('userManagement.errors.employeeApprove'));
        }
    };

    const handleClearCreate = () => {
        setFormData({
            nif: '',
            name: '',
            contact: '',
            role: 'UTENTE',
            email: '',
            birthDate: '',
        });
        setEmailSelection('auto');
    };

    const checkNifExistence = async () => {
        // Only check if NIF is valid (9 digits)
        if (!formData.nif || !validateNIF(formData.nif)) return;

        try {
            const existingUser = await utilizadoresApi.buscarPorNif(formData.nif);
            if (existingUser && existingUser.id) {
                setExistingUserForDialog(existingUser);
                setShowUserExistsDialog(true);
            }
        } catch (err) {
            // Ignore if not found or error
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Reset previous errors
        setErrors({});

        // 2. Run Validations
        const newErrors: Record<string, string> = {};

        // NIF
        if (!formData.nif) {
            newErrors.nif = t('auth.nifRequired');
        } else if (!validateNIF(formData.nif)) {
            newErrors.nif = t('auth.nifMustHave9Digits');
        }

        // Name
        const nameVal = validateName(formData.name);
        if (!nameVal.valid) {
            newErrors.name = nameVal.error || t('auth.invalidName');
        }

        // Contact
        if (!formData.contact) {
            newErrors.contact = t('auth.contactRequired');
        } else if (!validateContact(formData.contact)) {
            newErrors.contact = t('auth.contactMustHave9Digits');
        }

        // Email
        if (!formData.email) {
            newErrors.email = t('auth.emailRequired');
        } else if (!validateEmail(formData.email)) {
            newErrors.email = t('auth.emailInvalid');
        }
        // Institutional Check
        if (formData.role !== 'UTENTE' && !formData.email.endsWith('@florinhasdovouga.pt')) {
            newErrors.email = t('auth.useInstitutionalEmail');
        }

        // BirthDate
        if (!formData.birthDate) {
            newErrors.birthDate = t('appointmentDialog.errors.birthDateRequired');
        } else {
            // O calendário guarda YYYY-MM-DD, mas a validação funcional espera dd/mm/yyyy.
            // validateBirthDate expects dd/mm/yyyy.
            const [y, m, d] = formData.birthDate.split('-');
            const formattedDate = `${d}/${m}/${y}`;
            const birthValCheck = validateBirthDate(formattedDate);
            if (!birthValCheck.valid) {
                newErrors.birthDate = birthValCheck.error || t('appointmentDialog.errors.dateInvalid');
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(t('auth.fixErrorsBeforeContinue'));
            return;
        }

        try {
            // 3. Check if user already exists
            try {
                const existingUser = await utilizadoresApi.buscarPorNif(formData.nif);
                if (existingUser && existingUser.id) {
                    // User Exists! Show Dialog
                    setExistingUserForDialog(existingUser);
                    setShowUserExistsDialog(true);
                    return;
                }
            } catch (err) {
                // If 404/Not Found, good to proceed. If other error, maybe warn but usually 404 means safe to create.
                // Depending on API implementation, it might throw error if not found.
            }

            // 4. Create Account
            await utilizadoresApi.createBySecretary({
                name: formData.name,
                nif: formData.nif,
                contact: formData.contact,
                email: formData.email,
                birthDate: formData.birthDate,
                isEmployee: formData.role !== 'UTENTE',
                role: formData.role
            });
            toast.success(t('userManagement.messages.accountCreatedWithEmail', { email: formData.email }));
            handleClearCreate();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || t('auth.errorCreatingAccount'));
        }
    };

    const handleConfirmUpdateExisting = () => {
        if (!existingUserForDialog) return;

        // 1. Close Dialog
        setShowUserExistsDialog(false);

        // 2. Switch to Recover Mode
        setActiveSection('recover');

        // 3. Pre-fill Recovery Data
        setRecoverData({
            nifSearch: existingUserForDialog.nif,
            foundUser: existingUserForDialog,
            name: existingUserForDialog.nome,
            birthDate: existingUserForDialog.dataNascimento || '',
            contact: existingUserForDialog.telefone,
            email: existingUserForDialog.email
        });

        // 4. Clear existing user temp state
        setExistingUserForDialog(null);

        toast.info(t('userManagement.messages.redirectToRecovery'));
    };

    const handleConfirmCreateNew = () => {
        // 1. Close Dialog
        setShowUserNotFoundDialog(false);

        // 2. Switch to Create Mode
        setActiveSection('create');
        handleClearCreate(); // Reset first

        // 3. Pre-fill NIF in Create Form
        setFormData(prev => ({
            ...prev,
            nif: searchedNifForDialog
        }));

        // 4. Reset temp state
        setSearchedNifForDialog('');

        toast.info(t('userManagement.messages.redirectToCreate'));
    };

    const handleSearchForRecovery = async () => {
        // Reset recovery data except search field (or keep it?)
        setRecoverData(prev => ({ ...prev, foundUser: null }));

        if (!recoverData.nifSearch) {
            toast.error(t('userManagement.errors.enterNifToSearch'));
            return;
        }

        if (!validateNIF(recoverData.nifSearch)) {
            toast.error(t('userManagement.errors.invalidNif'));
            return;
        }

        try {
            const user = await utilizadoresApi.searchByNifForRecovery(recoverData.nifSearch);
            setRecoverData(prev => ({
                ...prev,
                foundUser: user,
                name: user.nome,
                birthDate: user.dataNascimento || '',
                contact: user.telefone,
                email: user.email
            }));
            toast.success(t('userManagement.messages.userFound'));
        } catch (error) {
            // User Not Found!
            setSearchedNifForDialog(recoverData.nifSearch);
            setShowUserNotFoundDialog(true);
        }
    };

    const handleRecoverSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recoverData.foundUser) return;

        // Validation
        if (recoverData.contact && !validateContact(recoverData.contact)) {
            toast.error(t('userManagement.errors.invalidContact'));
            return;
        }
        if (recoverData.email && !validateEmail(recoverData.email)) {
            toast.error(t('auth.emailInvalid'));
            return;
        }

        try {
            await utilizadoresApi.recoverAccount({
                nif: recoverData.foundUser.nif,
                updatedEmail: recoverData.email !== recoverData.foundUser.email ? recoverData.email : undefined,
                updatedContact: recoverData.contact !== recoverData.foundUser.telefone ? recoverData.contact : undefined
            });

            toast.success(t('userManagement.messages.recoveryStarted', { email: recoverData.email }));

            // Reset recovery form
            setRecoverData({
                nifSearch: '',
                foundUser: null,
                name: '',
                birthDate: '',
                contact: '',
                email: ''
            });
        } catch (error: any) {
            toast.error(error.message || t('userManagement.errors.recoveryFailed'));
        }
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('userManagement.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400">{t('userManagement.subtitle')}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Left Panel: Accordion for Create / Recover */}
                <div className="w-full md:w-[450px] flex-shrink-0 flex flex-col gap-4">

                    {/* Create Account Section */}
                    {/* Using Purple for active state */}
                    <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeSection === 'create' ? 'ring-2 ring-purple-500/30' : 'opacity-80 hover:opacity-100'}`}>
                        <button
                            onClick={() => setActiveSection('create')}
                            className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${activeSection === 'create' ? 'bg-purple-600 shadow-purple-200 dark:shadow-purple-900/20' : 'bg-gray-400'}`}>
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('userManagement.createAccount')}</h2>
                                    {activeSection !== 'create' && <p className="text-xs text-gray-500">{t('userManagement.clickToExpand')}</p>}
                                </div>
                            </div>
                            {activeSection === 'create' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {activeSection === 'create' && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                <form onSubmit={handleCreateSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">NIF *</Label>
                                            <Input
                                                placeholder="123456789"
                                                maxLength={9}
                                                className={`bg-white dark:bg-gray-900 h-9 text-sm ${errors.nif ? 'border-red-500' : ''}`}
                                                value={formData.nif}
                                                onChange={e => {
                                                    setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '') });
                                                    if (errors.nif) setErrors({ ...errors, nif: '' });
                                                }}
                                                onBlur={checkNifExistence}
                                            />
                                            {errors.nif && <p className="text-red-500 text-xs">{errors.nif}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('appointmentDialog.fields.contact')}</Label>
                                            <Input
                                                placeholder="912345678"
                                                maxLength={9}
                                                className={`bg-white dark:bg-gray-900 h-9 text-sm ${errors.contact ? 'border-red-500' : ''}`}
                                                value={formData.contact}
                                                onChange={e => {
                                                    setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '') });
                                                    if (errors.contact) setErrors({ ...errors, contact: '' });
                                                }}
                                            />
                                            {errors.contact && <p className="text-red-500 text-xs">{errors.contact}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('auth.fullName')} *</Label>
                                        <Input
                                            placeholder={t('userManagement.namePlaceholder')}
                                            className={`bg-white dark:bg-gray-900 h-9 text-sm ${errors.name ? 'border-red-500' : ''}`}
                                            value={formData.name}
                                            onChange={e => {
                                                setFormData({ ...formData, name: e.target.value });
                                                if (errors.name) setErrors({ ...errors, name: '' });
                                            }}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('appointmentDialog.fields.birthDate')}</Label>
                                        <DatePickerField
                                            value={formData.birthDate}
                                            onChange={(value) => {
                                                setFormData({ ...formData, birthDate: value });
                                                if (errors.birthDate) setErrors({ ...errors, birthDate: '' });
                                            }}
                                            buttonClassName={`bg-white dark:bg-gray-900 h-9 text-sm ${errors.birthDate ? 'border-red-500' : ''}`}
                                        />
                                        {errors.birthDate && <p className="text-red-500 text-xs">{errors.birthDate}</p>}
                                    </div>

                                    {/* Role Selection */}
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('userManagement.userType')}</Label>
                                        <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                            <SelectTrigger className="bg-white dark:bg-gray-900 h-9 text-sm">
                                                <SelectValue placeholder={t('userManagement.selectRole')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UTENTE">{t('userManagement.roles.userCommon')}</SelectItem>
                                                <SelectItem value="SECRETARIA">{t('userManagement.roles.secretary')}</SelectItem>
                                                <SelectItem value="BALNEARIO">{t('userManagement.roles.balneario')}</SelectItem>
                                                <SelectItem value="INTERNO">{t('userManagement.roles.internals')}</SelectItem>
                                                <SelectItem value="ADMIN">{t('userManagement.roles.admin')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.role !== 'UTENTE' ? (
                                        <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                            <div className="space-y-2">
                                                <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('auth.institutionalEmail')}</Label>

                                                {/* Auto/Manual Toggle for Institutional Email */}
                                                <div className="space-y-3">
                                                    {/* Option 1: Auto Generated */}
                                                    <div
                                                        onClick={() => setEmailSelection('auto')}
                                                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${emailSelection === 'auto'
                                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/20'
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                                                            }`}
                                                    >
                                                        <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-colors ${emailSelection === 'auto'
                                                            ? 'border-purple-600 bg-purple-600'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                            }`}>
                                                            {emailSelection === 'auto' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-xs font-medium transition-colors ${emailSelection === 'auto' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                {formData.name ? generateInstitutionalEmail(formData.name) : t('userManagement.fillNameFirst')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Option 2: Manual Entry */}
                                                    <div
                                                        onClick={() => setEmailSelection('manual')}
                                                        className={`flex flex-col gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${emailSelection === 'manual'
                                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/20'
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-colors ${emailSelection === 'manual'
                                                                ? 'border-purple-600 bg-purple-600'
                                                                : 'border-gray-300 dark:border-gray-600'
                                                                }`}>
                                                                {emailSelection === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                            </div>
                                                            <span className={`text-xs font-medium transition-colors ${emailSelection === 'manual' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                {t('userManagement.other')}
                                                            </span>
                                                        </div>

                                                        {emailSelection === 'manual' && (
                                                            <div className="flex items-center gap-2 pl-7 animate-in">
                                                                <Input
                                                                    type="text"
                                                                    placeholder={t('userManagement.nameShortPlaceholder')}
                                                                    value={formData.email.endsWith('@florinhasdovouga.pt') ? formData.email.slice(0, -20) : formData.email}
                                                                    onChange={(e) => {
                                                                        const prefix = e.target.value.split('@')[0];
                                                                        setFormData({ ...formData, email: prefix + '@florinhasdovouga.pt' });
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="h-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-xs"
                                                                />
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">@florinhas...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('appointmentDialog.fields.email')}</Label>
                                            <Input
                                                type="email"
                                                placeholder={t('userManagement.emailPlaceholder')}
                                                className={`bg-white dark:bg-gray-900 h-9 text-sm ${errors.email ? 'border-red-500' : ''}`}
                                                value={formData.email}
                                                onChange={e => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (errors.email) setErrors({ ...errors, email: '' });
                                                }}
                                            />
                                            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-9 text-xs"
                                            onClick={handleClearCreate}
                                        >
                                            {t('documents.actions.clear')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium"
                                        >
                                            <UserPlus className="w-3 h-3 mr-2" />
                                            {t('requisitions.ui.create')}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </GlassCard>

                    {/* Recover Account Section */}
                    {/* Using Purple (or consistent theme) instead of Blue, per request */}
                    <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeSection === 'recover' ? 'ring-2 ring-purple-500/30' : 'opacity-80 hover:opacity-100'}`}>
                        <button
                            onClick={() => setActiveSection('recover')}
                            className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                {/* Changed icon background from blue to purple to match theme as requested */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${activeSection === 'recover' ? 'bg-purple-600 shadow-purple-200 dark:shadow-purple-900/20' : 'bg-gray-400'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('userManagement.recoverAccount')}</h2>
                                    {activeSection !== 'recover' && <p className="text-xs text-gray-500">{t('userManagement.clickToExpand')}</p>}
                                </div>
                            </div>
                            {activeSection === 'recover' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {activeSection === 'recover' && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                <form onSubmit={handleRecoverSubmit} className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        {t('userManagement.recoveryHint')}
                                    </p>

                                    {/* Step 1: Search by NIF */}
                                    <div className="flex gap-2 items-end">
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('userManagement.searchNif')}</Label>
                                            <Input
                                                placeholder={t('userManagement.userNifPlaceholder')}
                                                maxLength={9}
                                                className="bg-white dark:bg-gray-900 h-9 text-sm"
                                                value={recoverData.nifSearch}
                                                onChange={e => setRecoverData({ ...recoverData, nifSearch: e.target.value.replace(/\D/g, '') })}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleSearchForRecovery}
                                            className="h-9 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                                        >
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Step 2: Confirm Identity & Edit Contact */}
                                    {recoverData.foundUser && (
                                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 fade-in">
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30 mb-2">
                                                <p className="text-xs text-purple-800 dark:text-purple-300 font-semibold flex items-center gap-2">
                                                    <Check className="w-3 h-3" />
                                                    {t('userManagement.identityFound')}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('requisitions.ui.name')}</Label>
                                                <Input
                                                    readOnly
                                                    className="bg-gray-50 dark:bg-gray-800 h-9 text-sm border-dashed"
                                                    value={recoverData.name}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('appointmentDialog.fields.birthDate')}</Label>
                                                <Input
                                                    readOnly
                                                    className="bg-gray-50 dark:bg-gray-800 h-9 text-sm border-dashed"
                                                    value={recoverData.birthDate}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('userManagement.contactEditable')}</Label>
                                                <Input
                                                    maxLength={9}
                                                    className="bg-white dark:bg-gray-900 h-9 text-sm"
                                                    value={recoverData.contact}
                                                    onChange={e => setRecoverData({ ...recoverData, contact: e.target.value.replace(/\D/g, '') })}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-gray-700 dark:text-gray-300 font-medium text-xs">{t('userManagement.emailEditable')}</Label>
                                                <Input
                                                    className="bg-white dark:bg-gray-900 h-9 text-sm"
                                                    value={recoverData.email}
                                                    onChange={e => setRecoverData({ ...recoverData, email: e.target.value })}
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium mt-2"
                                            >
                                                <Send className="w-3 h-3 mr-2" />
                                                {t('userManagement.notifyRecovery')}
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </GlassCard>

                </div>

                {/* Right Panel: Registered Users List */}
                <GlassCard className="flex-1 w-full min-w-0 p-8 flex flex-col h-full border border-white/20 dark:border-gray-700/30">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            {/* Changed icon background from blue to purple */}
                            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('userManagement.registeredUsers')}</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t('userManagement.pending')}</span>
                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] flex items-center justify-center font-bold">{pendingCount}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={fetchUsers}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder={t('userManagement.searchByNameOrNif')}
                            className="h-10 pl-9 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-sm"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Users Table */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full">
                            <thead className="text-sm font-medium text-gray-500 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="text-left pb-3 pl-2 font-medium">{t('requisitions.ui.name')}</th>
                                    <th className="text-left pb-3 font-medium">NIF</th>
                                    <th className="text-left pb-3 font-medium">{t('userManagement.role')}</th>
                                    <th className="text-left pb-3 font-medium">{t('requisitions.ui.status')}</th>
                                    <th className="text-left pb-3 font-medium">{t('userManagement.action')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400">
                                            {t('documents.actions.searching')}
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400">
                                            {t('userManagement.noUsersFound')}
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((user: any, index) => (
                                        <tr key={index} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-3 pl-2 font-medium text-gray-900 dark:text-gray-200">{user.nome}</td>
                                            <td className="py-3 text-gray-600 dark:text-gray-400">{user.nif}</td>
                                            <td className="py-3 text-gray-600 dark:text-gray-400">
                                                {user.funcao ? (
                                                    ({
                                                        'SECRETARIA': t('userManagement.roles.secretary'),
                                                        'BALNEARIO': t('userManagement.roles.balneario'),
                                                        'ESCOLA': t('userManagement.roles.school'),
                                                        'INTERNOS': t('userManagement.roles.internals'),
                                                        'OUTRO': t('userManagement.roles.other')
                                                    } as Record<string, string>)[user.funcao] || user.funcao
                                                ) : '-'}
                                            </td>
                                            <td className="py-3 text-left">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.active
                                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }`}>
                                                    {user.active ? t('userManagement.active') : t('userManagement.pending')}
                                                </span>
                                            </td>
                                            <td className="py-3 text-left">
                                                {!user.active && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs"
                                                        onClick={() => handleApprove(user.id)}
                                                    >
                                                        {t('userManagement.approve')}
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
                                {t('userManagement.showingUsers', {
                                    start: startIndex + 1,
                                    end: Math.min(startIndex + itemsPerPage, filteredUsers.length),
                                    total: filteredUsers.length,
                                })}
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
                </GlassCard>
            </div>

            {/* Existing User Dialog */}
            <AlertDialog open={showUserExistsDialog} onOpenChange={setShowUserExistsDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('userManagement.userAlreadyExistsTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            {t('userManagement.userAlreadyExistsDescription', { nif: existingUserForDialog?.nif })}
                            <br /><br />
                            <strong>{t('requisitions.ui.name')}:</strong> {existingUserForDialog?.nome}
                            <br />
                            <strong>{t('appointmentDialog.fields.email')}:</strong> {existingUserForDialog?.email}
                            <br /><br />
                            {t('userManagement.askUpdateContactData')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUserExistsDialog(false)}>{t('appointmentDialog.actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmUpdateExisting}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {t('userManagement.yesUpdateData')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* User Not Found Dialog (Recovery -> Create) */}
            <AlertDialog open={showUserNotFoundDialog} onOpenChange={setShowUserNotFoundDialog}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('userManagement.userNotFoundTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                            {t('userManagement.userNotFoundDescription', { nif: searchedNifForDialog })}
                            <br /><br />
                            {t('userManagement.askCreateNewWithNif')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUserNotFoundDialog(false)}>{t('appointmentDialog.actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCreateNew}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {t('userManagement.yesCreateNewAccount')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
