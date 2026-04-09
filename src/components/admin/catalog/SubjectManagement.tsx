import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Plus, Search } from 'lucide-react';
import { marcacoesApi, type Assunto } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TrashIcon } from '../../shared/CustomIcons';
import { CatalogSection } from './CatalogSection';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '../../ui/alert-dialog';
import { cn } from '../../ui/utils';
import { normalizeString, capitalizeFirstLetter } from '../../../utils/formatters';

export function SubjectManagement() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assuntos, setAssuntos] = useState<Assunto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // New Subject State
    const [novoNome, setNovoNome] = useState('');
    const [isAddFormOpen, setIsAddFormOpen] = useState(true);

    // Toggle State
    const [itemToToggle, setItemToToggle] = useState<{ id: number, novoEstado: boolean } | null>(null);
    const [showConfirmToggle, setShowConfirmToggle] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editNome, setEditNome] = useState('');

    const loadAssuntos = async () => {
        try {
            setLoading(true);
            const res = await marcacoesApi.listarAssuntosAdmin();
            setAssuntos(Array.isArray(res) ? res : []);
        } catch (error) {
            toast.error(t('dashboard.admin.assuntos.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssuntos();
    }, []);

    const handleCreate = async () => {
        if (!novoNome.trim()) {
            toast.error(t('dashboard.admin.assuntos.nameRequired'));
            return;
        }

        try {
            setSaving(true);
            await marcacoesApi.criarAssunto({
                nome: novoNome.trim(),
                ativo: true
            });

            setNovoNome('');
            await loadAssuntos();
            toast.success(t('dashboard.admin.assuntos.createSuccess'));
        } catch (error) {
            toast.error(t('dashboard.admin.assuntos.createError'));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editNome.trim()) {
            toast.error(t('dashboard.admin.assuntos.nameRequired'));
            return;
        }

        try {
            const currentItem = assuntos.find(a => a.id === id);
            await marcacoesApi.atualizarAssunto(id, {
                nome: editNome.trim(),
                ativo: currentItem?.ativo ?? true
            });
            setEditingId(null);
            await loadAssuntos();
            toast.success(t('dashboard.admin.assuntos.updateSuccess'));
        } catch (error) {
            toast.error(t('dashboard.admin.assuntos.updateError'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('dashboard.admin.assuntos.deleteConfirm'))) return;
        try {
            await marcacoesApi.apagarAssunto(id);
            await loadAssuntos();
            toast.success(t('dashboard.admin.assuntos.deleteSuccess'));
        } catch (error) {
            toast.error(t('dashboard.admin.assuntos.deleteError'));
        }
    };

    const handleToggleAtivo = async (id: number, novoEstado: boolean) => {
        if (!novoEstado) {
            setItemToToggle({ id, novoEstado });
            setShowConfirmToggle(true);
            return;
        }

        try {
            await marcacoesApi.atualizarEstadoAssunto(id, novoEstado);
            await loadAssuntos();
            toast.success(t('dashboard.admin.assuntos.activateSuccess'));
        } catch (error) {
            toast.error(t('dashboard.admin.assuntos.activateError'));
        }
    };

    const confirmToggle = async () => {
        if (!itemToToggle) return;
        try {
            await marcacoesApi.atualizarEstadoAssunto(itemToToggle.id, itemToToggle.novoEstado);
            await loadAssuntos();
            toast.success(t('dashboard.admin.assuntos.deactivateSuccess'));
        } catch (error) {
            toast.error(t('dashboard.admin.assuntos.deactivateError'));
        } finally {
            setShowConfirmToggle(false);
            setItemToToggle(null);
        }
    };

    const filteredAssuntos = useMemo(() => {
        if (!searchTerm.trim()) return assuntos;
        const normalizedSearch = normalizeString(searchTerm);
        return assuntos.filter(a => 
            normalizeString(a.nome || '').includes(normalizedSearch)
        );
    }, [assuntos, searchTerm]);

    if (loading && assuntos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse">{t('profile.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Spacer */}
            <div className="h-2" />

            <div className="flex flex-col gap-8">
                {/* Add Section */}
                <CatalogSection
                    title={t('dashboard.admin.assuntos.addTitle')}
                    isOpen={isAddFormOpen}
                    onToggle={() => setIsAddFormOpen(!isAddFormOpen)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.assuntos.fieldName')}</label>
                            <Input 
                                className="h-11 rounded-xl" 
                                placeholder="Ex: Pagar mensalidade" 
                                value={novoNome} 
                                onChange={(e) => setNovoNome(e.target.value)} 
                            />
                        </div>

                        <div>
                            <Button 
                                onClick={() => void handleCreate()} 
                                disabled={saving} 
                                className="h-11 px-8 bg-primary rounded-xl shadow-lg shadow-primary/20 gap-2 w-full lg:w-auto"
                            >
                                {saving ? t('common.saving') : <><Plus className="w-5 h-5" /> {t('dashboard.admin.assuntos.addAction')}</>}
                            </Button>
                        </div>
                    </div>
                </CatalogSection>

                {/* Search Bar - Repositioned near results */}
                <div className="max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('history.filters.searchPlaceholder')} 
                            className="pl-10 bg-background/50 backdrop-blur-sm border-border/40 focus:ring-primary/20 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h4 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">{t('dashboard.admin.assuntos.listTitle')}</h4>
                        <div className="h-px flex-1 bg-border/40" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAssuntos.map(assunto => (
                            <div 
                                key={assunto.id} 
                                className={cn(
                                    "group/item relative p-6 rounded-2xl border transition-all duration-300",
                                    !assunto.ativo && "bg-muted/30 opacity-80",
                                    editingId === assunto.id 
                                        ? "bg-primary/5 border-primary shadow-inner" 
                                        : "bg-background/40 border-border/40 hover:border-primary/40 hover:bg-muted/30"
                                )}
                            >
                                {editingId === assunto.id ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.assuntos.nameLabel')}</label>
                                            <Input 
                                                value={editNome} 
                                                onChange={(e) => setEditNome(e.target.value)} 
                                                className="h-10 bg-background" 
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
                                            <Button size="sm" onClick={() => void handleUpdate(assunto.id)}>{t('common.save')}</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold text-base block transition-colors",
                                                    assunto.ativo ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {capitalizeFirstLetter(assunto.nome)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 absolute top-4 right-4">
                                            {/* Switch Toggle */}
                                            <button
                                                onClick={() => void handleToggleAtivo(assunto.id, !assunto.ativo)}
                                                className={cn(
                                                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                                                    assunto.ativo ? "bg-primary" : "bg-muted"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                                        assunto.ativo ? "translate-x-4" : "translate-x-0"
                                                    )}
                                                />
                                            </button>

                                            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-xl border border-border/40 shadow-sm">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                                                    onClick={() => {
                                                        setEditingId(assunto.id);
                                                        setEditNome(assunto.nome);
                                                    }}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" 
                                                    onClick={() => void handleDelete(assunto.id)}
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredAssuntos.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                            <p className="text-muted-foreground font-medium">{t('history.table.noResults')}</p>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={showConfirmToggle} onOpenChange={setShowConfirmToggle}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dashboard.admin.assuntos.confirmDeactivateTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dashboard.admin.assuntos.confirmDeactivateDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToToggle(null)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => void confirmToggle()} 
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {t('dashboard.admin.assuntos.confirmDeactivateAction')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
