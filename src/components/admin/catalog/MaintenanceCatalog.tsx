import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Plus, Search, MapPin, CheckSquare, Layers } from 'lucide-react';
import { 
  requisicoesApi, 
  type ManutencaoItem 
} from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TrashIcon } from '../../shared/CustomIcons';
import { CatalogSection } from './CatalogSection';

interface MaintenanceCatalogProps {
  items: ManutencaoItem[];
  onRefresh: () => Promise<void>;
  formatCategoryName: (name: string) => string;
}

export function MaintenanceCatalog({ items, onRefresh, formatCategoryName }: MaintenanceCatalogProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  
  // Category Mode for adding new categories
  const [categoryMode, setCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [customCategory, setCustomCategory] = useState('');

  // Local actions state
  const [novoEspaco, setNovoEspaco] = useState('');
  const [novoElemento, setNovoElemento] = useState('');
  const [editingSpace, setEditingSpace] = useState<{ category: string; name: string } | null>(null);
  const [editSpaceName, setEditSpaceName] = useState('');
  const [editingElement, setEditingElement] = useState<{ category: string; name: string } | null>(null);
  const [editElementName, setEditElementName] = useState('');

  const uniqueCategorias = Array.from(new Set(items.map(m => m.categoria).filter((c): c is string => !!c)));

  const handleCreateSpace = async (categoria: string) => {
    if (!novoEspaco.trim()) {
      toast.error("O nome do espaço é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      const elements = Array.from(new Set(items.filter(i => i.categoria === categoria).map(i => i.itemVerificacao)));
      const toCreate = elements.length > 0 ? elements : ['GERAL'];
      
      await Promise.all(toCreate.map(el => 
        requisicoesApi.criarManutencaoItem({ 
          categoria, 
          espaco: novoEspaco.trim(), 
          itemVerificacao: el 
        })
      ));

      setNovoEspaco('');
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.spaceCreated'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateElement = async (categoria: string) => {
    if (!novoElemento.trim()) {
      toast.error("O nome do elemento é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      const spaces = Array.from(new Set(items.filter(i => i.categoria === categoria).map(i => i.espaco)));
      const toCreate = spaces.length > 0 ? spaces : ['GERAL'];
      
      await Promise.all(toCreate.map(sp => 
        requisicoesApi.criarManutencaoItem({ 
          categoria, 
          espaco: sp, 
          itemVerificacao: novoElemento.trim() 
        })
      ));

      setNovoElemento('');
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.elementCreated'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSpace = async (category: string, oldName: string) => {
    if (!editSpaceName.trim() || oldName === editSpaceName.trim()) {
      setEditingSpace(null);
      return;
    }
    try {
      const itemsToUpdate = items.filter(i => i.categoria === category && i.espaco === oldName);
      await Promise.all(itemsToUpdate.map(i => 
        requisicoesApi.atualizarManutencaoItem(i.id, {
          categoria: i.categoria,
          espaco: editSpaceName.trim(),
          itemVerificacao: i.itemVerificacao,
        })
      ));
      setEditingSpace(null);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.spaceUpdated'));
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleUpdateElement = async (category: string, oldName: string) => {
    if (!editElementName.trim() || oldName === editElementName.trim()) {
      setEditingElement(null);
      return;
    }
    try {
      const itemsToUpdate = items.filter(i => i.categoria === category && i.itemVerificacao === oldName);
      await Promise.all(itemsToUpdate.map(i => 
        requisicoesApi.atualizarManutencaoItem(i.id, {
          categoria: i.categoria,
          espaco: i.espaco,
          itemVerificacao: editElementName.trim(),
        })
      ));
      setEditingElement(null);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.elementUpdated'));
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleDeleteSpace = async (category: string, name: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteSpace', { name }))) return;
    try {
      const itemsToDelete = items.filter(i => i.categoria === category && i.espaco === name);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.spaceDeleted'));
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleDeleteElement = async (category: string, name: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteElement', { name }))) return;
    try {
      const itemsToDelete = items.filter(i => i.categoria === category && i.itemVerificacao === name);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.elementDeleted'));
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteCategory', { name: formatCategoryName(category) }))) return;
    try {
      const itemsToDelete = items.filter(m => m.categoria === category);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.categoryRemoved'));
    } catch (error) {
      toast.error(t('dashboard.admin.catalogs.errors.loadMaterials'));
    }
  };

  const toggleGroup = (categoria: string) => {
    setOpenGroups(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  const handleCreateNewCategory = async () => {
    if (!customCategory.trim()) return;
    try {
      setSaving(true);
      await requisicoesApi.criarManutencaoItem({
        categoria: customCategory.trim(),
        espaco: 'GERAL',
        itemVerificacao: 'GERAL'
      });
      setCustomCategory('');
      setCategoryMode('SELECT');
      await onRefresh();
      toast.success("Categoria criada com sucesso!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar verificações..." 
              className="pl-10 bg-background/50 backdrop-blur-sm border-border/40"
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-xl border-primary/20 bg-primary/5">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">{uniqueCategorias.length} Categorias</span>
            </div>
            <Button 
                onClick={() => setCategoryMode(categoryMode === 'NEW' ? 'SELECT' : 'NEW')} 
                variant={categoryMode === 'NEW' ? 'default' : 'outline'}
                className="gap-2"
            >
              <Plus className="h-4 w-4" /> {categoryMode === 'NEW' ? 'Cancelar' : 'Nova Categoria'}
            </Button>
         </div>
      </div>

      {categoryMode === 'NEW' && (
        <CatalogSection
            title="Criar Nova Categoria"
            isOpen={true}
            onToggle={() => setCategoryMode('SELECT')}
        >
            <div className="max-w-md mx-auto space-y-4 text-center py-4">
                <p className="text-sm text-muted-foreground">Isso criará uma nova categoria com itens 'GERAL' por padrão.</p>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Nome da categoria (ex: ELETRICIDADE)" 
                        value={customCategory} 
                        onChange={(e) => setCustomCategory(e.target.value.toUpperCase())}
                        className="h-11"
                    />
                    <Button onClick={handleCreateNewCategory} disabled={saving} className="h-11 px-8">Confirmar</Button>
                </div>
            </div>
        </CatalogSection>
      )}

      <div className="space-y-6">
        {uniqueCategorias.map(cat => {
          const categoryItems = items.filter(m => m.categoria === cat);
          const spaces = Array.from(new Set(categoryItems.map(i => i.espaco))).sort();
          const elements = Array.from(new Set(categoryItems.map(i => i.itemVerificacao))).sort();
          
          return (
            <CatalogSection
              key={cat}
              title={formatCategoryName(cat)}
              isOpen={!!openGroups[cat]}
              onToggle={() => toggleGroup(cat)}
              onDeleteCategory={() => void handleDeleteCategory(cat)}
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Spaces Management */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                         <MapPin className="w-5 h-5 text-primary" />
                         <h4 className="font-bold text-base uppercase tracking-wider">{t('dashboard.admin.catalogs.spaces')}</h4>
                      </div>
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Total: {spaces.length}</span>
                   </div>

                   <div className="space-y-3">
                      <div className="flex gap-2">
                         <Input 
                            placeholder="Adicionar novo espaço..." 
                            value={novoEspaco} 
                            onChange={(e) => setNovoEspaco(e.target.value)}
                            className="h-10 text-sm bg-background/50"
                         />
                         <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => handleCreateSpace(cat)}>
                            <Plus className="w-5 h-5" />
                         </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {spaces.map(space => (
                            <div key={space} className="group relative flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/20 hover:bg-background/40 hover:border-primary/20 transition-all">
                               {editingSpace?.category === cat && editingSpace.name === space ? (
                                 <Input 
                                    value={editSpaceName} 
                                    onChange={(e) => setEditSpaceName(e.target.value)} 
                                    className="h-8 text-sm" 
                                    autoFocus 
                                    onBlur={() => void handleUpdateSpace(cat, space)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateSpace(cat, space)}
                                 />
                               ) : (
                                 <>
                                    <span className="text-sm font-medium">{space}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => { setEditingSpace({category: cat, name: space}); setEditSpaceName(space); }}>
                                          <Pencil className="w-3 h-3" />
                                       </Button>
                                       <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive" onClick={() => void handleDeleteSpace(cat, space)}>
                                          <TrashIcon className="w-3 h-3" />
                                       </Button>
                                    </div>
                                 </>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Elements Management */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                         <CheckSquare className="w-5 h-5 text-primary" />
                         <h4 className="font-bold text-base uppercase tracking-wider">{t('dashboard.admin.catalogs.elements')}</h4>
                      </div>
                      <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Total: {elements.length}</span>
                   </div>

                   <div className="space-y-3">
                      <div className="flex gap-2">
                         <Input 
                            placeholder="Adicionar novo elemento..." 
                            value={novoElemento} 
                            onChange={(e) => setNovoElemento(e.target.value)}
                            className="h-10 text-sm bg-background/50"
                         />
                         <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => handleCreateElement(cat)}>
                            <Plus className="w-5 h-5" />
                         </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {elements.map(el => (
                            <div key={el} className="group relative flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/20 hover:bg-background/40 hover:border-primary/20 transition-all">
                               {editingElement?.category === cat && editingElement.name === el ? (
                                 <Input 
                                    value={editElementName} 
                                    onChange={(e) => setEditElementName(e.target.value)} 
                                    className="h-8 text-sm" 
                                    autoFocus 
                                    onBlur={() => void handleUpdateElement(cat, el)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateElement(cat, el)}
                                 />
                               ) : (
                                 <>
                                    <span className="text-sm font-medium">{el}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => { setEditingElement({category: cat, name: el}); setEditElementName(el); }}>
                                          <Pencil className="w-3 h-3" />
                                       </Button>
                                       <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive" onClick={() => void handleDeleteElement(cat, el)}>
                                          <TrashIcon className="w-3 h-3" />
                                       </Button>
                                    </div>
                                 </>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            </CatalogSection>
          );
        })}
      </div>
    </div>
  );
}
