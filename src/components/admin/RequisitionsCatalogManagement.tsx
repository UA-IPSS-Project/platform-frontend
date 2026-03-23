import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  MaterialCategoria,
  ManutencaoItem,
  TransporteCategoria,
  requisicoesApi,
  type MaterialCatalogo,
  type TransporteCatalogo,
} from '../../services/api';
import type { ApiRequestError } from '../../services/api/core/client';
import { GlassCard } from '../ui/glass-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTranslation } from 'react-i18next';
import { PackageIcon, TrashIcon } from '../shared/CustomIcons';

type CatalogPanel = 'MATERIAIS' | 'TRANSPORTES' | 'MANUTENCOES';
type ExpandedFormState = 'EQUAL' | 'FORM' | 'LIST';

const MAX_LOAD_CATALOGO_RETRIES = 4;

const isRetryableStatus = (status?: number) => [500, 502, 503, 504].includes(status ?? 0);

export function RequisitionsCatalogManagement() {
  const { i18n } = useTranslation();
  const tt = (pt: string, en: string) => (i18n.language.startsWith('en') ? en : pt);

  const formatCategoryName = (name: string) => {
    if (!name) return '';
    return name.replace(/_/g, ' ').toUpperCase();
  };

  const [savingMaterial, setSavingMaterial] = useState(false);
  const [savingTransporte, setSavingTransporte] = useState(false);

  // States for "Nova" category selection
  const [materialCategoryMode, setMaterialCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [transporteCategoryMode, setTransporteCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [manutencaoCategoryMode, setManutencaoCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [customMaterialCategory, setCustomMaterialCategory] = useState('');
  const [customTransporteCategory, setCustomTransporteCategory] = useState('');
  const [customManutencaoCategory, setCustomManutencaoCategory] = useState('');

  const [editMaterialCategoryMode, setEditMaterialCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [editTransporteCategoryMode, setEditTransporteCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [editManutencaoCategoryMode, setEditManutencaoCategoryMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [customEditMaterialCategory, setCustomEditMaterialCategory] = useState('');
  const [customEditTransporteCategory, setCustomEditTransporteCategory] = useState('');
  const [customEditManutencaoCategory, setCustomEditManutencaoCategory] = useState('');

  const [editingSpace, setEditingSpace] = useState<{ category: string; name: string } | null>(null);
  const [editSpaceName, setEditSpaceName] = useState('');
  const [editingElement, setEditingElement] = useState<{ category: string; name: string } | null>(null);
  const [editElementName, setEditElementName] = useState('');
  
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [manutencaoItems, setManutencaoItems] = useState<ManutencaoItem[]>([]);

  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingTransporteId, setEditingTransporteId] = useState<number | null>(null);

  const [novoMaterialNome, setNovoMaterialNome] = useState('');
  const [novoMaterialCategoria, setNovoMaterialCategoria] = useState<MaterialCategoria>('OUTROS');
  const [novoMaterialAtributo, setNovoMaterialAtributo] = useState('');
  const [novoMaterialValorAtributo, setNovoMaterialValorAtributo] = useState('');

  const [novoTransporteTipo, setNovoTransporteTipo] = useState('');
  const [novoTransporteCodigo, setNovoTransporteCodigo] = useState('');
  const [novoTransporteCategoria, setNovoTransporteCategoria] = useState<TransporteCategoria>('LIGEIRO');
  const [novoTransporteMatricula, setNovoTransporteMatricula] = useState('');
  const [novoTransporteMarca, setNovoTransporteMarca] = useState('');
  const [novoTransporteModelo, setNovoTransporteModelo] = useState('');
  const [novoTransporteLotacao, setNovoTransporteLotacao] = useState('');
  const [novoTransporteDataMatricula, setNovoTransporteDataMatricula] = useState('');

  const [novoManutencaoCategoria, setNovoManutencaoCategoria] = useState('');
  const [novoManutencaoEspaco, setNovoManutencaoEspaco] = useState('');
  const [novoManutencaoVerificacao, setNovoManutencaoVerificacao] = useState('');

  const [editMaterialNome, setEditMaterialNome] = useState('');
  const [editMaterialCategoria, setEditMaterialCategoria] = useState<MaterialCategoria>('OUTROS');
  const [editMaterialAtributo, setEditMaterialAtributo] = useState('');
  const [editMaterialValorAtributo, setEditMaterialValorAtributo] = useState('');

  const [editTransporteTipo, setEditTransporteTipo] = useState('');
  const [editTransporteCodigo, setEditTransporteCodigo] = useState('');
  const [editTransporteCategoria, setEditTransporteCategoria] = useState<TransporteCategoria>('LIGEIRO');
  const [editTransporteMatricula, setEditTransporteMatricula] = useState('');
  const [editTransporteMarca, setEditTransporteMarca] = useState('');
  const [editTransporteModelo, setEditTransporteModelo] = useState('');
  const [editTransporteLotacao, setEditTransporteLotacao] = useState('');
  const [editTransporteDataMatricula, setEditTransporteDataMatricula] = useState('');

  const [activePanel, setActivePanel] = useState<CatalogPanel>('MATERIAIS');
  const [openAddPanels, setOpenAddPanels] = useState<Record<CatalogPanel, boolean>>({
    MATERIAIS: true,
    TRANSPORTES: false,
    MANUTENCOES: false,
  });
  const [openMaterialGroups, setOpenMaterialGroups] = useState<Record<string, boolean>>({});
  const [openTransporteGroups, setOpenTransporteGroups] = useState<Record<string, boolean>>({});
  const [openManutencaoGroups, setOpenManutencaoGroups] = useState<Record<string, boolean>>({});
  const [expandedForm, setExpandedForm] = useState<ExpandedFormState>('EQUAL');

  const uniqueMateriaisCategorias = Array.from(new Set(materiais.map(m => m.categoria).filter((c): c is string => !!c)));
  const uniqueTransportesCategorias = Array.from(new Set(transportes.map(t => t.categoria).filter((c): c is string => !!c)));
  const uniqueManutencaoCategorias = Array.from(new Set(manutencaoItems.map(m => m.categoria).filter((c): c is string => !!c)));

  const toggleManutencaoGroup = (categoria: string) => {
    setOpenManutencaoGroups((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  const manutencaoPorCategoria = uniqueManutencaoCategorias
    .map((cat: string) => ({
      value: cat,
      label: cat,
      items: manutencaoItems.filter((m) => m.categoria === cat),
    }))
    .filter((grupo) => grupo.items.length > 0);

  const selectFieldClassName = 'w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100';
  const inputFieldClassName = 'mt-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';

  const loadCatalogo = async (retryCount = 0) => {
    const [materiaisResult, transportesResult, manutencaoResult] = await Promise.allSettled([
      requisicoesApi.listarMateriais(),
      requisicoesApi.listarTransportes(),
      requisicoesApi.listarManutencaoItems(),
    ]);

    const pendingRetryableStatuses: number[] = [];

    if (materiaisResult.status === 'fulfilled') {
      setMateriais(Array.isArray(materiaisResult.value) ? materiaisResult.value : []);
    } else {
      const status = (materiaisResult.reason as ApiRequestError)?.status;
      if (status === 401 || status === 403) return;
      if (isRetryableStatus(status)) pendingRetryableStatuses.push(status ?? 0);
      else toast.error((materiaisResult.reason as Error)?.message || tt('Erro ao carregar materiais.', 'Error loading materials.'));
    }

    if (transportesResult.status === 'fulfilled') {
      setTransportes(Array.isArray(transportesResult.value) ? transportesResult.value : []);
    } else {
      const status = (transportesResult.reason as ApiRequestError)?.status;
      if (status === 401 || status === 403) return;
      if (isRetryableStatus(status)) pendingRetryableStatuses.push(status ?? 0);
      else toast.error((transportesResult.reason as Error)?.message || tt('Erro ao carregar transportes.', 'Error loading transport options.'));
    }

    if (manutencaoResult.status === 'fulfilled') {
      setManutencaoItems(Array.isArray(manutencaoResult.value) ? manutencaoResult.value : []);
    } else {
      const status = (manutencaoResult.reason as ApiRequestError)?.status;
      if (status !== 404 && status !== 401 && status !== 403) {
        if (isRetryableStatus(status)) pendingRetryableStatuses.push(status ?? 0);
        else toast.error((manutencaoResult.reason as Error)?.message || tt('Erro ao carregar itens de manutenção.', 'Error loading maintenance items.'));
      }
      if (status === 404) setManutencaoItems([]);
    }

    if (pendingRetryableStatuses.length > 0 && retryCount < MAX_LOAD_CATALOGO_RETRIES) {
      setTimeout(() => void loadCatalogo(retryCount + 1), 500 * (retryCount + 1));
    }
  };

  useEffect(() => {
    void loadCatalogo(0);
  }, []);

  const handleCreateMaterial = async () => {
    if (!novoMaterialNome.trim() || !novoMaterialAtributo.trim() || !novoMaterialValorAtributo.trim()) {
      toast.error(tt('Todos os campos são obrigatórios.', 'All fields are required.'));
      return;
    }

    try {
      const categoriaFinal = (materialCategoryMode === 'NEW' ? customMaterialCategory : novoMaterialCategoria).trim();
      if (!categoriaFinal) {
        toast.error(tt('A categoria é obrigatória.', 'Category is required.'));
        return;
      }

      setSavingMaterial(true);
      const novoMaterial = await requisicoesApi.criarMaterialCatalogo({
        nome: novoMaterialNome.trim(),
        categoria: categoriaFinal,
        atributo: novoMaterialAtributo.trim(),
        valorAtributo: novoMaterialValorAtributo.trim(),
      });

      setMateriais((prev) => [...prev, novoMaterial]);
      setNovoMaterialNome('');
      setCustomMaterialCategory('');
      setMaterialCategoryMode('SELECT');
      setNovoMaterialAtributo('');
      setNovoMaterialValorAtributo('');
      await loadCatalogo();
      toast.success(tt('Material criado com sucesso.', 'Material created successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao criar material.', 'Error creating material.'));
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleCreateTransporte = async () => {
    if (
      !novoTransporteCodigo.trim() || !novoTransporteTipo.trim() || !novoTransporteMatricula.trim() ||
      !novoTransporteMarca.trim() || !novoTransporteModelo.trim() || !novoTransporteLotacao.trim() || !novoTransporteDataMatricula
    ) {
      toast.error(tt('Todos os campos são obrigatórios.', 'All fields are required.'));
      return;
    }

    const lotacao = Number(novoTransporteLotacao);
    if (!Number.isFinite(lotacao) || lotacao <= 0) {
      toast.error(tt('A lotação deve ser um número maior que zero.', 'Capacity must be a number greater than zero.'));
      return;
    }

    try {
      const categoriaFinal = (transporteCategoryMode === 'NEW' ? customTransporteCategory : novoTransporteCategoria).trim();
      if (!categoriaFinal) {
        toast.error(tt('A categoria é obrigatória.', 'Category is required.'));
        return;
      }

      setSavingTransporte(true);
      const novoTransporte = await requisicoesApi.criarTransporteCatalogo({
        codigo: novoTransporteCodigo.trim().toUpperCase(),
        tipo: novoTransporteTipo.trim(),
        categoria: categoriaFinal,
        matricula: novoTransporteMatricula.trim().toUpperCase(),
        marca: novoTransporteMarca.trim(),
        modelo: novoTransporteModelo.trim(),
        lotacao,
        dataMatricula: novoTransporteDataMatricula,
      });

      setTransportes((prev) => [...prev, novoTransporte]);
      setNovoTransporteTipo('');
      setNovoTransporteCodigo('');
      setCustomTransporteCategory('');
      setTransporteCategoryMode('SELECT');
      setNovoTransporteMatricula('');
      setNovoTransporteMarca('');
      setNovoTransporteModelo('');
      setNovoTransporteLotacao('');
      setNovoTransporteDataMatricula('');
      await loadCatalogo();
      toast.success(tt('Transporte criado com sucesso.', 'Transport created successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao criar transporte.', 'Error creating transport.'));
    } finally {
      setSavingTransporte(false);
    }
  };

  const startEditMaterial = (item: MaterialCatalogo) => {
    setEditingMaterialId(item.id);
    setEditMaterialNome(item.nome || '');
    setEditMaterialAtributo(item.atributo || '');
    setEditMaterialValorAtributo(item.valorAtributo || '');

    const catValue = item.categoria || 'OUTROS';
    setEditMaterialCategoria(catValue as MaterialCategoria);
    setEditMaterialCategoryMode('SELECT');
    setCustomEditMaterialCategory('');
  };

  const startEditTransporte = (item: TransporteCatalogo) => {
    setEditingTransporteId(item.id);
    setEditTransporteTipo(item.tipo || '');
    setEditTransporteCodigo(item.codigo || '');
    setEditTransporteMatricula(item.matricula || '');
    setEditTransporteMarca(item.marca || '');
    setEditTransporteModelo(item.modelo || '');
    setEditTransporteLotacao(item.lotacao ? String(item.lotacao) : '');
    setEditTransporteDataMatricula(item.dataMatricula || '');

    const catValue = item.categoria || 'LIGEIRO';
    setEditTransporteCategoria(catValue as TransporteCategoria);
    setEditTransporteCategoryMode('SELECT');
    setCustomEditTransporteCategory('');
  };

  const handleUpdateMaterial = async () => {
    if (editingMaterialId == null) return;
    try {
      const categoriaFinal = (editMaterialCategoryMode === 'NEW' ? customEditMaterialCategory : editMaterialCategoria).trim();
      if (!categoriaFinal) {
        toast.error(tt('A categoria é obrigatória.', 'Category is required.'));
        return;
      }

      const atualizado = await requisicoesApi.atualizarMaterialCatalogo(editingMaterialId, {
        nome: editMaterialNome,
        categoria: categoriaFinal,
        atributo: editMaterialAtributo,
        valorAtributo: editMaterialValorAtributo,
      });
      setMateriais((prev) => prev.map((item) => (item.id === editingMaterialId ? atualizado : item)));
      setEditingMaterialId(null);
      await loadCatalogo();
      toast.success(tt('Material atualizado com sucesso.', 'Material updated successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao atualizar material.', 'Error updating material.'));
    }
  };

  const handleUpdateTransporte = async () => {
    if (editingTransporteId == null) return;
    try {
      const categoriaFinal = (editTransporteCategoryMode === 'NEW' ? customEditTransporteCategory : editTransporteCategoria).trim();
      if (!categoriaFinal) {
        toast.error(tt('A categoria é obrigatória.', 'Category is required.'));
        return;
      }

      const atualizado = await requisicoesApi.atualizarTransporteCatalogo(editingTransporteId, {
        codigo: editTransporteCodigo || undefined,
        tipo: editTransporteTipo,
        categoria: categoriaFinal,
        matricula: editTransporteMatricula,
        marca: editTransporteMarca || undefined,
        modelo: editTransporteModelo || undefined,
        lotacao: editTransporteLotacao ? Number(editTransporteLotacao) : undefined,
        dataMatricula: editTransporteDataMatricula || undefined,
      });
      setTransportes((prev) => prev.map((item) => (item.id === editingTransporteId ? atualizado : item)));
      setEditingTransporteId(null);
      await loadCatalogo();
      toast.success(tt('Transporte atualizado com sucesso.', 'Transport updated successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao atualizar transporte.', 'Error updating transport.'));
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm(tt('Tem a certeza que deseja eliminar este material?', 'Are you sure you want to delete this material?'))) return;
    try {
      await requisicoesApi.apagarMaterialCatalogo(id);
      setMateriais((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success(tt('Material apagado com sucesso.', 'Material deleted successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao apagar material.', 'Error deleting material.'));
    }
  };

  const handleDeleteTransporte = async (id: number) => {
    if (!window.confirm(tt('Tem a certeza que deseja eliminar este transporte?', 'Are you sure you want to delete this transport?'))) return;
    try {
      await requisicoesApi.apagarTransporteCatalogo(id);
      setTransportes((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success(tt('Transporte apagado com sucesso.', 'Transport deleted successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao apagar transporte.', 'Error deleting transport.'));
    }
  };

  const handleUpdateSpace = async (category: string, oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) { setEditingSpace(null); return; }
    try {
      const itemsToUpdate = manutencaoItems.filter(i => i.categoria === category && i.espaco === oldName);
      await Promise.all(itemsToUpdate.map(i => requisicoesApi.atualizarManutencaoItem(i.id, {
        categoria: i.categoria,
        espaco: newName.trim(),
        itemVerificacao: i.itemVerificacao,
      })));
      setEditingSpace(null);
      await loadCatalogo();
      toast.success(tt('Espaço atualizado.', 'Space updated.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao atualizar espaço.', 'Error updating space.'));
    }
  };

  const handleUpdateElement = async (category: string, oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) { setEditingElement(null); return; }
    try {
      const itemsToUpdate = manutencaoItems.filter(i => i.categoria === category && i.itemVerificacao === oldName);
      await Promise.all(itemsToUpdate.map(i => requisicoesApi.atualizarManutencaoItem(i.id, {
        categoria: i.categoria,
        espaco: i.espaco,
        itemVerificacao: newName.trim(),
      })));
      setEditingElement(null);
      await loadCatalogo();
      toast.success(tt('Elemento atualizado.', 'Element updated.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao atualizar elemento.', 'Error updating element.'));
    }
  };

  const handleDeleteSpace = async (category: string, name: string) => {
    if (!window.confirm(tt(`Eliminar espaço "${name}" e seus itens?`, `Delete space "${name}" and its items?`))) return;
    try {
      const itemsToDelete = manutencaoItems.filter(i => i.categoria === category && i.espaco === name);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await loadCatalogo();
      toast.success(tt('Espaço eliminado.', 'Space deleted.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao eliminar espaço.', 'Error deleting space.'));
    }
  };

  const handleDeleteElement = async (category: string, name: string) => {
    if (!window.confirm(tt(`Eliminar elemento "${name}" em todos os espaços?`, `Delete element "${name}" across all spaces?`))) return;
    try {
      const itemsToDelete = manutencaoItems.filter(i => i.categoria === category && i.itemVerificacao === name);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await loadCatalogo();
      toast.success(tt('Elemento eliminado.', 'Element deleted.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao eliminar elemento.', 'Error deleting element.'));
    }
  };

  const handleDeleteCategory = async (category: string, type: 'MATERIAL' | 'TRANSPORTE' | 'MANUTENCAO') => {
    const formattedName = formatCategoryName(category);
    if (!window.confirm(tt(`Eliminar TODOS os itens da categoria "${formattedName}"?`, `Delete ALL items in category "${formattedName}"?`))) return;
    try {
      let itemsToDelete: {id: number}[] = [];
      if (type === 'MATERIAL') itemsToDelete = materiais.filter(m => m.categoria === category);
      else if (type === 'TRANSPORTE') itemsToDelete = transportes.filter(t => t.categoria === category);
      else if (type === 'MANUTENCAO') itemsToDelete = manutencaoItems.filter(m => m.categoria === category);
      
      await Promise.all(itemsToDelete.map(i => {
        if (type === 'MATERIAL') return requisicoesApi.apagarMaterialCatalogo(i.id);
        if (type === 'TRANSPORTE') return requisicoesApi.apagarTransporteCatalogo(i.id);
        return requisicoesApi.apagarManutencaoItem(i.id);
      }));
      await loadCatalogo();
      toast.success(tt('Categoria removida.', 'Category removed.'));
    } catch (error) {
      toast.error(tt('Erro ao remover categoria.', 'Error removing category.'));
    }
  };

  const toggleAddPanel = (panel: CatalogPanel) => {
    setOpenAddPanels(prev => ({ MATERIAIS: false, TRANSPORTES: false, MANUTENCOES: false, [panel]: !prev[panel] }));
    setActivePanel(panel);
  };

  const toggleMaterialGroup = (categoria: string) => setOpenMaterialGroups(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  const toggleTransporteGroup = (categoria: string) => setOpenTransporteGroups(prev => ({ ...prev, [categoria]: !prev[categoria] }));

  const materiaisPorCategoria = uniqueMateriaisCategorias.map(cat => ({
    value: cat, label: cat, items: materiais.filter(m => m.categoria === cat)
  }));

  const transportesPorCategoria = uniqueTransportesCategorias.map(cat => ({
    value: cat, label: cat, items: transportes.filter(t => t.categoria === cat)
  })).filter(g => g.items.length > 0);

  const leftColSpan = expandedForm === 'FORM' ? 'xl:col-span-8' : (expandedForm === 'LIST' ? 'xl:col-span-4' : 'xl:col-span-5');
  const rightColSpan = expandedForm === 'FORM' ? 'xl:col-span-4' : (expandedForm === 'LIST' ? 'xl:col-span-8' : 'xl:col-span-7');

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <PackageIcon className="w-4 h-4" />
          {tt('Configuração do Catálogo', 'Catalog Configuration')}
        </div>
        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
          {tt('Gestão de Materiais, Transportes e Manutenção', 'Material, Transport and Maintenance Management')}
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className={`${leftColSpan} space-y-4 transition-all duration-300`} onClick={() => setExpandedForm('FORM')}>
          {/* Material Add Panel */}
          <GlassCard className="p-4 space-y-3">
            <button onClick={() => toggleAddPanel('MATERIAIS')} className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">
              <span className="font-semibold text-gray-800 dark:text-white">{tt('Adicionar material', 'Add material')}</span>
              <span className="text-sm text-gray-500">{openAddPanels.MATERIAIS ? '▾' : '▸'}</span>
            </button>
            {openAddPanels.MATERIAIS && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Categoria', 'Category')}</label>
                  <select value={materialCategoryMode === 'NEW' ? 'NEW' : novoMaterialCategoria} onChange={(e) => {
                    if (e.target.value === 'NEW') setMaterialCategoryMode('NEW');
                    else { setMaterialCategoryMode('SELECT'); setNovoMaterialCategoria(e.target.value as MaterialCategoria); }
                  }} className={selectFieldClassName}>
                    {uniqueMateriaisCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                    <option value="NEW">-- {tt('Nova Categoria', 'New Category')} --</option>
                  </select>
                  {materialCategoryMode === 'NEW' && <Input className={inputFieldClassName + " mt-2"} value={customMaterialCategory} onChange={(e) => setCustomMaterialCategory(e.target.value)} />}
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Nome do material', 'Material name')}</label>
                  <Input className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Atributo', 'Attribute')}</label>
                    <Input className={inputFieldClassName} value={novoMaterialAtributo} onChange={(e) => setNovoMaterialAtributo(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Valor', 'Value')}</label>
                    <Input className={inputFieldClassName} value={novoMaterialValorAtributo} onChange={(e) => setNovoMaterialValorAtributo(e.target.value)} />
                  </div>
                </div>
                <Button onClick={() => void handleCreateMaterial()} disabled={savingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">{tt('Adicionar Material', 'Add Material')}</Button>
              </div>
            )}
          </GlassCard>

          {/* Transporte Add Panel */}
          <GlassCard className="p-4 space-y-3">
            <button onClick={() => toggleAddPanel('TRANSPORTES')} className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">
              <span className="font-semibold text-gray-800 dark:text-white">{tt('Adicionar transporte', 'Add transport')}</span>
              <span className="text-sm text-gray-500">{openAddPanels.TRANSPORTES ? '▾' : '▸'}</span>
            </button>
            {openAddPanels.TRANSPORTES && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={tt('Código', 'Code')} className={inputFieldClassName} value={novoTransporteCodigo} onChange={(e) => setNovoTransporteCodigo(e.target.value)} />
                  <Input placeholder={tt('Tipo', 'Type')} className={inputFieldClassName} value={novoTransporteTipo} onChange={(e) => setNovoTransporteTipo(e.target.value)} />
                </div>
                <div>
                  <select value={transporteCategoryMode === 'NEW' ? 'NEW' : novoTransporteCategoria} onChange={(e) => {
                    if (e.target.value === 'NEW') setTransporteCategoryMode('NEW');
                    else { setTransporteCategoryMode('SELECT'); setNovoTransporteCategoria(e.target.value as TransporteCategoria); }
                  }} className={selectFieldClassName}>
                    {uniqueTransportesCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                    <option value="NEW">-- {tt('Nova Categoria', 'New Category')} --</option>
                  </select>
                  {transporteCategoryMode === 'NEW' && <Input className={inputFieldClassName + " mt-2"} value={customTransporteCategory} onChange={(e) => setCustomTransporteCategory(e.target.value)} />}
                </div>
                <Input placeholder={tt('Matrícula', 'Plate')} className={inputFieldClassName} value={novoTransporteMatricula} onChange={(e) => setNovoTransporteMatricula(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={tt('Marca', 'Brand')} className={inputFieldClassName} value={novoTransporteMarca} onChange={(e) => setNovoTransporteMarca(e.target.value)} />
                  <Input placeholder={tt('Modelo', 'Model')} className={inputFieldClassName} value={novoTransporteModelo} onChange={(e) => setNovoTransporteModelo(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={tt('Lotação', 'Capacity')} type="number" className={inputFieldClassName} value={novoTransporteLotacao} onChange={(e) => setNovoTransporteLotacao(e.target.value)} />
                  <Input type="date" className={inputFieldClassName} value={novoTransporteDataMatricula} onChange={(e) => setNovoTransporteDataMatricula(e.target.value)} />
                </div>
                <Button onClick={() => void handleCreateTransporte()} disabled={savingTransporte} className="bg-purple-600 hover:bg-purple-700 text-white">{tt('Adicionar Transporte', 'Add Transport')}</Button>
              </div>
            )}
          </GlassCard>

          {/* Manutencao Add Panel */}
          <GlassCard className="p-4 space-y-3">
            <button onClick={() => toggleAddPanel('MANUTENCOES')} className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">
              <span className="font-semibold text-gray-800 dark:text-white">{tt('Adicionar manutenção', 'Add maintenance')}</span>
              <span className="text-sm text-gray-500">{openAddPanels.MANUTENCOES ? '▾' : '▸'}</span>
            </button>
            {openAddPanels.MANUTENCOES && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Categoria', 'Category')}</label>
                  <select value={manutencaoCategoryMode === 'NEW' ? 'NEW' : novoManutencaoCategoria} onChange={(e) => {
                    if (e.target.value === 'NEW') setManutencaoCategoryMode('NEW');
                    else { setManutencaoCategoryMode('SELECT'); setNovoManutencaoCategoria(e.target.value); }
                  }} className={selectFieldClassName}>
                    <option value="">-- {tt('Selecionar Categoria', 'Select Category')} --</option>
                    {uniqueManutencaoCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                    <option value="NEW">-- {tt('Nova Categoria', 'New Category')} --</option>
                  </select>
                  {manutencaoCategoryMode === 'NEW' && <Input className={inputFieldClassName + " mt-2"} placeholder={tt('Nome da Nova Categoria', 'New Category Name')} value={customManutencaoCategory} onChange={(e) => setCustomManutencaoCategory(e.target.value)} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 border border-purple-100 dark:border-purple-900/30 rounded-lg bg-purple-50/20">
                    <h4 className="text-sm font-semibold text-purple-700">{tt('1. Adicionar Espaço', '1. Add Space')}</h4>
                    <Input placeholder={tt('Nome do Espaço', 'Space Name')} value={novoManutencaoEspaco} onChange={(e) => setNovoManutencaoEspaco(e.target.value)} className="h-9" />
                    <Button className="w-full h-9 bg-purple-600" onClick={async () => {
                      const cat = (manutencaoCategoryMode === 'NEW' ? customManutencaoCategory : novoManutencaoCategoria).trim();
                      if (!cat || !novoManutencaoEspaco.trim()) { toast.error(tt('Campos obrigatórios!', 'Required fields!')); return; }
                      try {
                        const elements = Array.from(new Set(manutencaoItems.filter(i => i.categoria === cat).map(i => i.itemVerificacao)));
                        const toCreate = elements.length > 0 ? elements : ['GERAL'];
                        await Promise.all(toCreate.map(el => requisicoesApi.criarManutencaoItem({ categoria: cat, espaco: novoManutencaoEspaco.trim(), itemVerificacao: el })));
                        setNovoManutencaoEspaco(''); await loadCatalogo(); toast.success(tt('Espaço criado!', 'Space created!'));
                      } catch (err: any) { toast.error(err.message); }
                    }}>{tt('Criar Espaço', 'Create Space')}</Button>
                  </div>

                  <div className="space-y-3 p-4 border border-blue-100 dark:border-blue-900/30 rounded-lg bg-blue-50/20">
                    <h4 className="text-sm font-semibold text-blue-700">{tt('2. Adicionar Elemento', '2. Add Element')}</h4>
                    <Input placeholder={tt('Elemento de Verificação', 'Verification Element')} value={novoManutencaoVerificacao} onChange={(e) => setNovoManutencaoVerificacao(e.target.value)} className="h-9" />
                    <Button className="w-full h-9 bg-blue-600" onClick={async () => {
                      const cat = (manutencaoCategoryMode === 'NEW' ? customManutencaoCategory : novoManutencaoCategoria).trim();
                      if (!cat || !novoManutencaoVerificacao.trim()) { toast.error(tt('Campos obrigatórios!', 'Required fields!')); return; }
                      try {
                        const spaces = Array.from(new Set(manutencaoItems.filter(i => i.categoria === cat).map(i => i.espaco)));
                        const toCreate = spaces.length > 0 ? spaces : ['GERAL'];
                        await Promise.all(toCreate.map(sp => requisicoesApi.criarManutencaoItem({ categoria: cat, espaco: sp, itemVerificacao: novoManutencaoVerificacao.trim() })));
                        setNovoManutencaoVerificacao(''); await loadCatalogo(); toast.success(tt('Elemento criado!', 'Element created!'));
                      } catch (err: any) { toast.error(err.message); }
                    }}>{tt('Criar Elemento', 'Create Element')}</Button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right column: LIST */}
        <div className={`${rightColSpan} transition-all duration-300`} onClick={() => setExpandedForm('LIST')}>
          <GlassCard className="p-6 space-y-4">
            {activePanel === 'MATERIAIS' && (
              <div className="space-y-4">
                <h3 className="font-semibold">{tt('Materiais', 'Materials')} ({materiais.length})</h3>
                {materiaisPorCategoria.map(grupo => (
                  <div key={grupo.value} className="border dark:border-gray-700 rounded-md p-2">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => toggleMaterialGroup(grupo.value)} className="font-medium">{formatCategoryName(grupo.value)} ({grupo.items.length})</button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => void handleDeleteCategory(grupo.value, 'MATERIAL')}><TrashIcon className="w-4 h-4" /></Button>
                    </div>
                    {openMaterialGroups[grupo.value] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {grupo.items.map(item => (
                          <div key={item.id} className="p-2 border dark:border-gray-700 rounded-sm bg-gray-50/50 dark:bg-gray-800/50">
                            {editingMaterialId === item.id ? (
                              <div className="space-y-2">
                                <Input value={editMaterialNome} onChange={(e) => setEditMaterialNome(e.target.value)} className="h-8" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => void handleUpdateMaterial()}>{tt('OK', 'OK')}</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingMaterialId(null)}>{tt('X', 'X')}</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="font-medium">{item.nome}</span>
                                  <p className="text-xs text-gray-500">{item.atributo}: {item.valorAtributo}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEditMaterial(item)}>Ed</Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => void handleDeleteMaterial(item.id)}>Del</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'MANUTENCOES' && (
              <div className="space-y-4">
                <h3 className="font-semibold">{tt('Manutenção', 'Maintenance')} ({manutencaoItems.length})</h3>
                {manutencaoPorCategoria.map(grupo => (
                  <div key={grupo.value} className="border dark:border-gray-700 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <button onClick={() => toggleManutencaoGroup(grupo.value)} className="font-medium">{formatCategoryName(grupo.value)} ({grupo.items.length})</button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => void handleDeleteCategory(grupo.value, 'MANUTENCAO')}><TrashIcon className="w-4 h-4" /></Button>
                    </div>
                    {openManutencaoGroups[grupo.value] && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                        {/* Table 1: Spaces */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase text-gray-500">{tt('Espaços', 'Spaces')}</h4>
                          <div className="border rounded divide-y dark:border-gray-700 dark:divide-gray-700">
                            {Array.from(new Set(grupo.items.map(i => i.espaco))).sort().map(space => (
                              <div key={space} className="flex items-center justify-between p-2 text-sm">
                                {editingSpace?.category === grupo.value && editingSpace.name === space ? (
                                  <Input value={editSpaceName} onChange={(e) => setEditSpaceName(e.target.value)} className="h-7" autoFocus onBlur={() => void handleUpdateSpace(grupo.value, space, editSpaceName)} />
                                ) : (
                                  <>
                                    <span>{space}</span>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingSpace({category: grupo.value, name: space}); setEditSpaceName(space); }}>✎</Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => void handleDeleteSpace(grupo.value, space)}>×</Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Table 2: Elements */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase text-gray-500">{tt('Elementos', 'Elements')}</h4>
                          <div className="border rounded divide-y dark:border-gray-700 dark:divide-gray-700">
                            {Array.from(new Set(grupo.items.map(i => i.itemVerificacao))).sort().map(el => (
                              <div key={el} className="flex items-center justify-between p-2 text-sm">
                                {editingElement?.category === grupo.value && editingElement.name === el ? (
                                  <Input value={editElementName} onChange={(e) => setEditElementName(e.target.value)} className="h-7" autoFocus onBlur={() => void handleUpdateElement(grupo.value, el, editElementName)} />
                                ) : (
                                  <>
                                    <span>{el}</span>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingElement({category: grupo.value, name: el}); setEditElementName(el); }}>✎</Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={() => void handleDeleteElement(grupo.value, el)}>×</Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'TRANSPORTES' && (
              <div className="space-y-4">
                <h3 className="font-semibold">{tt('Transportes', 'Transports')} ({transportes.length})</h3>
                {transportesPorCategoria.map(grupo => (
                  <div key={grupo.value} className="border dark:border-gray-700 rounded-md p-2">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => toggleTransporteGroup(grupo.value)} className="font-medium">{formatCategoryName(grupo.value)} ({grupo.items.length})</button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => void handleDeleteCategory(grupo.value, 'TRANSPORTE')}><TrashIcon className="w-4 h-4" /></Button>
                    </div>
                    {openTransporteGroups[grupo.value] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {grupo.items.map(item => (
                          <div key={item.id} className="p-2 border dark:border-gray-700 rounded-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.matricula} ({item.tipo})</span>
                              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => void handleDeleteTransporte(item.id)}>×</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
