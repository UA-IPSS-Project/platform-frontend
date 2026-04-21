import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Search, Truck } from 'lucide-react';
import { 
  type TransporteCategoria,
  requisicoesApi, 
  type TransporteCatalogo 
} from '../../../services/api';
import { TRANSPORTE_CATEGORIA_OPTIONS_ADMIN } from '../../../pages/requisitions/sharedRequisitions.helpers';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { CatalogSection } from './CatalogSection';
import { ScrapTransportDialog } from './ScrapTransportDialog';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { TransportItemCard } from './TransportItemCard';
import { TransportAddForm } from './TransportAddForm';
import { useTransportCatalogForm } from '../../../hooks/requisitions/useTransportCatalogForm';
import { normalizeString } from '../../../utils/formatters';

interface TransportCatalogProps {
  transportes: TransporteCatalogo[];
  onRefresh: () => Promise<void>;
  formatCategoryName: (name: string) => string;
}

export function TransportCatalog({ transportes, onRefresh, formatCategoryName }: TransportCatalogProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [scrapTarget, setScrapTarget] = useState<TransporteCatalogo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransporteCategoria | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ '__ADD_FORM__': true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    newItemFields,
    editFields,
    newItemSetters,
    editSetters,
    resetNewItem,
    populateEditFields,
  } = useTransportCatalogForm();

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

  const displayedCategorias = useMemo<TransporteCategoria[]>(() => {
    if (!searchTerm.trim()) {
      // Sem pesquisa: mostrar todas as categorias existentes + ABATIDO_VENDIDO_DESCONTINUADO (sempre)
      const existentes = uniqueCategorias.filter(cat => cat !== 'ABATIDO_VENDIDO_DESCONTINUADO');
      return [...existentes, 'ABATIDO_VENDIDO_DESCONTINUADO' as TransporteCategoria];
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
    const {
      novoTipo,
      novaMatricula,
      novaMarca,
      novoModelo,
      novaLotacao,
      novaDataMatricula,
      novaCategoria,
    } = newItemFields;

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

      resetNewItem();
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
        tipo: editFields.editTipo,
        categoria,
        matricula: editFields.editMatricula,
        marca: editFields.editMarca,
        modelo: editFields.editModelo,
        lotacao: Number(editFields.editLotacao),
        dataMatricula: editFields.editDataMatricula,
      });
      setEditingId(null);
      await onRefresh();
      toast.success(t('dashboard.admin.catalogs.success.transportUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    }
  };

  const handleDeleteCategory = async (category: TransporteCategoria) => {
    setDeleteTarget(category);
  };

  const handleEditStart = (item: TransporteCatalogo) => {
    setEditingId(item.id);
    populateEditFields(item);
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
          <TransportAddForm
            nextCode={nextCode}
            fields={newItemFields}
            setters={newItemSetters}
            saving={saving}
            onSubmit={() => void handleCreate()}
            getCategoryDisplayName={getCategoryDisplayName}
          />
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
                onDeleteCategory={cat !== 'ABATIDO_VENDIDO_DESCONTINUADO' ? () => void handleDeleteCategory(cat) : undefined}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {items.length > 0 ? (
                    items.map(item => (
                    <TransportItemCard
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editFields={editFields}
                      setters={editSetters}
                      onEditStart={handleEditStart}
                      onEditCancel={() => setEditingId(null)}
                      onEditSave={(id, categoria, codigo) => void handleUpdate(id, categoria, codigo)}
                      onScrap={setScrapTarget}
                      getCategoryDisplayName={getCategoryDisplayName}
                    />
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">{t('dashboard.admin.catalogs.noVehiclesInCategory')}</p>
                    </div>
                  )}
                </div>
              </CatalogSection>
            );
          })}
        </div>
      </div>

      <ScrapTransportDialog
        isOpen={!!scrapTarget}
        transport={scrapTarget}
        onClose={() => setScrapTarget(null)}
        onSuccess={() => onRefresh()}
      />

      <DeleteCategoryDialog
        isOpen={!!deleteTarget}
        category={deleteTarget}
        itemCount={deleteTarget ? filteredTransportes.filter(t => t.categoria === deleteTarget).length : 0}
        categoryName={deleteTarget ? getCategoryDisplayName(deleteTarget) : ''}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => onRefresh()}
      />
    </div>
  );
}
