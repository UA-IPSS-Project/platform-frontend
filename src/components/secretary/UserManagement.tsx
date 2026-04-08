import { useState, useEffect, useMemo } from 'react';
import { utilizadoresApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, UserPlus, Send, ChevronLeft, ChevronRight, Users, User, ChevronDown, ChevronUp, Lock, RefreshCw, Check, Eye, ShieldCheck, Loader2, MapPin, Briefcase, Mail, Phone, Calendar, Building2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '../ui/glass-card';
import { DatePickerField } from '../ui/date-picker-field';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

interface UserManagementProps {
    isDarkMode?: boolean;
}

export function UserManagement({ isDarkMode }: UserManagementProps) {
    void isDarkMode;
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
    const [utentes, setUtentes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUtentes, setIsLoadingUtentes] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryUtentes, setSearchQueryUtentes] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageUtentes, setCurrentPageUtentes] = useState(1);
    const [activeTable, setActiveTable] = useState<'employees' | 'utentes'>('employees');
    const itemsPerPage = 5;

    // State for User Details Popup
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [editForm, setEditForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        nif: '',
        dataNascimento: '',
        morada: '',
        codigoPostal: '',
        freguesia: '',
        profissao: '',
        localEmprego: '',
        moradaEmprego: '',
        telefoneEmprego: ''
    });

    const [pendingClose, setPendingClose] = useState(false);

    const isDirty = useMemo(() => {
        if (!selectedUser || !isDetailsOpen) return false;

        return (
            editForm.nome !== (selectedUser.nome || '') ||
            editForm.email !== (selectedUser.email || '') ||
            editForm.telefone !== (selectedUser.telefone || '') ||
            editForm.dataNascimento !== (selectedUser.dataNascimento || '') ||
            editForm.morada !== (selectedUser.morada || '') ||
            editForm.codigoPostal !== (selectedUser.codigoPostal || '') ||
            editForm.freguesia !== (selectedUser.freguesia || '') ||
            editForm.profissao !== (selectedUser.profissao || '') ||
            editForm.localEmprego !== (selectedUser.localEmprego || '') ||
            editForm.moradaEmprego !== (selectedUser.moradaEmprego || '') ||
            editForm.telefoneEmprego !== (selectedUser.telefoneEmprego || '')
        );
    }, [editForm, selectedUser, isDetailsOpen]);

    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        address: false,
        professional: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderSectionHeader = (title: string, icon: React.ReactNode, sectionKey: keyof typeof expandedSections) => (
        <div
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 group"
            onClick={() => toggleSection(sectionKey)}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${expandedSections[sectionKey] ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                    {icon}
                </div>
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
            </div>
            {expandedSections[sectionKey] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
    );

    const blocker = useUnsavedChangesWarning(isDirty);

    const handleClose = () => {
        setIsDetailsOpen(false);
        setIsEditing(false);
        setPendingClose(false);
    };

    const requestClose = () => {
        if (isDirty) {
            setPendingClose(true);
        } else {
            handleClose();
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        fetchUsers();
        fetchUtentes();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await utilizadoresApi.listarFuncionarios();
            const sorted = [...data].sort((a, b) => {
                if (a.active !== b.active) return a.active ? 1 : -1;
                return (b.id || 0) - (a.id || 0);
            });
            setUsers(sorted);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUtentes = async () => {
        setIsLoadingUtentes(true);
        try {
            const data = await utilizadoresApi.listarUtentes();
            const sorted = [...data].sort((a, b) => {
                if (a.active !== b.active) return a.active ? 1 : -1;
                return (b.id || 0) - (a.id || 0);
            });
            setUtentes(sorted);
        } catch (error) {
            console.error("Failed to fetch utentes", error);
        } finally {
            setIsLoadingUtentes(false);
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



    const handleOpenDetails = (user: any) => {
        setSelectedUser(user);
        setEditForm({
            nome: user.nome || '',
            email: user.email || '',
            telefone: user.telefone || '',
            nif: user.nif || '',
            dataNascimento: user.dataNascimento || '',
            morada: user.morada || '',
            codigoPostal: user.codigoPostal || '',
            freguesia: user.freguesia || '',
            profissao: user.profissao || '',
            localEmprego: user.localEmprego || '',
            moradaEmprego: user.moradaEmprego || '',
            telefoneEmprego: user.telefoneEmprego || ''
        });
        setIsEditing(false);
        setIsDetailsOpen(true);
    };

    const handleEditSave = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            await utilizadoresApi.atualizar(selectedUser.id, editForm);
            toast.success(t('userManagement.details.success.updated'));
            fetchUsers();
            fetchUtentes();
            setIsDetailsOpen(false);
        } catch (error) {
            toast.error(t('userManagement.details.errors.update'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleApproveDetail = async () => {
        if (!selectedUser) return;
        setIsApproving(true);
        try {
            await utilizadoresApi.aprovarFuncionario(selectedUser.id);
            toast.success(t('userManagement.details.success.approved'));
            fetchUsers();
            fetchUtentes();
            setIsDetailsOpen(false);
        } catch (error) {
            toast.error(t('userManagement.details.errors.approve'));
        } finally {
            setIsApproving(false);
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
        if (formData.contact && !validateContact(formData.contact)) {
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
                contact: formData.contact || undefined,
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

    // Filter users (Employees)
    const filteredUsers = users.filter(user =>
        user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.nif.includes(searchQuery)
    );

    // Filter utentes
    const filteredUtentesList = utentes.filter(u =>
        u.nome.toLowerCase().includes(searchQueryUtentes.toLowerCase()) ||
        u.nif.includes(searchQueryUtentes)
    );

    const pendingCount = users.filter(u => u.active === false).length;

    // Pagination Employees
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Pagination Utentes
    const totalPagesUtentes = Math.ceil(filteredUtentesList.length / itemsPerPage);
    const startIndexUtentes = (currentPageUtentes - 1) * itemsPerPage;
    const currentUtentes = filteredUtentesList.slice(startIndexUtentes, startIndexUtentes + itemsPerPage);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t('userManagement.title')}</h1>
                <p className="text-muted-foreground">{t('userManagement.subtitle')}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Left Panel: Accordion for Create / Recover */}
                <div className="w-full md:w-[450px] flex-shrink-0 flex flex-col gap-4">

                    {/* Create Account Section */}
                    {/* Active state follows semantic primary token */}
                    <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeSection === 'create' ? 'ring-2 ring-primary/30' : 'opacity-80 hover:opacity-100'}`}>
                        <button
                            onClick={() => setActiveSection('create')}
                            className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg transition-colors ${activeSection === 'create' ? 'bg-primary shadow-primary/20' : 'bg-muted-foreground'}`}>
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-foreground">{t('userManagement.createAccount')}</h2>
                                    {activeSection !== 'create' && <p className="text-xs text-muted-foreground">{t('userManagement.clickToExpand')}</p>}
                                </div>
                            </div>
                            {activeSection === 'create' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </button>

                        {activeSection === 'create' && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                <form onSubmit={handleCreateSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium text-xs">NIF *</Label>
                                            <Input
                                                placeholder="123456789"
                                                maxLength={9}
                                                className={`bg-card h-9 text-sm ${errors.nif ? 'border-status-error' : ''}`}
                                                value={formData.nif}
                                                onChange={e => {
                                                    setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '') });
                                                    if (errors.nif) setErrors({ ...errors, nif: '' });
                                                }}
                                                onBlur={checkNifExistence}
                                            />
                                            {errors.nif && <p className="text-status-error text-xs">{errors.nif}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium text-xs">
                                                {t('appointmentDialog.fields.contact')} <span className="font-normal opacity-70">{t('common.optional')}</span>
                                            </Label>
                                            <Input
                                                placeholder="912345678"
                                                maxLength={9}
                                                className={`bg-card h-9 text-sm ${errors.contact ? 'border-status-error' : ''}`}
                                                value={formData.contact}
                                                onChange={e => {
                                                    setFormData({ ...formData, contact: e.target.value.replace(/\D/g, '') });
                                                    if (errors.contact) setErrors({ ...errors, contact: '' });
                                                }}
                                            />
                                            {errors.contact && <p className="text-status-error text-xs">{errors.contact}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-foreground font-medium text-xs">{t('auth.fullName')} *</Label>
                                        <Input
                                            placeholder={t('userManagement.namePlaceholder')}
                                            className={`bg-card h-9 text-sm ${errors.name ? 'border-status-error' : ''}`}
                                            value={formData.name}
                                            onChange={e => {
                                                setFormData({ ...formData, name: e.target.value });
                                                if (errors.name) setErrors({ ...errors, name: '' });
                                            }}
                                        />
                                        {errors.name && <p className="text-status-error text-xs">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-foreground font-medium text-xs">{t('appointmentDialog.fields.birthDate')}</Label>
                                        <DatePickerField
                                            value={formData.birthDate}
                                            onChange={(value) => {
                                                setFormData({ ...formData, birthDate: value });
                                                if (errors.birthDate) setErrors({ ...errors, birthDate: '' });
                                            }}
                                            buttonClassName={`bg-card h-9 text-sm ${errors.birthDate ? 'border-status-error' : ''}`}
                                        />
                                        {errors.birthDate && <p className="text-status-error text-xs">{errors.birthDate}</p>}
                                    </div>

                                    {/* Role Selection */}
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-foreground font-medium text-xs">{t('userManagement.userType')}</Label>
                                        <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                            <SelectTrigger className="bg-card h-9 text-sm">
                                                <SelectValue placeholder={t('userManagement.selectRole')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UTENTE">{t('userManagement.roles.userCommon')}</SelectItem>
                                                <SelectItem value="SECRETARIA">{t('userManagement.roles.secretary')}</SelectItem>
                                                <SelectItem value="BALNEARIO">{t('userManagement.roles.balneario')}</SelectItem>
                                                <SelectItem value="ESCOLA">{t('userManagement.roles.school')}</SelectItem>
                                                <SelectItem value="INTERNO">{t('userManagement.roles.internals')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.role !== 'UTENTE' ? (
                                        <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-medium text-xs">{t('auth.institutionalEmail')}</Label>

                                                {/* Auto/Manual Toggle for Institutional Email */}
                                                <div className="space-y-3">
                                                    {/* Option 1: Auto Generated */}
                                                    <div
                                                        onClick={() => setEmailSelection('auto')}
                                                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${emailSelection === 'auto'
                                                            ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                                                            : 'bg-card border-border hover:border-primary/30'
                                                            }`}
                                                    >
                                                        <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-colors ${emailSelection === 'auto'
                                                            ? 'border-primary bg-primary'
                                                            : 'border-border'
                                                            }`}>
                                                            {emailSelection === 'auto' && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-xs font-medium transition-colors ${emailSelection === 'auto' ? 'text-primary' : 'text-foreground/80'}`}>
                                                                {formData.name ? generateInstitutionalEmail(formData.name) : t('userManagement.fillNameFirst')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Option 2: Manual Entry */}
                                                    <div
                                                        onClick={() => setEmailSelection('manual')}
                                                        className={`flex flex-col gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${emailSelection === 'manual'
                                                            ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                                                            : 'bg-card border-border hover:border-primary/30'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex items-center justify-center w-4 h-4 rounded-full border transition-colors ${emailSelection === 'manual'
                                                                ? 'border-primary bg-primary'
                                                                : 'border-border'
                                                                }`}>
                                                                {emailSelection === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                                            </div>
                                                            <span className={`text-xs font-medium transition-colors ${emailSelection === 'manual' ? 'text-primary' : 'text-foreground/80'}`}>
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
                                                                    className="h-8 bg-card border-border text-xs"
                                                                />
                                                                <span className="text-xs text-muted-foreground font-medium shrink-0">@florinhas...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-foreground font-medium text-xs">{t('appointmentDialog.fields.email')}</Label>
                                            <Input
                                                type="email"
                                                placeholder={t('userManagement.emailPlaceholder')}
                                                className={`bg-card h-9 text-sm ${errors.email ? 'border-status-error' : ''}`}
                                                value={formData.email}
                                                onChange={e => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (errors.email) setErrors({ ...errors, email: '' });
                                                }}
                                            />
                                            {errors.email && <p className="text-status-error text-xs">{errors.email}</p>}
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
                                            className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium"
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
                    {/* Active state follows semantic primary token */}
                    <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeSection === 'recover' ? 'ring-2 ring-primary/30' : 'opacity-80 hover:opacity-100'}`}>
                        <button
                            onClick={() => setActiveSection('recover')}
                            className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                {/* Icon color follows semantic primary token */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg transition-colors ${activeSection === 'recover' ? 'bg-primary shadow-primary/20' : 'bg-muted-foreground'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-foreground">{t('userManagement.recoverAccount')}</h2>
                                    {activeSection !== 'recover' && <p className="text-xs text-muted-foreground">{t('userManagement.clickToExpand')}</p>}
                                </div>
                            </div>
                            {activeSection === 'recover' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </button>

                        {activeSection === 'recover' && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                <form onSubmit={handleRecoverSubmit} className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        {t('userManagement.recoveryHint')}
                                    </p>

                                    {/* Step 1: Search by NIF */}
                                    <div className="flex gap-2 items-end">
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-foreground font-medium text-xs">{t('userManagement.searchNif')}</Label>
                                            <Input
                                                placeholder={t('userManagement.userNifPlaceholder')}
                                                maxLength={9}
                                                className="bg-card h-9 text-sm"
                                                value={recoverData.nifSearch}
                                                onChange={e => setRecoverData({ ...recoverData, nifSearch: e.target.value.replace(/\D/g, '') })}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleSearchForRecovery}
                                            className="h-9 bg-muted text-foreground hover:bg-muted/80"
                                        >
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Step 2: Confirm Identity & Edit Contact */}
                                    {recoverData.foundUser && (
                                        <div className="space-y-3 pt-2 border-t border-border/60 animate-in slide-in-from-top-2 fade-in">
                                            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-2">
                                                <p className="text-xs text-primary font-semibold flex items-center gap-2">
                                                    <Check className="w-3 h-3" />
                                                    {t('userManagement.identityFound')}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-foreground font-medium text-xs">{t('requisitions.ui.name')}</Label>
                                                <Input
                                                    readOnly
                                                    className="bg-muted h-9 text-sm border-dashed"
                                                    value={recoverData.name}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-foreground font-medium text-xs">{t('appointmentDialog.fields.birthDate')}</Label>
                                                <Input
                                                    readOnly
                                                    className="bg-muted h-9 text-sm border-dashed"
                                                    value={recoverData.birthDate}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-foreground font-medium text-xs">{t('userManagement.contactEditable')}</Label>
                                                <Input
                                                    maxLength={9}
                                                    className="bg-card h-9 text-sm"
                                                    value={recoverData.contact}
                                                    onChange={e => setRecoverData({ ...recoverData, contact: e.target.value.replace(/\D/g, '') })}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-foreground font-medium text-xs">{t('userManagement.emailEditable')}</Label>
                                                <Input
                                                    className="bg-card h-9 text-sm"
                                                    value={recoverData.email}
                                                    onChange={e => setRecoverData({ ...recoverData, email: e.target.value })}
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium mt-2"
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
                <div className="flex-1 flex flex-col gap-4">
                    {/* Header with Global Refresh - Integrated for top alignment */}
                    <GlassCard className="p-6 flex items-center justify-between border border-border/40">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{t('userManagement.title')}</h2>
                                <p className="text-xs text-muted-foreground">{t('userManagement.subtitle')}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => { fetchUsers(); fetchUtentes(); }}
                        >
                            <RefreshCw className={`w-4 h-4 ${(isLoading || isLoadingUtentes) ? 'animate-spin' : ''}`} />
                        </Button>
                    </GlassCard>

                    {/* Section 1: Employees Management */}
                    <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeTable === 'employees' ? 'ring-2 ring-primary/30' : 'opacity-80 hover:opacity-100'}`}>
                        <button
                            onClick={() => setActiveTable('employees')}
                            className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-lg transition-colors ${activeTable === 'employees' ? 'bg-primary shadow-primary/20' : 'bg-muted-foreground'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-foreground">{t('userManagement.employeesTitle')}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t('userManagement.pending')}</span>
                                        <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[8px] flex items-center justify-center font-bold">{pendingCount}</span>
                                    </div>
                                </div>
                            </div>
                            {activeTable === 'employees' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </button>

                        {activeTable === 'employees' && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                {/* Search Employees */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={t('userManagement.searchByNameOrNif')}
                                        className="h-9 pl-9 bg-card border-border text-xs"
                                        value={searchQuery}
                                        onChange={e => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>

                                {/* Employees Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="text-xs font-medium text-muted-foreground border-b border-border/60">
                                            <tr>
                                                <th className="text-left pb-2 pl-2 font-medium">{t('requisitions.ui.name')}</th>
                                                <th className="text-left pb-2 font-medium">NIF</th>
                                                <th className="text-left pb-2 font-medium">{t('userManagement.role')}</th>
                                                <th className="text-left pb-2 font-medium">{t('requisitions.ui.status')}</th>
                                                <th className="text-right pb-2 pr-2 font-medium">{t('userManagement.action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                        {t('documents.actions.searching')}
                                                    </td>
                                                </tr>
                                            ) : filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                        {t('userManagement.noUsersFound')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentUsers.map((user: any, index) => (
                                                    <tr key={index} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                                                        <td className="py-2.5 pl-2 font-medium text-foreground">{user.nome}</td>
                                                        <td className="py-2.5 text-muted-foreground">{user.nif}</td>
                                                        <td className="py-2.5 text-muted-foreground">
                                                            {user.funcao ? (
                                                                ({
                                                                    'SECRETARIA': t('userManagement.roles.secretary'),
                                                                    'BALNEARIO': t('userManagement.roles.balneario'),
                                                                    'ESCOLA': t('userManagement.roles.school'),
                                                                    'INTERNO': t('userManagement.roles.internals'),
                                                                    'OUTRO': t('userManagement.roles.other'),
                                                                    'UTENTE': t('userManagement.roles.userCommon')
                                                                } as Record<string, string>)[user.funcao] || user.funcao
                                                            ) : '-'}
                                                        </td>
                                                        <td className="py-2.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${user.active
                                                                ? 'bg-status-success/10 text-status-success'
                                                                : 'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                {user.active ? t('userManagement.active') : t('userManagement.pending')}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 pr-2 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                                onClick={() => handleOpenDetails(user)}
                                                                title={t('common.view')}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Employees */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-[10px] text-muted-foreground">
                                            {t('userManagement.showingUsers', {
                                                start: startIndex + 1,
                                                end: Math.min(startIndex + itemsPerPage, filteredUsers.length),
                                                total: filteredUsers.length
                                            })}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>

                    {/* Section 2: Utentes Management */}
                    <GlassCard className={`w-full p-0 overflow-hidden transition-all duration-300 ${activeTable === 'utentes' ? 'ring-2 ring-primary/30' : 'opacity-80 hover:opacity-100'}`}>
                        <button
                            onClick={() => setActiveTable('utentes')}
                            className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors ${activeTable === 'utentes' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-muted-foreground'}`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-foreground">{t('userManagement.usersTitle')}</h3>
                                </div>
                            </div>
                            {activeTable === 'utentes' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </button>

                        {activeTable === 'utentes' && (
                            <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                                {/* Search Utentes */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={t('userManagement.searchByNameOrNif')}
                                        className="h-9 pl-9 bg-card border-border text-xs"
                                        value={searchQueryUtentes}
                                        onChange={e => {
                                            setSearchQueryUtentes(e.target.value);
                                            setCurrentPageUtentes(1);
                                        }}
                                    />
                                </div>

                                {/* Utentes Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="text-xs font-medium text-muted-foreground border-b border-border/60">
                                            <tr>
                                                <th className="text-left pb-2 pl-2 font-medium">{t('requisitions.ui.name')}</th>
                                                <th className="text-left pb-2 font-medium">NIF</th>
                                                <th className="text-left pb-2 font-medium">{t('requisitions.ui.status')}</th>
                                                <th className="text-right pb-2 pr-2 font-medium">{t('userManagement.action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs">
                                            {isLoadingUtentes ? (
                                                <tr>
                                                    <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                                        {t('documents.actions.searching')}
                                                    </td>
                                                </tr>
                                            ) : filteredUtentesList.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="py-12 text-center text-muted-foreground">
                                                        {t('userManagement.noUsersFound')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentUtentes.map((utente: any, index) => (
                                                    <tr key={index} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                                                        <td className="py-2.5 pl-2 font-medium text-foreground">{utente.nome}</td>
                                                        <td className="py-2.5 text-muted-foreground">{utente.nif}</td>
                                                        <td className="py-2.5">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${utente.active
                                                                ? 'bg-status-success/10 text-status-success'
                                                                : 'bg-muted/20 text-muted-foreground'
                                                                }`}>
                                                                {utente.active ? t('userManagement.active') : t('userManagement.pending')}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 pr-2 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                                                onClick={() => handleOpenDetails(utente)}
                                                                title={t('common.view')}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Utentes */}
                                {totalPagesUtentes > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-[10px] text-muted-foreground">
                                            {t('userManagement.showingUsers', {
                                                start: startIndexUtentes + 1,
                                                end: Math.min(startIndexUtentes + itemsPerPage, filteredUtentesList.length),
                                                total: filteredUtentesList.length
                                            })}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                disabled={currentPageUtentes === 1}
                                                onClick={() => setCurrentPageUtentes(prev => prev - 1)}
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                disabled={currentPageUtentes === totalPagesUtentes}
                                                onClick={() => setCurrentPageUtentes(prev => prev + 1)}
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* User Details & Edit Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && requestClose()}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden border-border/40 gap-0 shadow-2xl">
                    {/* Premium Header Banner */}
                    <div className="bg-primary/5 border-b border-border/40 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12 blur-2xl" />

                        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <UserCircle className="w-12 h-12" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                                    <h2 className="text-2xl font-bold text-foreground">{editForm.nome}</h2>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedUser?.active
                                        ? 'bg-status-success/10 text-status-success'
                                        : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {selectedUser?.active ? t('userManagement.active') : t('userManagement.pending')}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {editForm.email}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5" />
                                        {editForm.nif}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 max-h-[60vh] bg-card">
                        <div className="p-6 space-y-6">
                            {/* Actions Banner for Pending Employees - Integrated */}
                            {selectedUser?.funcao && !selectedUser?.active && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-1 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-600">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-700">{t('userManagement.details.approveTitle')}</h4>
                                            <p className="text-[11px] text-amber-600/80">{t('userManagement.details.approveDescription')}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4"
                                        onClick={handleApproveDetail}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Check className="w-3 h-3 mr-2" />}
                                        {t('userManagement.details.approveAction')}
                                    </Button>
                                </div>
                            )}

                            {/* Section: Personal Information */}
                            <div className="space-y-4 border border-border/40 rounded-xl p-1 bg-muted/10">
                                {renderSectionHeader(t('profile.sections.personal'), <User className="w-4 h-4" />, 'personal')}

                                {expandedSections.personal && (
                                    <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('requisitions.ui.name')}</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                                                <Input
                                                    value={editForm.nome}
                                                    onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                                                    className="h-9 pl-9 text-sm bg-background border-border/60 focus:border-primary/50 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">NIF</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                                                <Input
                                                    value={editForm.nif}
                                                    readOnly
                                                    className="h-9 pl-9 text-sm bg-muted/30 cursor-not-allowed border-dashed"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('auth.birthDate')}</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                                                <Input
                                                    type="date"
                                                    value={editForm.dataNascimento}
                                                    onChange={e => setEditForm({ ...editForm, dataNascimento: e.target.value })}
                                                    className="h-9 pl-9 text-sm bg-background border-border/60"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                                                <Input
                                                    value={editForm.email}
                                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="h-9 pl-9 text-sm bg-background border-border/60"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('auth.contact')}</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                                                <Input
                                                    value={editForm.telefone}
                                                    onChange={e => setEditForm({ ...editForm, telefone: e.target.value.replace(/\D/g, '') })}
                                                    className="h-9 pl-9 text-sm bg-background border-border/60"
                                                    maxLength={9}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.profession')}</Label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/50" />
                                                <Input
                                                    value={editForm.profissao}
                                                    onChange={e => setEditForm({ ...editForm, profissao: e.target.value })}
                                                    className="h-9 pl-9 text-sm bg-background border-border/60"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Address Information */}
                            <div className="space-y-4 border border-border/40 rounded-xl p-1 bg-muted/10">
                                {renderSectionHeader(t('profile.sections.address'), <MapPin className="w-4 h-4" />, 'address')}

                                {expandedSections.address && (
                                    <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
                                        <div className="md:col-span-3 space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.address')}</Label>
                                            <Input
                                                value={editForm.morada}
                                                onChange={e => setEditForm({ ...editForm, morada: e.target.value })}
                                                className="h-9 text-sm bg-background border-border/60"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.postalCode')}</Label>
                                            <Input
                                                value={editForm.codigoPostal}
                                                onChange={e => setEditForm({ ...editForm, codigoPostal: e.target.value })}
                                                className="h-9 text-sm bg-background border-border/60"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.parish')}</Label>
                                            <Input
                                                value={editForm.freguesia}
                                                onChange={e => setEditForm({ ...editForm, freguesia: e.target.value })}
                                                className="h-9 text-sm bg-background border-border/60"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Professional Information */}
                            <div className="space-y-4 border border-border/40 rounded-xl p-1 bg-muted/10">
                                {renderSectionHeader(t('profile.sections.professional'), <Building2 className="w-4 h-4" />, 'professional')}

                                {expandedSections.professional && (
                                    <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.workLocation')}</Label>
                                            <Input
                                                value={editForm.localEmprego}
                                                onChange={e => setEditForm({ ...editForm, localEmprego: e.target.value })}
                                                className="h-9 text-sm bg-background border-border/60"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.workPhone')}</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                                                <Input
                                                    value={editForm.telefoneEmprego}
                                                    onChange={e => setEditForm({ ...editForm, telefoneEmprego: e.target.value })}
                                                    className="h-9 pl-9 text-sm bg-background border-border/60"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('profile.workAddress')}</Label>
                                            <Input
                                                value={editForm.moradaEmprego}
                                                onChange={e => setEditForm({ ...editForm, moradaEmprego: e.target.value })}
                                                className="h-9 text-sm bg-background border-border/60"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 bg-muted/30 border-t border-border/40 flex flex-row justify-end items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={requestClose}
                            className="h-9 px-4 text-xs font-semibold text-muted-foreground hover:bg-muted"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleEditSave}
                            disabled={isSaving}
                            className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                            {t('userManagement.details.saveChanges')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Existing User Dialog */}
            <AlertDialog open={showUserExistsDialog} onOpenChange={setShowUserExistsDialog}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('userManagement.userAlreadyExistsTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
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
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {t('userManagement.yesUpdateData')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* User Not Found Dialog (Recovery -> Create) */}
            <AlertDialog open={showUserNotFoundDialog} onOpenChange={setShowUserNotFoundDialog}>
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('userManagement.userNotFoundTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {t('userManagement.userNotFoundDescription', { nif: searchedNifForDialog })}
                            <br /><br />
                            {t('userManagement.askCreateNewWithNif')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUserNotFoundDialog(false)}>{t('appointmentDialog.actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCreateNew}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {t('userManagement.yesCreateNewAccount')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <UnsavedChangesModal
                isOpen={blocker.state === 'blocked' || pendingClose}
                onConfirm={() => {
                    if (blocker.state === 'blocked') blocker.proceed?.();
                    if (pendingClose) {
                        handleClose();
                    }
                }}
                onCancel={() => {
                    if (blocker.state === 'blocked') blocker.reset?.();
                    if (pendingClose) setPendingClose(false);
                }}
            />
        </div>
    );
}
