import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Plus, Search } from 'lucide-react';
import { 
  MaterialCategoria, 
  requisicoesApi, 
  type MaterialCatalogo 
} from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TrashIcon } from '../../shared/CustomIcons';
import { CatalogSection } from './CatalogSection';
import { cn } from '../../ui/utils';

const DEFAULT_ATTRIBUTES = ['Formato', 'Cor', 'Dureza', 'Espessura', 'Tipo', 'Largura', 'Comprimento', 'Concentração', 'Capacidade', 'Aroma'];

interface MaterialCatalogProps {
  materiais: MaterialCatalogo[];
  onRefresh: () => Promise<void>;
  formatCategoryName: (name: string) => string;
}

export function MaterialCatalog({ materiais, onRefresh, formatCategoryName }: MaterialCatalogProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ '__ADD_FORM__': true });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // New Item State
  const [novoNome, setNovoNome] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<MaterialCategoria>('OUTROS');
  const [novoAtributo, setNovoAtributo] = useState('');
  const [novoValorAtributo, setNovoValorAtributo] = useState('');
  const [categoryMode, setCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [customCategory, setCustomCategory] = useState('');
  
  // Quick Category Add
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newQuickCategory, setNewQuickCategory] = useState('');

  // Edit State
  const [editNome, setEditNome] = useState('');
  const [editAtributo, setEditAtributo] = useState('');
  const [editValorAtributo, setEditValorAtributo] = useState('');

  const uniqueCategorias = Array.from(new Set(materiais.map(m => m.categoria).filter((c): c is string => !!c)));

  const handleCreate = async () => {
    if (!novoNome.trim()) {
      toast.error(t('dashboard.admin.catalogs.errors.requiredFields'));
      return;
    }

    try {
      const categoriaFinal = (categoryMode === 'NEW' ? customCategory : novaCategoria).trim();
      if (!categoriaFinal) {
        toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
        return;
      }

      setSaving(true);
      await requisicoesApi.criarMaterialCatalogo({
        nome: novoNome.trim(),
        categoria: categoriaFinal,
        atributo: novoAtributo.trim(),
        valorAtributo: novoValorAtributo.trim(),
      });

      setNovoNome('');
      setCustomCategory('');
      setCategoryMode('SELECT');
      setNovoAtributo('');
      setNovoValorAtributo('');
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.materialCreated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCategoryCreate = async () => {
    if (!newQuickCategory.trim()) return;
    try {
      setSaving(true);
      await requisicoesApi.criarMaterialCatalogo({
        nome: 'GERAL',
        categoria: newQuickCategory.trim().toUpperCase(),
        atributo: 'TIPO',
        valorAtributo: 'GERAL'
      });
      setNewQuickCategory('');
      setShowAddCategory(false);
      await onRefresh();
      toast.success("Categoria de material criada com sucesso!");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao criar categoria");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, categoria: string) => {
    try {
      await requisicoesApi.atualizarMaterialCatalogo(id, {
        nome: editNome,
        categoria: categoria,
        atributo: editAtributo,
        valorAtributo: editValorAtributo,
      });
      setEditingId(null);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.materialUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteMaterial'))) return;
    try {
      await requisicoesApi.apagarMaterialCatalogo(id);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.materialDeleted'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteCategory', { name: formatCategoryName(category) }))) return;
    try {
      const itemsToDelete = materiais.filter(m => m.categoria === category);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarMaterialCatalogo(i.id)));
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.categoryRemoved'));
    } catch (error) {
      toast.error(t('dashboard.admin.catalogs.errors.loadMaterials'));
    }
  };

  const toggleGroup = (categoria: string) => {
    setOpenGroups(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search and Quick Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar materiais..." 
              className="pl-10 bg-background/50 backdrop-blur-sm border-border/40 focus:ring-primary/20"
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant={showAddCategory ? "default" : "outline"} 
              className="flex-1 md:flex-none gap-2"
              onClick={() => setShowAddCategory(!showAddCategory)}
            >
              <Plus className="h-4 w-4" /> {showAddCategory ? "Cancelar" : "Nova Categoria"}
            </Button>
         </div>
      </div>

      {showAddCategory && (
        <CatalogSection
            title="Adicionar Nova Categoria de Material"
            isOpen={true}
            onToggle={() => setShowAddCategory(false)}
        >
            <div className="max-w-md mx-auto space-y-4 text-center py-4">
                <p className="text-sm text-muted-foreground">Será criado um item 'GERAL' predefinido nesta categoria.</p>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Nome da categoria (ex: PAPELARIA)" 
                        value={newQuickCategory} 
                        onChange={(e) => setNewQuickCategory(e.target.value.toUpperCase())}
                        className="h-11"
                    />
                    <Button onClick={handleQuickCategoryCreate} disabled={saving} className="h-11 px-8">Criar</Button>
                </div>
            </div>
        </CatalogSection>
      )}

      {/* Main Content Flow: Vertical (Cima e Baixo) */}
      <div className="flex flex-col gap-8">
        {/* Add Section - Collapsible */}
        <CatalogSection
          title={t('dashboard.admin.catalogs.addMaterial')}
          isOpen={!!openGroups['__ADD_FORM__']}
          onToggle={() => setOpenGroups(prev => ({ ...prev, '__ADD_FORM__': !prev['__ADD_FORM__'] }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.category')}</label>
              <select 
                value={categoryMode === 'NEW' ? 'NEW' : novaCategoria} 
                onChange={(e) => {
                  if (e.target.value === 'NEW') setCategoryMode('NEW');
                  else { setCategoryMode('SELECT'); setNovaCategoria(e.target.value as MaterialCategoria); }
                }} 
                className="w-full h-11 rounded-xl border border-border/40 bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {uniqueCategorias.length === 0 && <option value="">Nenhuma categoria</option>}
                {uniqueCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                <option value="NEW" className="font-bold text-primary">-- {t('dashboard.admin.catalogs.newCategory')} --</option>
              </select>
              {categoryMode === 'NEW' && (
                <Input 
                  placeholder="Nome da nova categoria" 
                  className="mt-2 h-11 rounded-xl" 
                  value={customCategory} 
                  onChange={(e) => setCustomCategory(e.target.value)} 
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.materialName')}</label>
              <Input className="h-11 rounded-xl" placeholder="Ex: Cadernos, Tesoura..." value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.attribute')}</label>
              <Input className="h-11 rounded-xl" placeholder="Ex: Formato, Cor..." list="default-attributes" value={novoAtributo} onChange={(e) => setNovoAtributo(e.target.value)} />
              <datalist id="default-attributes">
                {DEFAULT_ATTRIBUTES.map(attr => <option key={attr} value={attr} />)}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.value')}</label>
              <div className="flex gap-2">
                <Input className="h-11 rounded-xl flex-1" placeholder="Ex: A4, Azul..." value={novoValorAtributo} onChange={(e) => setNovoValorAtributo(e.target.value)} />
                <Button 
                  onClick={() => void handleCreate()} 
                  disabled={saving} 
                  className="h-11 px-6 bg-primary rounded-xl shadow-lg shadow-primary/20"
                >
                  {saving ? '...' : <Plus className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </CatalogSection>

        {/* Categories List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h4 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Categorias Existentes</h4>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {uniqueCategorias.map(cat => {
            const items = materiais.filter(m => m.categoria === cat);
            return (
              <CatalogSection
                key={cat}
                title={formatCategoryName(cat)}
                count={items.length}
                isOpen={!!openGroups[cat]}
                onToggle={() => toggleGroup(cat)}
                onDeleteCategory={() => void handleDeleteCategory(cat)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "group/item relative p-4 rounded-2xl border transition-all duration-300",
                        editingId === item.id 
                          ? "bg-primary/5 border-primary shadow-inner" 
                          : "bg-background/40 border-border/40 hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      {editingId === item.id ? (
                        <div className="space-y-3">
                          <Input 
                            value={editNome} 
                            onChange={(e) => setEditNome(e.target.value)} 
                            className="h-10 bg-background" 
                            placeholder="Nome"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input 
                              value={editAtributo} 
                              onChange={(e) => setEditAtributo(e.target.value)} 
                              className="h-9" 
                              placeholder="Atributo"
                              list="default-attributes"
                            />
                            <Input 
                              value={editValorAtributo} 
                              onChange={(e) => setEditValorAtributo(e.target.value)} 
                              className="h-9" 
                              placeholder="Valor"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button size="sm" variant="ghost" className="rounded-lg h-9" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
                            <Button size="sm" className="rounded-lg h-9 shadow-md" onClick={() => void handleUpdate(item.id, cat)}>{t('common.ok')}</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="font-bold text-base text-foreground block">{item.nome}</span>
                            {(item.atributo || item.valorAtributo) && (
                              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                                {item.atributo ? item.atributo + ': ' : ''}{item.valorAtributo || ''}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" 
                              onClick={() => {
                                setEditingId(item.id);
                                setEditNome(item.nome || '');
                                setEditAtributo(item.atributo || '');
                                setEditValorAtributo(item.valorAtributo || '');
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors" 
                              onClick={() => void handleDelete(item.id)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CatalogSection>
            );
          })}
          {uniqueCategorias.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
              <p className="text-muted-foreground font-medium">Nenhum material cadastrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
