import { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    Package,
    TrendingDown,
    Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { GlassCard } from '../ui/glass-card';
import { toast } from 'sonner';
import { armazemApi, ItemArmazemDTO } from '../../services/api/armazem/armazemApi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

const BASE_CATEGORIES = [
    { id: 'HIGIENE', labelKey: 'consumos.categories.higiene' },
    { id: 'DETERGENTES', labelKey: 'consumos.categories.detergentes' },
    { id: 'VESTUARIO', labelKey: 'consumos.categories.vestuario' },
    { id: 'CALCADO', labelKey: 'consumos.categories.calcado' },
];

const UNIDADES = ['un', 'L', 'pk', 'rolos', 'pares', 'caixa', 'saco'];

export function WarehouseManagement() {
    const { t } = useTranslation();
    const [items, setItems] = useState<ItemArmazemDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ItemArmazemDTO | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ItemArmazemDTO> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const categories = useMemo(() => {
        const itemCategories = Array.from(new Set(items.map(i => i.categoria.toUpperCase())));
        const baseIds = BASE_CATEGORIES.map(bc => bc.id);

        // Merge base categories with any other categories found in items
        const allCategories = [...BASE_CATEGORIES];
        itemCategories.forEach(cat => {
            if (!baseIds.includes(cat)) {
                allCategories.push({ id: cat, labelKey: '' });
            }
        });
        return allCategories.sort((a, b) => {
            if (a.id === 'CALCADO') return 1;
            if (b.id === 'CALCADO') return -1;
            return a.id.localeCompare(b.id);
        });
    }, [items]);

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const data = await armazemApi.listarTodos();
            setItems(data);
        } catch (error) {
            toast.error(t('consumos.loadError', 'Erro ao carregar itens do armazém'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.categoria.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'ALL' || item.categoria.toUpperCase() === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, activeCategory]);

    const lowStockItems = useMemo(() => items.filter(i => i.estado === 'BAIXO'), [items]);

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await armazemApi.eliminarItem(itemToDelete.id);
            toast.success(t('consumos.inventory.toasts.deleteSuccess'));
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            setIsDeleteDialogOpen(false);
        } catch (error) {
            toast.error(t('consumos.inventory.toasts.deleteError'));
        }
    };

    const handleSave = async () => {
        if (!editingItem?.nome || !editingItem?.categoria) {
            toast.error(t('consumos.inventory.form.requiredFields'));
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem.id) {
                const updated = await armazemApi.atualizarItem(editingItem.id, editingItem);
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
                toast.success(t('consumos.inventory.toasts.saveSuccess'));
            } else {
                const created = await armazemApi.criarItem(editingItem);
                setItems(prev => [...prev, created]);
                toast.success(t('consumos.inventory.toasts.saveSuccess'));
            }
            setIsEditOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast.error(t('consumos.inventory.toasts.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const openEdit = (item?: ItemArmazemDTO) => {
        if (item) {
            setEditingItem({ ...item });
        } else {
            setEditingItem({
                categoria: activeCategory !== 'ALL' ? activeCategory : (categories[0]?.id || 'HIGIENE'),
                quantidade: 0,
                quantidadeMinima: 1,
                unidade: 'un',
                nome: ''
            });
            setIsAddingNewCategory(false);
            setNewCategoryName('');
        }
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('consumos.inventory.searchPlaceholder')}
                        className="pl-9 bg-background border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        onClick={() => openEdit()}
                        className="flex-1 sm:flex-none gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4" />
                        {t('consumos.inventory.newItem')}
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('consumos.inventory.totalItems')}</p>
                        <p className="text-xl font-bold text-foreground">{items.length}</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('consumos.inventory.lowStock')}</p>
                        <p className="text-xl font-bold text-foreground">{lowStockItems.length}</p>
                    </div>
                </GlassCard>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <Button
                    variant={activeCategory === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('ALL')}
                    className="rounded-full"
                >
                    {t('consumos.inventory.all')}
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={activeCategory === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat.id)}
                        className="rounded-full whitespace-nowrap"
                    >
                        {cat.labelKey ? t(cat.labelKey) : cat.id}
                    </Button>
                ))}
            </div>

            {/* Items Table/List */}
            <GlassCard className="overflow-hidden border-border bg-card/30">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium text-foreground">{t('consumos.inventory.noItemsFound')}</h3>
                        <p className="text-sm text-muted-foreground">{t('consumos.inventory.tryChangingFilters')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('consumos.inventory.table.item')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('consumos.inventory.table.category')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">{t('consumos.inventory.table.stock')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">{t('consumos.inventory.table.status')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">{t('consumos.inventory.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filteredItems.map((item) => (
                                        <motion.tr
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{item.nome}</span>
                                                    <span className="text-xs text-muted-foreground">ID: #{item.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                                                    {t(`consumos.categories.${item.categoria.toLowerCase()}`, item.categoria)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-foreground">{item.quantidade} <span className="text-xs font-normal text-muted-foreground">{t(`consumos.units.${item.unidade}`, item.unidade)}</span></span>
                                                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                                                        <span>{t('consumos.inventory.table.min')}: {item.quantidadeMinima}</span>
                                                        {item.marca && <span>{t('consumos.inventory.table.marca')}: {item.marca}</span>}
                                                        {item.tamanho && <span>{t('consumos.inventory.table.tam')}: {item.tamanho}</span>}
                                                        {item.volume && <span>{t('consumos.inventory.table.vol')}: {item.volume}{t(`consumos.units.${item.unidade}`, item.unidade)}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.estado === 'BAIXO' ? (
                                                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {t('consumos.inventory.lowStock')}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 gap-1">
                                                        <Check className="w-3 h-3" />
                                                        {t('common.ok', 'Ok')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        onClick={() => openEdit(item)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            setItemToDelete(item);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Edit/Create Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-border max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem?.id ? t('consumos.inventory.editItem') : t('consumos.inventory.createItem')}</DialogTitle>
                        <DialogDescription>
                            {t('consumos.inventory.form.detailsDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="categoria">{t('consumos.inventory.table.category')}</Label>
                            <Select
                                value={isAddingNewCategory ? 'NEW' : editingItem?.categoria}
                                onValueChange={(v) => {
                                    if (v === 'NEW') {
                                        setIsAddingNewCategory(true);
                                    } else {
                                        setIsAddingNewCategory(false);
                                        setEditingItem(prev => ({ ...prev!, categoria: v }));
                                    }
                                }}
                            >
                                <SelectTrigger id="categoria" className="bg-background border-border">
                                    <SelectValue placeholder={t('dashboard.admin.catalogs.selectCategory')} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.labelKey ? t(cat.labelKey) : cat.id}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="NEW" className="text-primary font-medium opacity-80 italic">
                                        + {t('common.add')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isAddingNewCategory && (
                            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="newCategory">{t('dashboard.admin.catalogs.newCategoryName', 'Nome da Nova Categoria')}</Label>
                                <Input
                                    id="newCategory"
                                    value={newCategoryName}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setNewCategoryName(val);
                                        setEditingItem(prev => ({ ...prev!, categoria: val }));
                                    }}
                                    placeholder="Ex: Primeiros Socorros"
                                    className="bg-background border-border font-bold uppercase tracking-wider"
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="nome">{t('consumos.inventory.form.productName')}</Label>
                            <Input
                                id="nome"
                                value={editingItem?.nome || ''}
                                onChange={(e) => setEditingItem(prev => ({ ...prev!, nome: e.target.value }))}
                                placeholder="Ex: Champô"
                                className="bg-background border-border"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantidade">{t('consumos.inventory.form.currentStock')}</Label>
                                <Input
                                    id="quantidade"
                                    type="number"
                                    value={editingItem?.quantidade || 0}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev!, quantidade: parseInt(e.target.value) || 0 }))}
                                    className="bg-background border-border"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="minimo">{t('consumos.inventory.form.minAlert')}</Label>
                                <Input
                                    id="minimo"
                                    type="number"
                                    value={editingItem?.quantidadeMinima || 0}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev!, quantidadeMinima: parseInt(e.target.value) || 0 }))}
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <h4 className="text-sm font-medium text-foreground/70">{t('consumos.inventory.form.specificAttributes')}</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="marca">{t('consumos.inventory.form.brand')}</Label>
                                    <Input
                                        id="marca"
                                        value={editingItem?.marca || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev!, marca: e.target.value }))}
                                        placeholder="Ex: Nivea"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tamanho">{t('consumos.inventory.form.size')}</Label>
                                    <Input
                                        id="tamanho"
                                        value={editingItem?.tamanho || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev!, tamanho: e.target.value }))}
                                        placeholder="Ex: 42, XL"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="volume">{t('consumos.inventory.form.volume')}</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        value={editingItem?.volume || ''}
                                        onChange={(e) => setEditingItem(prev => ({ ...prev!, volume: parseFloat(e.target.value) || undefined }))}
                                        placeholder="Ex: 500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unidade">{t('consumos.inventory.form.unit')}</Label>
                                    <Select
                                        value={editingItem?.unidade}
                                        onValueChange={(v) => setEditingItem(prev => ({ ...prev!, unidade: v }))}
                                    >
                                        <SelectTrigger id="unidade">
                                            <SelectValue placeholder={t('common.optional')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UNIDADES.map(u => (
                                                <SelectItem key={u} value={u}>{t(`consumos.units.${u.toLowerCase()}`, u)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descricao">{t('consumos.inventory.form.description')}</Label>
                                <Textarea
                                    id="descricao"
                                    value={editingItem?.descricao || ''}
                                    onChange={(e) => setEditingItem(prev => ({ ...prev!, descricao: e.target.value }))}
                                    placeholder={t('consumos.inventory.form.detailsPlaceholder')}
                                    className="resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isSaving ? t('consumos.inventory.form.saving') : t('consumos.inventory.form.saveChanges')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-card/90 border-border shadow-2xl backdrop-blur-xl max-w-md ring-1 ring-primary/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-destructive/60 to-primary/60" />
                    
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <div className="p-3 rounded-2xl bg-destructive/10 text-destructive shadow-inner">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            {t('consumos.inventory.deleteConfirm.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground pt-4 text-lg leading-relaxed">
                            <Trans
                                i18nKey="consumos.inventory.deleteConfirm.description"
                                values={{ name: itemToDelete?.nome }}
                                components={[<span key="0" />, <strong key="1" className="text-foreground font-extrabold" />]}
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <AlertDialogFooter className="pt-8 gap-3">
                        <AlertDialogCancel className="bg-muted/50 hover:bg-muted border-border/40 text-muted-foreground hover:text-foreground transition-all h-12 px-6 rounded-2xl font-medium">
                            {t('consumos.inventory.deleteConfirm.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/30 h-12 px-8 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('consumos.inventory.deleteConfirm.action')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
