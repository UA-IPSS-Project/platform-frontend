import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    AlertTriangle, 
    Package, 
    TrendingDown,
    Filter,
    ArrowUpDown,
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

const CATEGORIES = [
    { id: 'HIGIENE', labelKey: 'consumos.categories.higiene' },
    { id: 'LAVANDARIA', labelKey: 'consumos.categories.lavandaria' },
    { id: 'DETERGENTES', labelKey: 'consumos.categories.detergentes' },
    { id: 'VESTUARIO', labelKey: 'consumos.categories.vestuario' },
    { id: 'CALCADO', labelKey: 'consumos.categories.calcado' },
];

const UNIDADES = ['un', 'L', 'pk', 'rolos', 'pares', 'caixa', 'Saco'];

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
            const matchesCategory = activeCategory === 'ALL' || item.categoria === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, activeCategory]);

    const lowStockItems = useMemo(() => items.filter(i => i.estado === 'BAIXO'), [items]);

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await armazemApi.eliminarItem(itemToDelete.id);
            toast.success(t('consumos.warehouse.toasts.deleteSuccess'));
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            setIsDeleteDialogOpen(false);
        } catch (error) {
            toast.error(t('consumos.warehouse.toasts.deleteError'));
        }
    };

    const handleSave = async () => {
        if (!editingItem?.nome || !editingItem?.categoria) {
            toast.error(t('consumos.warehouse.form.requiredFields'));
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem.id) {
                const updated = await armazemApi.atualizarItem(editingItem.id, editingItem);
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
                toast.success(t('consumos.warehouse.toasts.saveSuccess'));
            } else {
                const created = await armazemApi.criarItem(editingItem);
                setItems(prev => [...prev, created]);
                toast.success(t('consumos.warehouse.toasts.saveSuccess'));
            }
            setIsEditOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast.error(t('consumos.warehouse.toasts.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const openEdit = (item?: ItemArmazemDTO) => {
        if (item) {
            setEditingItem({ ...item });
        } else {
            setEditingItem({
                categoria: activeCategory !== 'ALL' ? activeCategory : 'HIGIENE',
                quantidade: 0,
                quantidadeMinima: 1,
                unidade: 'un',
                nome: ''
            });
        }
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t('consumos.warehouse.searchPlaceholder')}
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
                        {t('consumos.warehouse.newItem')}
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
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('consumos.warehouse.totalItems')}</p>
                        <p className="text-xl font-bold text-foreground">{items.length}</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('consumos.warehouse.lowStock')}</p>
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
                    {t('consumos.warehouse.all')}
                </Button>
                {CATEGORIES.map(cat => (
                    <Button
                        key={cat.id}
                        variant={activeCategory === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveCategory(cat.id)}
                        className="rounded-full whitespace-nowrap"
                    >
                        {t(cat.labelKey)}
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
                        <h3 className="text-lg font-medium text-foreground">{t('consumos.warehouse.noItemsFound')}</h3>
                        <p className="text-sm text-muted-foreground">{t('consumos.warehouse.tryChangingFilters')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('consumos.warehouse.table.item')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('consumos.warehouse.table.category')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">{t('consumos.warehouse.table.stock')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">{t('consumos.warehouse.table.status')}</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">{t('consumos.warehouse.table.actions')}</th>
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
                                                    <span className="font-bold text-foreground">{item.quantidade} <span className="text-xs font-normal text-muted-foreground">{item.unidade}</span></span>
                                                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                                                        <span>{t('consumos.warehouse.table.min')}: {item.quantidadeMinima}</span>
                                                        {item.marca && <span>{t('consumos.warehouse.table.marca')}: {item.marca}</span>}
                                                        {item.tamanho && <span>{t('consumos.warehouse.table.tam')}: {item.tamanho}</span>}
                                                        {item.volume && <span>{t('consumos.warehouse.table.vol')}: {item.volume}{item.unidade}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.estado === 'BAIXO' ? (
                                                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {t('consumos.warehouse.lowStock')}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 gap-1">
                                                        <Check className="w-3 h-3" />
                                                        {t('history.status.completed', 'OK')}
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
                        <DialogTitle>{editingItem?.id ? t('consumos.warehouse.editItem') : t('consumos.warehouse.createItem')}</DialogTitle>
                        <DialogDescription>
                            {t('consumos.warehouse.form.detailsDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="categoria">{t('consumos.warehouse.table.category')}</Label>
                            <Select 
                                value={editingItem?.categoria} 
                                onValueChange={(v) => setEditingItem(prev => ({...prev!, categoria: v}))}
                            >
                                <SelectTrigger id="categoria" className="bg-background border-border">
                                    <SelectValue placeholder={t('dashboard.admin.catalogs.selectCategory')} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{t(cat.labelKey)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nome">{t('consumos.warehouse.form.productName')}</Label>
                            <Input
                                id="nome"
                                value={editingItem?.nome || ''}
                                onChange={(e) => setEditingItem(prev => ({...prev!, nome: e.target.value}))}
                                placeholder="Ex: Champô"
                                className="bg-background border-border"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantidade">{t('consumos.warehouse.form.currentStock')}</Label>
                                <Input
                                    id="quantidade"
                                    type="number"
                                    value={editingItem?.quantidade || 0}
                                    onChange={(e) => setEditingItem(prev => ({...prev!, quantidade: parseInt(e.target.value) || 0}))}
                                    className="bg-background border-border"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="minimo">{t('consumos.warehouse.form.minAlert')}</Label>
                                <Input
                                    id="minimo"
                                    type="number"
                                    value={editingItem?.quantidadeMinima || 0}
                                    onChange={(e) => setEditingItem(prev => ({...prev!, quantidadeMinima: parseInt(e.target.value) || 0}))}
                                    className="bg-background border-border"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <h4 className="text-sm font-medium text-foreground/70">{t('consumos.warehouse.form.specificAttributes')}</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="marca">{t('consumos.warehouse.form.brand')}</Label>
                                    <Input
                                        id="marca"
                                        value={editingItem?.marca || ''}
                                        onChange={(e) => setEditingItem(prev => ({...prev!, marca: e.target.value}))}
                                        placeholder="Ex: Nivea"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tamanho">{t('consumos.warehouse.form.size')}</Label>
                                    <Input
                                        id="tamanho"
                                        value={editingItem?.tamanho || ''}
                                        onChange={(e) => setEditingItem(prev => ({...prev!, tamanho: e.target.value}))}
                                        placeholder="Ex: 42, XL"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="volume">{t('consumos.warehouse.form.volume')}</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        value={editingItem?.volume || ''}
                                        onChange={(e) => setEditingItem(prev => ({...prev!, volume: parseFloat(e.target.value) || undefined}))}
                                        placeholder="Ex: 500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unidade">{t('consumos.warehouse.form.unit')}</Label>
                                    <Select 
                                        value={editingItem?.unidade} 
                                        onValueChange={(v) => setEditingItem(prev => ({...prev!, unidade: v}))}
                                    >
                                        <SelectTrigger id="unidade">
                                            <SelectValue placeholder={t('common.optional')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {UNIDADES.map(u => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="descricao">{t('consumos.warehouse.form.description')}</Label>
                                <Textarea
                                    id="descricao"
                                    value={editingItem?.descricao || ''}
                                    onChange={(e) => setEditingItem(prev => ({...prev!, descricao: e.target.value}))}
                                    placeholder={t('consumos.warehouse.form.detailsPlaceholder')}
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
                            {isSaving ? t('consumos.warehouse.form.saving') : t('consumos.warehouse.form.saveChanges')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-card border-border shadow-2xl backdrop-blur-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            {t('consumos.warehouse.deleteConfirm.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground pt-2">
                            {t('consumos.warehouse.deleteConfirm.description', { name: itemToDelete?.nome })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80 border-none">
                            {t('consumos.warehouse.deleteConfirm.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                        >
                            {t('consumos.warehouse.deleteConfirm.action')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
