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
import { TrashIcon } from '../shared/CustomIcons';
import { DatePickerField } from '../ui/date-picker-field';

type CatalogPanel = 'MATERIAIS' | 'TRANSPORTES' | 'MANUTENCOES';
type ExpandedFormState = 'EQUAL' | 'FORM' | 'LIST';

const MAX_LOAD_CATALOGO_RETRIES = 4;

const isRetryableStatus = (status?: number) => [500, 502, 503, 504].includes(status ?? 0);

export function RequisitionsCatalogManagement() {
  const { t } = useTranslation();

  const formatCategoryName = (name: string) => name.toUpperCase();

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
  const [customEditMaterialCategory, setCustomEditMaterialCategory] = useState('');
  const [customEditTransporteCategory, setCustomEditTransporteCategory] = useState('');

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
  // Código de transporte é gerado automaticamente
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
      else toast.error((materiaisResult.reason as Error)?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    }

    if (transportesResult.status === 'fulfilled') {
      setTransportes(Array.isArray(transportesResult.value) ? transportesResult.value : []);
    } else {
      const status = (transportesResult.reason as ApiRequestError)?.status;
      if (status === 401 || status === 403) return;
      if (isRetryableStatus(status)) pendingRetryableStatuses.push(status ?? 0);
      else toast.error((transportesResult.reason as Error)?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    }

    if (manutencaoResult.status === 'fulfilled') {
      setManutencaoItems(Array.isArray(manutencaoResult.value) ? manutencaoResult.value : []);
    } else {
      const status = (manutencaoResult.reason as ApiRequestError)?.status;
      if (status !== 404 && status !== 401 && status !== 403) {
        if (isRetryableStatus(status)) pendingRetryableStatuses.push(status ?? 0);
        else toast.error((manutencaoResult.reason as Error)?.message || t('dashboard.admin.catalogs.errors.loadMaintenance'));
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
      toast.error(t('dashboard.admin.catalogs.errors.requiredFields'));
      return;
    }

    try {
      const categoriaFinal = (materialCategoryMode === 'NEW' ? customMaterialCategory : novoMaterialCategoria).trim();
      if (!categoriaFinal) {
        toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
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
      toast.success(t('dashboard.admin.catalogs.success.materialCreated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleCreateTransporte = async () => {
    if (
      !novoTransporteTipo.trim() || !novoTransporteMatricula.trim() ||
      !novoTransporteMarca.trim() || !novoTransporteModelo.trim() || !novoTransporteLotacao.trim() || !novoTransporteDataMatricula
    ) {
      toast.error(t('dashboard.admin.catalogs.errors.requiredFields'));
      return;
    }

    const lotacao = Number(novoTransporteLotacao);
    if (!Number.isFinite(lotacao) || lotacao <= 0) {
      toast.error(t('dashboard.admin.catalogs.errors.capacityPositive'));
      return;
    }

    try {
      const categoriaFinal = (transporteCategoryMode === 'NEW' ? customTransporteCategory : novoTransporteCategoria).trim();
      if (!categoriaFinal) {
        toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
        return;
      }

      setSavingTransporte(true);
      // Gerar código automaticamente: V01, V02, ...
      const codigosExistentes = transportes.map(t => t.codigo).filter((c): c is string => !!c);
      let maxNum = 0;
      codigosExistentes.forEach(codigo => {
        const match = /^V(\d{2})$/.exec(codigo);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const novoCodigo = `V${String(maxNum + 1).padStart(2, '0')}`;

      const novoTransporte = await requisicoesApi.criarTransporteCatalogo({
        codigo: novoCodigo,
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
      setCustomTransporteCategory('');
      setTransporteCategoryMode('SELECT');
      setNovoTransporteMatricula('');
      setNovoTransporteMarca('');
      setNovoTransporteModelo('');
      setNovoTransporteLotacao('');
      setNovoTransporteDataMatricula('');
      await loadCatalogo();
      toast.success(t('dashboard.admin.catalogs.success.transportCreated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
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
        toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
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
      toast.success(t('dashboard.admin.catalogs.success.materialUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    }
  };

  const handleUpdateTransporte = async () => {
    if (editingTransporteId == null) return;
    try {
      const categoriaFinal = (editTransporteCategoryMode === 'NEW' ? customEditTransporteCategory : editTransporteCategoria).trim();
      if (!categoriaFinal) {
        toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
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
      toast.success(t('dashboard.admin.catalogs.success.transportUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteMaterial'))) return;
    try {
      await requisicoesApi.apagarMaterialCatalogo(id);
      setMateriais((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success(t('dashboard.admin.catalogs.success.materialDeleted'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaterials'));
    }
  };

  const handleDeleteTransporte = async (id: number) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteTransport'))) return;
    try {
      await requisicoesApi.apagarTransporteCatalogo(id);
      setTransportes((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success(t('dashboard.admin.catalogs.success.transportDeleted'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadTransports'));
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
      toast.success(t('dashboard.admin.catalogs.success.spaceUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaintenance'));
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
      toast.success(t('dashboard.admin.catalogs.success.elementUpdated'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaintenance'));
    }
  };

  const handleDeleteSpace = async (category: string, name: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteSpace', { name }))) return;
    try {
      const itemsToDelete = manutencaoItems.filter(i => i.categoria === category && i.espaco === name);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await loadCatalogo();
      toast.success(t('dashboard.admin.catalogs.success.spaceDeleted'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaintenance'));
    }
  };

  const handleDeleteElement = async (category: string, name: string) => {
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteElement', { name }))) return;
    try {
      const itemsToDelete = manutencaoItems.filter(i => i.categoria === category && i.itemVerificacao === name);
      await Promise.all(itemsToDelete.map(i => requisicoesApi.apagarManutencaoItem(i.id)));
      await loadCatalogo();
      toast.success(t('dashboard.admin.catalogs.success.elementDeleted'));
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.admin.catalogs.errors.loadMaintenance'));
    }
  };

  const handleDeleteCategory = async (category: string, type: 'MATERIAL' | 'TRANSPORTE' | 'MANUTENCAO') => {
    const formattedName = formatCategoryName(category);
    if (!window.confirm(t('dashboard.admin.catalogs.confirm.deleteCategory', { name: formattedName }))) return;
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
      toast.success(t('dashboard.admin.catalogs.success.categoryRemoved'));
    } catch (error) {
      toast.error(t('dashboard.admin.catalogs.errors.categoryRequired'));
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className={`${leftColSpan} space-y-4 transition-all duration-300`} onClick={() => setExpandedForm('FORM')}>
          {/* Material Add Panel */}
          <GlassCard className="p-4 space-y-3">
            <button onClick={() => toggleAddPanel('MATERIAIS')} className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">
              <span className="font-semibold text-gray-800 dark:text-white">{t('dashboard.admin.catalogs.addMaterial')}</span>
              <span className="text-sm text-gray-500">{openAddPanels.MATERIAIS ? '▾' : '▸'}</span>
            </button>
            {openAddPanels.MATERIAIS && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.catalogs.category')}</label>
                  <select value={materialCategoryMode === 'NEW' ? 'NEW' : novoMaterialCategoria} onChange={(e) => {
                    if (e.target.value === 'NEW') setMaterialCategoryMode('NEW');
                    else { setMaterialCategoryMode('SELECT'); setNovoMaterialCategoria(e.target.value as MaterialCategoria); }
                  }} className={selectFieldClassName}>
                    {uniqueMateriaisCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                    <option value="NEW">-- {t('dashboard.admin.catalogs.newCategory')} --</option>
                  </select>
                  {materialCategoryMode === 'NEW' && <Input className={inputFieldClassName + " mt-2"} value={customMaterialCategory} onChange={(e) => setCustomMaterialCategory(e.target.value)} />}
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.catalogs.materialName')}</label>
                  <Input className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.catalogs.attribute')}</label>
                    <Input className={inputFieldClassName} value={novoMaterialAtributo} onChange={(e) => setNovoMaterialAtributo(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.catalogs.value')}</label>
                    <Input className={inputFieldClassName} value={novoMaterialValorAtributo} onChange={(e) => setNovoMaterialValorAtributo(e.target.value)} />
                  </div>
                </div>
                <Button onClick={() => void handleCreateMaterial()} disabled={savingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">{t('dashboard.admin.catalogs.addMaterial')}</Button>
              </div>
            )}
          </GlassCard>

          {/* Transporte Add Panel */}
          <GlassCard className="p-4 space-y-3">
            <button onClick={() => toggleAddPanel('TRANSPORTES')} className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">
              <span className="font-semibold text-gray-800 dark:text-white">{t('dashboard.admin.catalogs.addTransport')}</span>
              <span className="text-sm text-gray-500">{openAddPanels.TRANSPORTES ? '▾' : '▸'}</span>
            </button>
            {openAddPanels.TRANSPORTES && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t('dashboard.admin.catalogs.code')} className={inputFieldClassName} value={(() => {
                    // Mostra o próximo código sugerido
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
                  })()} readOnly disabled />
                  <Input placeholder={t('dashboard.admin.catalogs.type')} className={inputFieldClassName} value={novoTransporteTipo} onChange={(e) => setNovoTransporteTipo(e.target.value)} />
                </div>
                <div>
                  <select value={transporteCategoryMode === 'NEW' ? 'NEW' : novoTransporteCategoria} onChange={(e) => {
                    if (e.target.value === 'NEW') setTransporteCategoryMode('NEW');
                    else { setTransporteCategoryMode('SELECT'); setNovoTransporteCategoria(e.target.value as TransporteCategoria); }
                  }} className={selectFieldClassName}>
                    {uniqueTransportesCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                    <option value="NEW">-- {t('dashboard.admin.catalogs.newCategory')} --</option>
                  </select>
                  {transporteCategoryMode === 'NEW' && <Input className={inputFieldClassName + " mt-2"} value={customTransporteCategory} onChange={(e) => setCustomTransporteCategory(e.target.value)} />}
                </div>
                <Input placeholder={t('dashboard.admin.catalogs.plate')} className={inputFieldClassName} value={novoTransporteMatricula} onChange={(e) => setNovoTransporteMatricula(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t('dashboard.admin.catalogs.brand')} className={inputFieldClassName} value={novoTransporteMarca} onChange={(e) => setNovoTransporteMarca(e.target.value)} />
                  <Input placeholder={t('dashboard.admin.catalogs.model')} className={inputFieldClassName} value={novoTransporteModelo} onChange={(e) => setNovoTransporteModelo(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={t('dashboard.admin.catalogs.capacity')} type="number" className={inputFieldClassName} value={novoTransporteLotacao} onChange={(e) => setNovoTransporteLotacao(e.target.value)} />
                  <div className="mt-1">
                    <DatePickerField
                      value={novoTransporteDataMatricula}
                      onChange={(val) => setNovoTransporteDataMatricula(val)}
                      placeholder={t('dashboard.admin.catalogs.regDate')}
                    />
                  </div>
                </div>
                <Button onClick={() => void handleCreateTransporte()} disabled={savingTransporte} className="bg-purple-600 hover:bg-purple-700 text-white">{t('dashboard.admin.catalogs.addTransport')}</Button>
              </div>
            )}
          </GlassCard>

          {/* Manutencao Add Panel */}
          <GlassCard className="p-4 space-y-3">
            <button onClick={() => toggleAddPanel('MANUTENCOES')} className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">
              <span className="font-semibold text-gray-800 dark:text-white">{t('dashboard.admin.catalogs.addMaintenance')}</span>
              <span className="text-sm text-gray-500">{openAddPanels.MANUTENCOES ? '▾' : '▸'}</span>
            </button>
            {openAddPanels.MANUTENCOES && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.admin.catalogs.category')}</label>
                  <select value={manutencaoCategoryMode === 'NEW' ? 'NEW' : novoManutencaoCategoria} onChange={(e) => {
                    if (e.target.value === 'NEW') setManutencaoCategoryMode('NEW');
                    else { setManutencaoCategoryMode('SELECT'); setNovoManutencaoCategoria(e.target.value); }
                  }} className={selectFieldClassName}>
                    <option value="">-- {t('dashboard.admin.catalogs.selectCategory')} --</option>
                    {uniqueManutencaoCategorias.map(cat => <option key={cat} value={cat}>{formatCategoryName(cat)}</option>)}
                    <option value="NEW">-- {t('dashboard.admin.catalogs.newCategory')} --</option>
                  </select>
                  {manutencaoCategoryMode === 'NEW' && <Input className={inputFieldClassName + " mt-2"} placeholder={t('dashboard.admin.catalogs.newCategoryName')} value={customManutencaoCategory} onChange={(e) => setCustomManutencaoCategory(e.target.value)} />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 border border-purple-100 dark:border-purple-900/30 rounded-lg bg-purple-50/20">
                    <h4 className="text-sm font-semibold text-purple-700">{t('dashboard.admin.catalogs.addSpace')}</h4>
                    <Input placeholder={t('dashboard.admin.catalogs.spaceName')} value={novoManutencaoEspaco} onChange={(e) => setNovoManutencaoEspaco(e.target.value)} className="h-9" />
                    <Button className="w-full h-9 bg-purple-600" onClick={async () => {
                      const cat = (manutencaoCategoryMode === 'NEW' ? customManutencaoCategory : novoManutencaoCategoria).trim();
                      if (!cat || !novoManutencaoEspaco.trim()) { toast.error(t('dashboard.admin.catalogs.errors.requiredFields')); return; }
                      try {
                        const elements = Array.from(new Set(manutencaoItems.filter(i => i.categoria === cat).map(i => i.itemVerificacao)));
                        const toCreate = elements.length > 0 ? elements : ['GERAL'];
                        await Promise.all(toCreate.map(el => requisicoesApi.criarManutencaoItem({ categoria: cat, espaco: novoManutencaoEspaco.trim(), itemVerificacao: el })));
                        setNovoManutencaoEspaco(''); await loadCatalogo(); toast.success(t('dashboard.admin.catalogs.success.spaceCreated'));
                      } catch (err: any) { toast.error(err.message); }
                    }}>{t('dashboard.admin.catalogs.createSpace')}</Button>
                  </div>

                  <div className="space-y-3 p-4 border border-blue-100 dark:border-blue-900/30 rounded-lg bg-blue-50/20">
                    <h4 className="text-sm font-semibold text-blue-700">{t('dashboard.admin.catalogs.addElement')}</h4>
                    <Input placeholder={t('dashboard.admin.catalogs.verificationElement')} value={novoManutencaoVerificacao} onChange={(e) => setNovoManutencaoVerificacao(e.target.value)} className="h-9" />
                    <Button className="w-full h-9 bg-blue-600" onClick={async () => {
                      const cat = (manutencaoCategoryMode === 'NEW' ? customManutencaoCategory : novoManutencaoCategoria).trim();
                      if (!cat || !novoManutencaoVerificacao.trim()) { toast.error(t('dashboard.admin.catalogs.errors.requiredFields')); return; }
                      try {
                        const spaces = Array.from(new Set(manutencaoItems.filter(i => i.categoria === cat).map(i => i.espaco)));
                        const toCreate = spaces.length > 0 ? spaces : ['GERAL'];
                        await Promise.all(toCreate.map(sp => requisicoesApi.criarManutencaoItem({ categoria: cat, espaco: sp, itemVerificacao: novoManutencaoVerificacao.trim() })));
                        setNovoManutencaoVerificacao(''); await loadCatalogo(); toast.success(t('dashboard.admin.catalogs.success.elementCreated'));
                      } catch (err: any) { toast.error(err.message); }
                    }}>{t('dashboard.admin.catalogs.createElement')}</Button>
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
                <h3 className="font-semibold">{t('dashboard.admin.catalogs.materials')} ({materiais.length})</h3>
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
                                  <Button size="sm" onClick={() => void handleUpdateMaterial()}>{t('common.ok')}</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingMaterialId(null)}>{t('common.cancel')}</Button>
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
                <h3 className="font-semibold">{t('dashboard.admin.catalogs.maintenance')} ({manutencaoItems.length})</h3>
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
                          <h4 className="text-xs font-bold uppercase text-gray-500">{t('dashboard.admin.catalogs.spaces')}</h4>
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
                          <h4 className="text-xs font-bold uppercase text-gray-500">{t('dashboard.admin.catalogs.elements')}</h4>
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
                <h3 className="font-semibold">{t('dashboard.admin.catalogs.transports')} ({transportes.length})</h3>
                {transportesPorCategoria.map(grupo => (
                  <div key={grupo.value} className="border dark:border-gray-700 rounded-md p-2">
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => toggleTransporteGroup(grupo.value)} className="font-medium">{formatCategoryName(grupo.value)} ({grupo.items.length})</button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => void handleDeleteCategory(grupo.value, 'TRANSPORTE')}><TrashIcon className="w-4 h-4" /></Button>
                    </div>
                    {openTransporteGroups[grupo.value] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {grupo.items.map(item => (
                          <div key={item.id} className="p-2 border dark:border-gray-700 rounded-sm bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between">
                              {editingTransporteId === item.id ? (
                                <div className="space-y-2 w-full">
                                  <Input value={editTransporteMatricula} onChange={(e) => setEditTransporteMatricula(e.target.value.toUpperCase())} className="h-8" placeholder={t('dashboard.admin.catalogs.plate')} />
                                  <Input value={editTransporteTipo} onChange={(e) => setEditTransporteTipo(e.target.value)} className="h-8" placeholder={t('dashboard.admin.catalogs.type')} />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => void handleUpdateTransporte()}>{t('common.ok')}</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingTransporteId(null)}>{t('common.cancel')}</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm">
                                    <span className="font-medium">{item.matricula}</span>
                                    <p className="text-xs text-gray-500">{item.tipo} · {item.marca} {item.modelo}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEditTransporte(item)}>Ed</Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => void handleDeleteTransporte(item.id)}>×</Button>
                                  </div>
                                </>
                              )}
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
