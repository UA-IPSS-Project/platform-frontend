import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Truck, Info, Calendar, XCircle } from 'lucide-react';
import { 
  TransporteCategoria, 
  requisicoesApi, 
  type TransporteCatalogo 
} from '../../../services/api';
import { TRANSPORTE_CATEGORIA_OPTIONS_ADMIN } from '../../../pages/requisitions/sharedRequisitions.helpers';

const AVAILABLE_TRANSPORT_CATEGORIES: TransporteCategoria[] = [
  'LIGEIRO_DE_PASSAGEIROS', 'LIGEIRO_DE_MERCADORIAS', 'LIGEIRO_MISTO', 'LIGEIRO_ESPECIAL',
  'PESADO_DE_PASSAGEIROS', 'PESADO_DE_MERCADORIAS', 'PESADO_MISTO',
  'ADAPTADO', 'ESCOLAR', 'AMBULANCIA', 'TRACTOR', 'OUTRO'
];

// Categorias para admin - inclui ABATE_VENDIDO
const ADMIN_TRANSPORT_CATEGORIES: TransporteCategoria[] = [
  ...AVAILABLE_TRANSPORT_CATEGORIES,
  'ABATIDO_VENDIDO_DESCONTINUADO'
];
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CatalogSection } from './CatalogSection';
import { ScrapTransportDialog } from './ScrapTransportDialog';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { cn } from '../../ui/utils';
import { DatePickerField } from '../../ui/date-picker-field';
import { normalizeString } from '../../../utils/formatters';

interface TransportCatalogProps {
  transportes: TransporteCatalogo[];
  onRefresh: () => Promise<void>;
  formatCategoryName: (name: string) => string;
}

export function TransportCatalog({ transportes, onRefresh, formatCategoryName }: TransportCatalogProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [scrapDialog, setScrapDialog] = useState<{ isOpen: boolean; transport: TransporteCatalogo | null }>({
    isOpen: false,
    transport: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; category: TransporteCategoria | null }>({
    isOpen: false,
    category: null,
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ '__ADD_FORM__': true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Item State
  const [novoTipo, setNovoTipo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<TransporteCategoria>('LIGEIRO_DE_PASSAGEIROS');
  const [novaMatricula, setNovaMatricula] = useState('');
  const [novaMarca, setNovaMarca] = useState('');
  const [novoModelo, setNovoModelo] = useState('');
  const [novaLotacao, setNovaLotacao] = useState('');
  const [novaDataMatricula, setNovaDataMatricula] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editLotacao, setEditLotacao] = useState('');
  const [editDataMatricula, setEditDataMatricula] = useState('');
  const [editCodigo, setEditCodigo] = useState('');
  const [editCategoria, setEditCategoria] = useState<TransporteCategoria>('LIGEIRO_DE_PASSAGEIROS');

  // Helper para obter nome formatado da categoria (com suporte a i18n para ABATE_VENDIDO)
  const getCategoryDisplayName = (category: TransporteCategoria): string => {
    if (category === 'ABATIDO_VENDIDO_DESCONTINUADO') {
      const option = TRANSPORTE_CATEGORIA_OPTIONS_ADMIN.find(opt => opt.value === 'ABATIDO_VENDIDO_DESCONTINUADO');
      return option ? t(option.label) : formatCategoryName(category);
    }
    return formatCategoryName(category);
  };

  const uniqueCategorias = useMemo(() => {
    return Array.from(new Set(transportes.map(t => t.categoria).filter((c): c is TransporteCategoria => !!c)));
  }, [transportes]);

  const filteredTransportes = useMemo(() => {
    if (!searchTerm.trim()) return transportes;
    const normalizedSearch = normalizeString(searchTerm);
    return transportes.filter(item => 
      normalizeString(item.tipo || '').includes(normalizedSearch) || 
      normalizeString(item.marca || '').includes(normalizedSearch) ||
      normalizeString(item.matricula || '').includes(normalizedSearch) ||
      normalizeString(item.modelo || '').includes(normalizedSearch) ||
      normalizeString(item.categoria || '').includes(normalizedSearch) ||
      (item.codigo && normalizeString(item.codigo).includes(normalizedSearch))
    );
  }, [transportes, searchTerm]);

  const displayedCategorias = useMemo(() => {
    if (!searchTerm.trim()) {
      // Sem pesquisa: mostrar todas as categorias existentes + ABATIDO_VENDIDO_DESCONTINUADO (sempre)
      const existentes = uniqueCategorias.filter(cat => cat !== 'ABATIDO_VENDIDO_DESCONTINUADO');
      return [...existentes, 'ABATIDO_VENDIDO_DESCONTINUADO'];
    }
    // Com pesquisa: mostrar apenas as categorias com itens filtrados
    return Array.from(new Set(filteredTransportes.map(t => t.categoria).filter((c): c is TransporteCategoria => !!c)));
  }, [filteredTransportes, uniqueCategorias, searchTerm]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      setOpenGroups(prev => {
        const next = { ...prev };
        displayedCategorias.forEach(cat => {
          next[cat] = true;
        });
        return next;
      });
    }
  }, [searchTerm, displayedCategorias]);

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
      const categoriaFinal = novaCategoria;
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

  const handleUpdate = async (id: number, categoria: TransporteCategoria, codigo: string) => {
    if (!codigo || !codigo.trim()) {
      toast.error(t('dashboard.admin.catalogs.errors.codeRequired'));
      return;
    }
    try {
      await requisicoesApi.atualizarTransporteCatalogo(id, {
        codigo: codigo.trim().toUpperCase(),
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

  const handleDeleteCategory = async (category: TransporteCategoria) => {
    setDeleteDialog({ isOpen: true, category });
  };

  const toggleGroup = (categoria: TransporteCategoria) => {
    setOpenGroups(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Action Bar - Counts only */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
         <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none gap-2">
              <Truck className="h-4 w-4" /> {t('dashboard.admin.catalogs.totalFleet', { count: transportes.length })}
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
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.nextCodeLabel')}</label>
              <Input value={nextCode} readOnly disabled className="h-11 rounded-xl bg-muted/30 font-mono font-bold text-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.type')}</label>
              <Input className="h-11 rounded-xl" placeholder="Ex: Furgão, Autocarro..." value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.category')}</label>
              <select 
                value={novaCategoria} 
                onChange={(e) => setNovaCategoria(e.target.value as TransporteCategoria)} 
                className="w-full h-11 rounded-xl border border-border/40 bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {AVAILABLE_TRANSPORT_CATEGORIES.map(cat => <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.plate')}</label>
              <Input className="h-11 rounded-xl font-mono uppercase" placeholder={t('dashboard.admin.catalogs.platePlaceholder')} value={novaMatricula} onChange={(e) => setNovaMatricula(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.brand')}</label>
              <Input className="h-11 rounded-xl" placeholder="Ex: Renault, Mercedes..." value={novaMarca} onChange={(e) => setNovaMarca(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.model')}</label>
              <Input className="h-11 rounded-xl" placeholder="Ex: Kangoo, Sprinter..." value={novoModelo} onChange={(e) => setNovoModelo(e.target.value)} />
            </div>

            <div className="space-y-2 text-center md:text-left">
              <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.capacity')}</label>
              <Input type="number" className="h-11 rounded-xl" placeholder="Ex: 5, 9, 50..." value={novaLotacao} onChange={(e) => setNovaLotacao(e.target.value)} />
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

        {/* Search Bar - Repositioned near results */}
        <div className="max-w-md">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('dashboard.admin.catalogs.searchVehiclesPlaceholder')} 
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/40 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <h4 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">{t('dashboard.admin.catalogs.fleetByCategory')}</h4>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {displayedCategorias.map(cat => {
            const items = filteredTransportes.filter(t => t.categoria === cat);
            return (
              <CatalogSection
                key={cat}
                title={getCategoryDisplayName(cat)}
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
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.internalCode')}</label>
                              <Input value={editCodigo} onChange={(e) => setEditCodigo(e.target.value.toUpperCase())} className="h-10 font-mono" placeholder="Ex: V01" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.plate')}</label>
                              <Input value={editMatricula} onChange={(e) => setEditMatricula(e.target.value.toUpperCase())} className="h-10 font-mono" placeholder="Matrícula" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.type')}</label>
                              <Input value={editTipo} onChange={(e) => setEditTipo(e.target.value)} className="h-10" placeholder="Tipo" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.brand')}</label>
                              <Input value={editMarca} onChange={(e) => setEditMarca(e.target.value)} className="h-10" placeholder="Marca" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.model')}</label>
                              <Input value={editModelo} onChange={(e) => setEditModelo(e.target.value)} className="h-10" placeholder="Modelo" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.capacity')}</label>
                              <Input value={editLotacao} onChange={(e) => setEditLotacao(e.target.value)} className="h-10" placeholder="Lotação" type="number" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.regDate')}</label>
                              <DatePickerField value={editDataMatricula} onChange={setEditDataMatricula} />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.category')}</label>
                              <Select value={editCategoria} onValueChange={(value) => setEditCategoria(value as TransporteCategoria)}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder={t('dashboard.admin.catalogs.selectCategory')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {AVAILABLE_TRANSPORT_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>
                                      {getCategoryDisplayName(cat)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
                            <Button size="sm" onClick={() => void handleUpdate(item.id, editCategoria, editCodigo)}>{t('common.ok')}</Button>
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
                                        <Truck className="w-3 h-3" /> {t('dashboard.admin.catalogs.seatsCount', { count: item.lotacao })}
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
                                setEditCodigo(item.codigo || '');
                                setEditCategoria(item.categoria || 'LIGEIRO_DE_PASSAGEIROS');
                              }}
                              title={t('common.edit')}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {item.categoria !== 'ABATIDO_VENDIDO_DESCONTINUADO' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                                onClick={() => setScrapDialog({ isOpen: true, transport: item })}
                                title={t('dashboard.admin.catalogs.confirm.scrapTransport')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
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

      <ScrapTransportDialog
        isOpen={scrapDialog.isOpen}
        transport={scrapDialog.transport}
        onClose={() => setScrapDialog({ isOpen: false, transport: null })}
        onSuccess={() => onRefresh()}
      />

      <DeleteCategoryDialog
        isOpen={deleteDialog.isOpen}
        category={deleteDialog.category}
        itemCount={deleteDialog.category ? filteredTransportes.filter(t => t.categoria === deleteDialog.category).length : 0}
        categoryName={deleteDialog.category ? getCategoryDisplayName(deleteDialog.category) : ''}
        onClose={() => setDeleteDialog({ isOpen: false, category: null })}
        onSuccess={() => onRefresh()}
      />
    </div>
  );
}
