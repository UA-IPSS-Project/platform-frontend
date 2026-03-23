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

type CatalogPanel = 'MATERIAIS' | 'TRANSPORTES' | 'MANUTENCOES';
type ExpandedFormState = 'EQUAL' | 'FORM' | 'LIST';

const MAX_LOAD_CATALOGO_RETRIES = 4;

const isRetryableStatus = (status?: number) => [500, 502, 503, 504].includes(status ?? 0);

export function RequisitionsCatalogManagement() {
  const { i18n } = useTranslation();
  const tt = (pt: string, en: string) => (i18n.language.startsWith('en') ? en : pt);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [savingTransporte, setSavingTransporte] = useState(false);
  const [savingManutencaoItem, setSavingManutencaoItem] = useState(false);

  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [manutencaoItems, setManutencaoItems] = useState<ManutencaoItem[]>([]);

  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingTransporteId, setEditingTransporteId] = useState<number | null>(null);
  const [editingManutencaoItemId, setEditingManutencaoItemId] = useState<number | null>(null);

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

  const [editManutencaoCategoria, setEditManutencaoCategoria] = useState('');
  const [editManutencaoEspaco, setEditManutencaoEspaco] = useState('');
  const [editManutencaoVerificacao, setEditManutencaoVerificacao] = useState('');

  const [activePanel, setActivePanel] = useState<CatalogPanel>('MATERIAIS');
  const [openAddPanels, setOpenAddPanels] = useState<Record<CatalogPanel, boolean>>({
    MATERIAIS: true,
    TRANSPORTES: false,
    MANUTENCOES: false,
  });
  const [openMaterialGroups, setOpenMaterialGroups] = useState<Record<string, boolean>>({});
  const [openTransporteGroups, setOpenTransporteGroups] = useState<Record<string, boolean>>({});
  const [expandedForm, setExpandedForm] = useState<ExpandedFormState>('EQUAL');

  const uniqueMateriaisCategorias = Array.from(new Set(materiais.map(m => m.categoria).filter(Boolean)));
  const uniqueTransportesCategorias = Array.from(new Set(transportes.map(t => t.categoria).filter(Boolean)));
  const uniqueManutencaoCategorias = Array.from(new Set(manutencaoItems.map(m => m.categoria).filter(Boolean)));
  const [openManutencaoGroups, setOpenManutencaoGroups] = useState<Record<string, boolean>>({});

  const toggleManutencaoGroup = (categoria: string) => {
    setOpenManutencaoGroups((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  const manutencaoPorCategoria = uniqueManutencaoCategorias
    .map((cat) => ({
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
      if (status === 401 || status === 403) {
        return;
      }
      if (isRetryableStatus(status)) {
        pendingRetryableStatuses.push(status ?? 0);
      } else {
        toast.error((materiaisResult.reason as Error)?.message || tt('Erro ao carregar materiais.', 'Error loading materials.'));
      }
    }

    if (transportesResult.status === 'fulfilled') {
      setTransportes(Array.isArray(transportesResult.value) ? transportesResult.value : []);
    } else {
      const status = (transportesResult.reason as ApiRequestError)?.status;
      if (status === 401 || status === 403) {
        return;
      }
      if (isRetryableStatus(status)) {
        pendingRetryableStatuses.push(status ?? 0);
      } else {
        toast.error((transportesResult.reason as Error)?.message || tt('Erro ao carregar transportes.', 'Error loading transport options.'));
      }
    }

    if (manutencaoResult.status === 'fulfilled') {
      setManutencaoItems(Array.isArray(manutencaoResult.value) ? manutencaoResult.value : []);
    } else {
      const status = (manutencaoResult.reason as ApiRequestError)?.status;
      if (status !== 404 && status !== 401 && status !== 403) {
        if (isRetryableStatus(status)) {
          pendingRetryableStatuses.push(status ?? 0);
        } else {
          toast.error((manutencaoResult.reason as Error)?.message || tt('Erro ao carregar itens de manutenção.', 'Error loading maintenance items.'));
        }
      }
      if (status === 404) {
        setManutencaoItems([]);
      }
    }

    if (pendingRetryableStatuses.length > 0 && retryCount < MAX_LOAD_CATALOGO_RETRIES) {
      const delay = 500 * (retryCount + 1);
      setTimeout(() => {
        void loadCatalogo(retryCount + 1);
      }, delay);
    }
  };

  useEffect(() => {
    void loadCatalogo(0);
  }, []);

  const handleCreateMaterial = async () => {
    if (!novoMaterialNome.trim()) {
      toast.error(tt('O nome do material é obrigatório.', 'Material name is required.'));
      return;
    }
    if (!novoMaterialAtributo.trim() || !novoMaterialValorAtributo.trim()) {
      toast.error(tt('Atributo e valor do atributo são obrigatórios.', 'Attribute and attribute value are required.'));
      return;
    }

    try {
      setSavingMaterial(true);
      const novoMaterial = await requisicoesApi.criarMaterialCatalogo({
        nome: novoMaterialNome.trim(),
        categoria: novoMaterialCategoria,
        atributo: novoMaterialAtributo.trim(),
        valorAtributo: novoMaterialValorAtributo.trim(),
      });

      setMateriais((prev) => [...prev, novoMaterial]);
      setNovoMaterialNome('');
      setNovoMaterialCategoria('OUTROS');
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
      !novoTransporteCodigo.trim()
      || !novoTransporteTipo.trim()
      || !novoTransporteMatricula.trim()
      || !novoTransporteMarca.trim()
      || !novoTransporteModelo.trim()
      || !novoTransporteLotacao.trim()
      || !novoTransporteDataMatricula
    ) {
      toast.error(tt('Todos os campos de criação de transporte são obrigatórios.', 'All transport creation fields are required.'));
      return;
    }

    const lotacao = Number(novoTransporteLotacao);
    if (!Number.isFinite(lotacao) || lotacao <= 0) {
      toast.error(tt('A lotação deve ser um número maior que zero.', 'Capacity must be a number greater than zero.'));
      return;
    }

    try {
      setSavingTransporte(true);
      const novoTransporte = await requisicoesApi.criarTransporteCatalogo({
        codigo: novoTransporteCodigo.trim().toUpperCase(),
        tipo: novoTransporteTipo.trim(),
        categoria: novoTransporteCategoria,
        matricula: novoTransporteMatricula.trim().toUpperCase(),
        marca: novoTransporteMarca.trim(),
        modelo: novoTransporteModelo.trim(),
        lotacao,
        dataMatricula: novoTransporteDataMatricula,
      });

      setTransportes((prev) => [...prev, novoTransporte]);
      setNovoTransporteTipo('');
      setNovoTransporteCodigo('');
      setNovoTransporteCategoria('LIGEIRO');
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

  const handleCreateManutencaoItem = async () => {
    if (!novoManutencaoCategoria.trim() || !novoManutencaoEspaco.trim() || !novoManutencaoVerificacao.trim()) {
      toast.error(tt('Todos os campos são obrigatórios.', 'All fields are required.'));
      return;
    }

    try {
      setSavingManutencaoItem(true);
      const novoItem = await requisicoesApi.criarManutencaoItem({
        categoria: novoManutencaoCategoria.trim(),
        espaco: novoManutencaoEspaco.trim(),
        itemVerificacao: novoManutencaoVerificacao.trim(),
      });
      setManutencaoItems((prev) => [...prev, novoItem]);
      setNovoManutencaoCategoria('');
      setNovoManutencaoEspaco('');
      setNovoManutencaoVerificacao('');
      await loadCatalogo();
      toast.success(tt('Item de manutenção criado.', 'Maintenance item created.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao criar item.', 'Error creating item.'));
    } finally {
      setSavingManutencaoItem(false);
    }
  };

  const startEditMaterial = (item: MaterialCatalogo) => {
    setEditingMaterialId(item.id);
    setEditMaterialNome(item.nome || '');
    setEditMaterialCategoria(item.categoria || 'OUTROS');
    setEditMaterialAtributo(item.atributo || '');
    setEditMaterialValorAtributo(item.valorAtributo || '');
  };

  const startEditTransporte = (item: TransporteCatalogo) => {
    setEditingTransporteId(item.id);
    setEditTransporteTipo(item.tipo || '');
    setEditTransporteCodigo(item.codigo || '');
    setEditTransporteCategoria(item.categoria || 'LIGEIRO');
    setEditTransporteMatricula(item.matricula || '');
    setEditTransporteMarca(item.marca || '');
    setEditTransporteModelo(item.modelo || '');
    setEditTransporteLotacao(item.lotacao ? String(item.lotacao) : '');
    setEditTransporteDataMatricula(item.dataMatricula || '');
  };

  const startEditManutencaoItem = (item: ManutencaoItem) => {
    setEditingManutencaoItemId(item.id);
    setEditManutencaoCategoria(item.categoria || '');
    setEditManutencaoEspaco(item.espaco || '');
    setEditManutencaoVerificacao(item.itemVerificacao || '');
  };

  const handleUpdateMaterial = async () => {
    if (editingMaterialId == null) return;
    try {
      const atualizado = await requisicoesApi.atualizarMaterialCatalogo(editingMaterialId, {
        nome: editMaterialNome,
        categoria: editMaterialCategoria,
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
      const atualizado = await requisicoesApi.atualizarTransporteCatalogo(editingTransporteId, {
        codigo: editTransporteCodigo || undefined,
        tipo: editTransporteTipo,
        categoria: editTransporteCategoria,
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

  const handleUpdateManutencaoItem = async () => {
    if (editingManutencaoItemId == null) return;
    try {
      const atualizado = await requisicoesApi.atualizarManutencaoItem(editingManutencaoItemId, {
        categoria: editManutencaoCategoria.trim(),
        espaco: editManutencaoEspaco.trim(),
        itemVerificacao: editManutencaoVerificacao.trim(),
      });
      setManutencaoItems((prev) => prev.map((item) => (item.id === editingManutencaoItemId ? atualizado : item)));
      setEditingManutencaoItemId(null);
      await loadCatalogo();
      toast.success(tt('Item atualizado com sucesso.', 'Item updated successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao atualizar item.', 'Error updating item.'));
    }
  };

  const handleDeleteMaterial = async (id: number) => {
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
    try {
      await requisicoesApi.apagarTransporteCatalogo(id);
      setTransportes((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success(tt('Transporte apagado com sucesso.', 'Transport deleted successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao apagar transporte.', 'Error deleting transport.'));
    }
  };

  const handleDeleteManutencaoItem = async (id: number) => {
    try {
      await requisicoesApi.apagarManutencaoItem(id);
      setManutencaoItems((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success(tt('Item apagado com sucesso.', 'Item deleted successfully.'));
    } catch (error: any) {
      toast.error(error?.message || tt('Erro ao apagar item.', 'Error deleting item.'));
    }
  };

  const toggleAddPanel = (panel: CatalogPanel) => {
    setOpenAddPanels((prev) => {
      const willOpen = !prev[panel];
      return {
        MATERIAIS: false,
        TRANSPORTES: false,
        MANUTENCOES: false,
        [panel]: willOpen,
      };
    });
    setActivePanel(panel);
  };

  const toggleMaterialGroup = (categoria: MaterialCategoria) => {
    setOpenMaterialGroups((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  const toggleTransporteGroup = (categoria: string) => {
    setOpenTransporteGroups((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }));
  };

  const materiaisPorCategoria = uniqueMateriaisCategorias.map((cat) => ({
    value: cat,
    label: cat,
    items: materiais.filter((material) => material.categoria === cat),
  }));

  const transportesPorCategoria = uniqueTransportesCategorias
    .map((cat) => ({
      value: cat,
      label: cat,
      items: transportes.filter((t) => t.categoria === cat),
    }))
    .filter((grupo) => grupo.items.length > 0);

  const leftColSpan = expandedForm === 'FORM' ? 'xl:col-span-8' : (expandedForm === 'LIST' ? 'xl:col-span-4' : 'xl:col-span-5');
  const rightColSpan = expandedForm === 'FORM' ? 'xl:col-span-4' : (expandedForm === 'LIST' ? 'xl:col-span-8' : 'xl:col-span-7');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className={`${leftColSpan} space-y-4 transition-all duration-300`} onClick={() => setExpandedForm('FORM')}>
        <GlassCard className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAddPanel('MATERIAIS')}
            className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left"
          >
            <span className="font-semibold text-gray-800 dark:text-white">{tt('Adicionar material', 'Add material')}</span>
            <span className="text-sm text-gray-500">{openAddPanels.MATERIAIS ? '▾' : '▸'}</span>
          </button>

          {openAddPanels.MATERIAIS ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="admin-material-categoria" className="text-sm text-gray-600 dark:text-gray-300">{tt('Categoria (escolha ou crie nova)', 'Category (choose or create new)')}</label>
                <Input
                  id="admin-material-categoria"
                  list="materiais-categorias-list"
                  value={novoMaterialCategoria}
                  onChange={(e) => setNovoMaterialCategoria(e.target.value)}
                  className={inputFieldClassName}
                  placeholder={tt('Ex: Escrita', 'Ex: Writing')}
                />
                <datalist id="materiais-categorias-list">
                  {uniqueMateriaisCategorias.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="admin-material-nome" className="text-sm text-gray-600 dark:text-gray-300">{tt('Nome do material', 'Material name')}</label>
                <Input id="admin-material-nome" className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-material-atributo" className="text-sm text-gray-600 dark:text-gray-300">{tt('Atributo (ex: Cor)', 'Attribute (ex: Color)')}</label>
                  <Input id="admin-material-atributo" className={inputFieldClassName} value={novoMaterialAtributo} onChange={(e) => setNovoMaterialAtributo(e.target.value)} placeholder="Cor" />
                </div>
                <div>
                  <label htmlFor="admin-material-valor-atributo" className="text-sm text-gray-600 dark:text-gray-300">{tt('Valor do atributo (ex: Verde)', 'Attribute value (ex: Green)')}</label>
                  <Input id="admin-material-valor-atributo" className={inputFieldClassName} value={novoMaterialValorAtributo} onChange={(e) => setNovoMaterialValorAtributo(e.target.value)} placeholder="Verde" />
                </div>
              </div>

              <Button onClick={() => void handleCreateMaterial()} disabled={savingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">
                {savingMaterial ? tt('A criar...', 'Creating...') : tt('Adicionar material', 'Add material')}
              </Button>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAddPanel('TRANSPORTES')}
            className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left"
          >
            <span className="font-semibold text-gray-800 dark:text-white">{tt('Adicionar transporte', 'Add transport')}</span>
            <span className="text-sm text-gray-500">{openAddPanels.TRANSPORTES ? '▾' : '▸'}</span>
          </button>

          {openAddPanels.TRANSPORTES ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-transporte-codigo" className="text-sm text-gray-600 dark:text-gray-300">{tt('Código interno', 'Internal code')}</label>
                  <Input id="admin-transporte-codigo" className={inputFieldClassName} value={novoTransporteCodigo} onChange={(e) => setNovoTransporteCodigo(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-tipo" className="text-sm text-gray-600 dark:text-gray-300">{tt('Tipo', 'Type')}</label>
                  <Input id="admin-transporte-tipo" className={inputFieldClassName} value={novoTransporteTipo} onChange={(e) => setNovoTransporteTipo(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="admin-transporte-categoria" className="text-sm text-gray-600 dark:text-gray-300">{tt('Categoria (escolha ou crie nova)', 'Category (choose or create new)')}</label>
                  <Input
                    id="admin-transporte-categoria"
                    list="transportes-categorias-list"
                    value={novoTransporteCategoria}
                    onChange={(e) => setNovoTransporteCategoria(e.target.value)}
                    className={inputFieldClassName}
                    placeholder={tt('Ex: Ligeiro', 'Ex: Light')}
                  />
                  <datalist id="transportes-categorias-list">
                    {uniqueTransportesCategorias.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="admin-transporte-matricula" className="text-sm text-gray-600 dark:text-gray-300">{tt('Matrícula', 'License plate')}</label>
                  <Input id="admin-transporte-matricula" className={inputFieldClassName} value={novoTransporteMatricula} onChange={(e) => setNovoTransporteMatricula(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-lotacao" className="text-sm text-gray-600 dark:text-gray-300">{tt('Lotação', 'Capacity')}</label>
                  <Input id="admin-transporte-lotacao" className={inputFieldClassName} type="number" min="1" value={novoTransporteLotacao} onChange={(e) => setNovoTransporteLotacao(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-marca" className="text-sm text-gray-600 dark:text-gray-300">{tt('Marca', 'Brand')}</label>
                  <Input id="admin-transporte-marca" className={inputFieldClassName} value={novoTransporteMarca} onChange={(e) => setNovoTransporteMarca(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-modelo" className="text-sm text-gray-600 dark:text-gray-300">{tt('Modelo', 'Model')}</label>
                  <Input id="admin-transporte-modelo" className={inputFieldClassName} value={novoTransporteModelo} onChange={(e) => setNovoTransporteModelo(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-data" className="text-sm text-gray-600 dark:text-gray-300">{tt('Data matrícula', 'Registration date')}</label>
                  <Input id="admin-transporte-data" className={inputFieldClassName} type="date" value={novoTransporteDataMatricula} onChange={(e) => setNovoTransporteDataMatricula(e.target.value)} />
                </div>
              </div>

              <Button onClick={() => void handleCreateTransporte()} disabled={savingTransporte} className="bg-purple-600 hover:bg-purple-700 text-white">
                {savingTransporte ? tt('A criar...', 'Creating...') : tt('Adicionar transporte', 'Add transport')}
              </Button>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAddPanel('MANUTENCOES')}
            className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left"
          >
            <span className="font-semibold text-gray-800 dark:text-white">{tt('Adicionar item de manutenção', 'Add maintenance type')}</span>
            <span className="text-sm text-gray-500">{openAddPanels.TIPOS ? '▾' : '▸'}</span>
          </button>

          {openAddPanels.MANUTENCOES ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Categoria (escolha ou crie nova)', 'Category')}</label>
                <Input
                  list="manutencao-categorias-list"
                  className={inputFieldClassName}
                  placeholder={tt('Ex: CATL', 'Ex: CATL')}
                  value={novoManutencaoCategoria}
                  onChange={(e) => setNovoManutencaoCategoria(e.target.value)}
                />
                <datalist id="manutencao-categorias-list">
                  {uniqueManutencaoCategorias.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Espaço', 'Space')}</label>
                  <Input className={inputFieldClassName} placeholder={tt('Ex: Sala 1', 'Ex: Room 1')} value={novoManutencaoEspaco} onChange={(e) => setNovoManutencaoEspaco(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">{tt('Item de verificação', 'Verification item')}</label>
                  <Input className={inputFieldClassName} placeholder={tt('Ex: Lâmpadas', 'Ex: Lamps')} value={novoManutencaoVerificacao} onChange={(e) => setNovoManutencaoVerificacao(e.target.value)} />
                </div>
              </div>

              <Button onClick={() => void handleCreateManutencaoItem()} disabled={savingManutencaoItem} className="bg-purple-600 hover:bg-purple-700 text-white">
                {savingManutencaoItem ? tt('A criar...', 'Creating...') : tt('Adicionar item', 'Add item')}
              </Button>
            </div>
          ) : null}
        </GlassCard>
      </div>

      <div className={`${rightColSpan} transition-all duration-300`} onClick={() => setExpandedForm('LIST')}>
        <GlassCard className="p-6 space-y-4">
          {activePanel === 'MATERIAIS' ? (
            <>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">{tt('Editar materiais por categoria', 'Edit materials by category')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tt('Materiais no catálogo', 'Materials in catalog')}: {materiais.length}</p>

              <div className="space-y-2">
                {materiaisPorCategoria.map((grupo) => (
                  <div key={grupo.value} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <button
                      type="button"
                      onClick={() => toggleMaterialGroup(grupo.value)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-100">{grupo.label} <span className="text-gray-500">({grupo.items.length})</span></span>
                      <span className="text-sm text-gray-500">{openMaterialGroups[grupo.value] ? '▾' : '▸'}</span>
                    </button>

                    {openMaterialGroups[grupo.value] ? (
                      <div className="mt-2 space-y-2 max-h-72 overflow-auto">
                        {grupo.items.length === 0 ? (
                          <p className="text-sm text-gray-500">{tt('Sem materiais nesta categoria.', 'No materials in this category.')}</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {grupo.items.map((item) => (
                              <div key={item.id} className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-3 text-sm">
                              {editingMaterialId === item.id ? (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Nome', 'Name')}</p>
                                    <Input className={inputFieldClassName} value={editMaterialNome} onChange={(e) => setEditMaterialNome(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Categoria', 'Category')}</p>
                                    <Input
                                      list="materiais-categorias-list"
                                      value={editMaterialCategoria}
                                      onChange={(e) => setEditMaterialCategoria(e.target.value)}
                                      className={inputFieldClassName}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Atributo', 'Attribute')}</p>
                                      <Input className={inputFieldClassName} value={editMaterialAtributo} onChange={(e) => setEditMaterialAtributo(e.target.value)} />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Valor do atributo', 'Attribute value')}</p>
                                      <Input className={inputFieldClassName} value={editMaterialValorAtributo} onChange={(e) => setEditMaterialValorAtributo(e.target.value)} />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => void handleUpdateMaterial()}>{tt('Guardar', 'Save')}</Button>
                                    <Button variant="outline" onClick={() => setEditingMaterialId(null)}>{tt('Cancelar', 'Cancel')}</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={item.nome}>{item.nome}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.atributo}: {item.valorAtributo}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" className="h-8 px-3" onClick={() => startEditMaterial(item)}>{tt('Editar', 'Edit')}</Button>
                                    <Button variant="outline" className="h-8 px-3" onClick={() => void handleDeleteMaterial(item.id)}>{tt('Apagar', 'Delete')}</Button>
                                  </div>
                                </div>
                              )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {activePanel === 'TRANSPORTES' ? (
            <>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">{tt('Editar transportes', 'Edit transport options')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tt('Transportes no catálogo', 'Transport options in catalog')}: {transportes.length}</p>

              <div className="space-y-2">
                {transportesPorCategoria.length === 0 ? (
                  <p className="text-sm text-gray-500">{tt('Sem transportes no catálogo.', 'No transport options in catalog.')}</p>
                ) : transportesPorCategoria.map((grupo) => (
                  <div key={grupo.value} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <button
                      type="button"
                      onClick={() => toggleTransporteGroup(grupo.value)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {grupo.label} <span className="text-gray-500">({grupo.items.length} {tt('viatura', 'vehicle')}{grupo.items.length !== 1 ? 's' : ''})</span>
                      </span>
                      <span className="text-sm text-gray-500">{openTransporteGroups[grupo.value] ? '▾' : '▸'}</span>
                    </button>

                    {openTransporteGroups[grupo.value] ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {grupo.items.map((item) => (
                          <div key={item.id} className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-3 text-sm">
                            {editingTransporteId === item.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Código', 'Code')}</p>
                                    <Input className={inputFieldClassName} value={editTransporteCodigo} onChange={(e) => setEditTransporteCodigo(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Tipo', 'Type')}</p>
                                    <Input className={inputFieldClassName} value={editTransporteTipo} onChange={(e) => setEditTransporteTipo(e.target.value)} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Categoria', 'Category')}</p>
                                  <Input
                                    list="transportes-categorias-list"
                                    value={editTransporteCategoria}
                                    onChange={(e) => setEditTransporteCategoria(e.target.value)}
                                    className={inputFieldClassName}
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Matrícula', 'License plate')}</p>
                                  <Input className={inputFieldClassName} value={editTransporteMatricula} onChange={(e) => setEditTransporteMatricula(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Marca', 'Brand')}</p>
                                    <Input className={inputFieldClassName} value={editTransporteMarca} onChange={(e) => setEditTransporteMarca(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Modelo', 'Model')}</p>
                                    <Input className={inputFieldClassName} value={editTransporteModelo} onChange={(e) => setEditTransporteModelo(e.target.value)} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Lotação', 'Capacity')}</p>
                                    <Input className={inputFieldClassName} type="number" min="1" value={editTransporteLotacao} onChange={(e) => setEditTransporteLotacao(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{tt('Data matrícula', 'Registration date')}</p>
                                    <Input className={inputFieldClassName} type="date" value={editTransporteDataMatricula} onChange={(e) => setEditTransporteDataMatricula(e.target.value)} />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => void handleUpdateTransporte()}>{tt('Guardar', 'Save')}</Button>
                                  <Button variant="outline" onClick={() => setEditingTransporteId(null)}>{tt('Cancelar', 'Cancel')}</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1 min-w-0">
                                    {item.codigo ? (
                                      <span className="inline-block text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded px-2 py-0.5 mb-1">{item.codigo}</span>
                                    ) : null}
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.tipo}</p>
                                    {item.marca || item.modelo ? (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{[item.marca, item.modelo].filter(Boolean).join(' ')}</p>
                                    ) : null}
                                    {item.matricula ? (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.matricula}</p>
                                    ) : null}
                                    {item.lotacao ? (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{tt('Lotação', 'Capacity')}: {item.lotacao} {tt('lugares', 'seats')}</p>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" className="h-8 px-3" onClick={() => startEditTransporte(item)}>{tt('Editar', 'Edit')}</Button>
                                  <Button variant="outline" className="h-8 px-3" onClick={() => void handleDeleteTransporte(item.id)}>{tt('Apagar', 'Delete')}</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {activePanel === 'MANUTENCOES' ? (
            <>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">{tt('Editar itens de manutenção', 'Edit maintenance types')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tt('Itens no catálogo', 'Types in catalog')}: {manutencaoItems.length}</p>

              <div className="space-y-2">
                {manutencaoPorCategoria.length === 0 ? (
                  <p className="text-sm text-gray-500">{tt('Sem itens no catálogo.', 'No items in catalog.')}</p>
                ) : manutencaoPorCategoria.map((grupo) => (
                  <div key={grupo.value} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <button
                      type="button"
                      onClick={() => toggleManutencaoGroup(grupo.value)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {grupo.label} <span className="text-gray-500">({grupo.items.length})</span>
                      </span>
                      <span className="text-sm text-gray-500">{openManutencaoGroups[grupo.value] ? '▾' : '▸'}</span>
                    </button>

                    {openManutencaoGroups[grupo.value] ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {grupo.items.map((item) => (
                          <div key={item.id} className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-3 text-sm">
                            {editingManutencaoItemId === item.id ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-600 dark:text-gray-300">{tt('Categoria', 'Category')}</label>
                                  <Input list="manutencao-categorias-list" className={inputFieldClassName} value={editManutencaoCategoria} onChange={(e) => setEditManutencaoCategoria(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-300">{tt('Espaço', 'Space')}</label>
                                    <Input className={inputFieldClassName} value={editManutencaoEspaco} onChange={(e) => setEditManutencaoEspaco(e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-300">{tt('Verificação', 'Verification')}</label>
                                    <Input className={inputFieldClassName} value={editManutencaoVerificacao} onChange={(e) => setEditManutencaoVerificacao(e.target.value)} />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => void handleUpdateManutencaoItem()}>{tt('Guardar', 'Save')}</Button>
                                  <Button variant="outline" onClick={() => setEditingManutencaoItemId(null)}>{tt('Cancelar', 'Cancel')}</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">{item.itemVerificacao}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{tt('Espaço', 'Space')}: {item.espaco}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" className="h-8 px-3" onClick={() => startEditManutencaoItem(item)}>{tt('Editar', 'Edit')}</Button>
                                  <Button variant="outline" className="h-8 px-3" onClick={() => void handleDeleteManutencaoItem(item.id)}>{tt('Apagar', 'Delete')}</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
