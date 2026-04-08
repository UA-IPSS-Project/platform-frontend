import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Truck, Info, Calendar } from 'lucide-react';
import { 
  TransporteCategoria, 
  requisicoesApi, 
  type TransporteCatalogo 
} from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TrashIcon } from '../../shared/CustomIcons';
import { CatalogSection } from './CatalogSection';
import { cn } from '../../ui/utils';
import { DatePickerField } from '../../ui/date-picker-field';

interface TransportCatalogProps {
  transportes: TransporteCatalogo[];
  onRefresh: () => Promise<void>;
  formatCategoryName: (name: string) => string;
}

export function TransportCatalog({ transportes, onRefresh, formatCategoryName }: TransportCatalogProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ '__ADD_FORM__': true });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // New Item State
  const [novoTipo, setNovoTipo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<TransporteCategoria>('LIGEIRO');
  const [novaMatricula, setNovaMatricula] = useState('');
  const [novaMarca, setNovaMarca] = useState('');
  const [novoModelo, setNovoModelo] = useState('');
  const [novaLotacao, setNovaLotacao] = useState('');
  const [novaDataMatricula, setNovaDataMatricula] = useState('');
  const [categoryMode, setCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [customCategory, setCustomCategory] = useState('');

  // Edit State
  const [editTipo, setEditTipo] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editLotacao, setEditLotacao] = useState('');
  const [editDataMatricula, setEditDataMatricula] = useState('');

  const uniqueCategorias = Array.from(new Set(transportes.map(t => t.categoria).filter((c): c is string => !!c)));

  const nextCode = useMemo(() => {
    const codigosExistentes = transportes.map(t => t.codigo).filter((c): c is string => !!c);
    let maxNum = 0;
    codigosExistentes.forEach(codigo => {
      const match = /^V(\d{2})$/.exec(codigo);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `V${String(maxNum + 1).padStart(2, '0')}`;
  }, [transportes]);

  const handleCreate = async () => {
    if (!novoTipo.trim() || !novaMatricula.trim() || !novaMarca.trim() || !novoModelo.trim() || !novaLotacao.trim() || !novaDataMatricula) {
      toast.error(t('dashboard.admin.catalogs.errors.requiredFields'));
      return;
    }

    const lotacaoNum = Number(novaLotacao);
    if (!Number.isFinite(lotacaoNum) || lotacaoNum <= 0) {
      toast.error(t('dashboard.admin.catalogs.errors.capacityPositive'));
      return;
    }

    try {
      const categoriaFinal = (categoryMode === 'NEW' ? customCategory : novaCategoria).trim();
      if (!categoriaFinal) {
        toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
        return;
      }

      setSaving(true);
      await requisicoesApi.criarTransporteCatalogo({
        codigo: nextCode,
        tipo: novoTipo.trim(),
        categoria: categoriaFinal,
        matricula: novaMatricula.trim().toUpperCase(),
        marca: novaMarca.trim(),
        modelo: novoModelo.trim(),
        lotacao: lotacaoNum,
        dataMatricula: novaDataMatricula,
      });

      setNovoTipo('');
      setCustomCategory('');
      setCategoryMode('SELECT');
      setNovaMatricula('');
      setNovaMarca('');
      setNovoModelo('');
      setNovaLotacao('');
      setNovaDataMatricula('');
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.transportCreated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, categoria: string, codigo: string) => {
    try {
      await requisicoesApi.atualizarTransporteCatalogo(id, {
        codigo,
        tipo: editTipo,
        categoria,
        matricula: editMatricula,
        marca: editMarca,
        modelo: editModelo,
        lotacao: Number(editLotacao),
        dataMatricula: editDataMatricula,
      });
      setEditingId(null);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.transportUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteTransport'))) return;
    try {
      await requisicoesApi.apagarTransporteCatalogo(id);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.transportDeleted'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteCategory', { name: formatCategoryName(category) }))) return;
    try {
      const itemsToDelete = transportes.filter(t => t.categoria === category);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarTransporteCatalogo(i.id)));
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.categoryRemoved'));
    } catch (error) {
      toast.error(t('dashboard.admin.catalogs.errors.loadTransports'));
    }
  };

  const toggleGroup = (categoria: string) => {
    setOpenGroups(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar veículos (matrícula, marca...)" 
              className="pl-10 bg-background/50 backdrop-blur-sm border-border/40"
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none gap-2">
              <Truck className="h-4 w-4" /> Frota Total: {transportes.length}
            </Button>
         </div>
      </div>

      {/* Vertical Flow Content */}
      <div className="flex flex-col gap-8">
        {/* Add Section - Collapsible */}
        <CatalogSection
          title={t('dashboard.admin.catalogs.addTransport')}
          isOpen={!!openGroups['__ADD_FORM__']}
          onToggle={() => setOpenGroups(prev => ({ ...prev, '__ADD_FORM__': !prev['__ADD_FORM__'] }))}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">Próximo Código</label>
              <Input value={nextCode} readOnly disabled className="h-11 rounded-xl bg-muted/30 font-mono font-bold text-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.type')}</label>
              <Input className="h-11 rounded-xl" value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.category')}</label>
              <select 
                value={categoryMode === 'NEW' ? 'NEW' : novaCategoria} 
                onChange={(e) => {
                  if (e.target.value === 'NEW') setCategoryMode('NEW');
                  else { setCategoryMode('SELECT'); setNovaCategoria(e.target.value as TransporteCategoria); }
                }} 
                className="w-full h-11 rounded-xl border border-border/40 bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {uniqueCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                <option value="NEW" className="font-bold text-primary">-- {t('dashboard.admin.catalogs.newCategory')} --</option>
              </select>
              {categoryMode === 'NEW' && <Input placeholder="Nova categoria" className="mt-2 h-11 rounded-xl" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.plate')}</label>
              <Input className="h-11 rounded-xl font-mono uppercase" placeholder="XX-00-XX" value={novaMatricula} onChange={(e) => setNovaMatricula(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.brand')}</label>
              <Input className="h-11 rounded-xl" value={novaMarca} onChange={(e) => setNovaMarca(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.model')}</label>
              <Input className="h-11 rounded-xl" value={novoModelo} onChange={(e) => setNovoModelo(e.target.value)} />
            </div>

            <div className="space-y-2 text-center md:text-left">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.capacity')}</label>
              <Input type="number" className="h-11 rounded-xl" value={novaLotacao} onChange={(e) => setNovaLotacao(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.regDate')}</label>
              <DatePickerField value={novaDataMatricula} onChange={setNovaDataMatricula} />
            </div>

            <Button 
              onClick={() => void handleCreate()} 
              disabled={saving} 
              className="h-11 w-full bg-primary rounded-xl shadow-lg shadow-primary/20 text-base font-semibold"
            >
              {saving ? '...' : <Plus className="w-5 h-5" />}
            </Button>
          </div>
        </CatalogSection>

        {/* Categories List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h4 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Frotas por Categoria</h4>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {uniqueCategorias.map(cat => {
            const items = transportes.filter(t => t.categoria === cat);
            return (
              <CatalogSection
                key={cat}
                title={formatCategoryName(cat)}
                count={items.length}
                isOpen={!!openGroups[cat]}
                onToggle={() => toggleGroup(cat)}
                onDeleteCategory={() => void handleDeleteCategory(cat)}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "group/item relative p-5 rounded-2xl border transition-all duration-300",
                        editingId === item.id 
                          ? "bg-primary/5 border-primary shadow-inner" 
                          : "bg-background/40 border-border/40 hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      {editingId === item.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={editMatricula} onChange={(e) => setEditMatricula(e.target.value.toUpperCase())} className="h-10 font-mono" placeholder="Matrícula" />
                            <Input value={editTipo} onChange={(e) => setEditTipo(e.target.value)} className="h-10" placeholder="Tipo" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={editMarca} onChange={(e) => setEditMarca(e.target.value)} className="h-10" placeholder="Marca" />
                            <Input value={editModelo} onChange={(e) => setEditModelo(e.target.value)} className="h-10" placeholder="Modelo" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={editLotacao} onChange={(e) => setEditLotacao(e.target.value)} className="h-10" placeholder="Lotação" type="number" />
                            <DatePickerField value={editDataMatricula} onChange={setEditDataMatricula} />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
                            <Button size="sm" onClick={() => void handleUpdate(item.id, cat, item.codigo!)}>{t('common.ok')}</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                                {item.codigo}
                              </span>
                              <span className="font-mono font-bold text-lg tracking-wider">{item.matricula}</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">{item.marca} {item.modelo}</p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                                        <Info className="w-3 h-3" /> {item.tipo}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                                        <Truck className="w-3 h-3" /> {item.lotacao} Lugares
                                    </span>
                                    {item.dataMatricula && (
                                        <span className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                                            <Calendar className="w-3 h-3" /> {new Date(item.dataMatricula).getFullYear()}
                                        </span>
                                    )}
                                </div>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-lg" 
                              onClick={() => {
                                setEditingId(item.id);
                                setEditTipo(item.tipo || '');
                                setEditMatricula(item.matricula || '');
                                setEditMarca(item.marca || '');
                                setEditModelo(item.modelo || '');
                                setEditLotacao(item.lotacao ? String(item.lotacao) : '');
                                setEditDataMatricula(item.dataMatricula || '');
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-lg text-destructive" 
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
        </div>
      </div>
    </div>
  );
}
