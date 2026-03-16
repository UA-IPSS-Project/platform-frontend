import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  MaterialCategoria,
  TipoManutencaoCatalogo,
  TransporteCategoria,
  requisicoesApi,
  type MaterialCatalogo,
  type TransporteCatalogo,
} from '../../services/api';
import type { ApiRequestError } from '../../services/api/core/client';
import { GlassCard } from '../ui/glass-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const MATERIAL_CATEGORIA_OPTIONS: Array<{ value: MaterialCategoria; label: string }> = [
  { value: 'ESCRITA', label: 'Escrita' },
  { value: 'PAPEL_E_ARQUIVO', label: 'Papel e arquivo' },
  { value: 'HIGIENE_E_LIMPEZA', label: 'Higiene e limpeza' },
  { value: 'TECNOLOGIA', label: 'Tecnologia' },
  { value: 'OUTROS', label: 'Outros' },
];

const TRANSPORTE_CATEGORIA_OPTIONS: Array<{ value: TransporteCategoria; label: string }> = [
  { value: 'LIGEIRO_DE_PASSAGEIROS', label: 'Ligeiro de passageiros' },
  { value: 'PESADO_DE_PASSAGEIROS', label: 'Pesado de passageiros' },
  { value: 'LIGEIRO_DE_MERCADORIAS', label: 'Ligeiro de mercadorias' },
  { value: 'LIGEIRO_ESPECIAL', label: 'Ligeiro especial' },
  { value: 'LIGEIRO', label: 'Ligeiro' },
  { value: 'PESADO', label: 'Pesado' },
  { value: 'PASSAGEIROS', label: 'Passageiros' },
  { value: 'ADAPTADO', label: 'Adaptado' },
];

type CatalogPanel = 'MATERIAIS' | 'TRANSPORTES' | 'TIPOS';

const DEFAULT_OPEN_MATERIAL_GROUPS: Record<MaterialCategoria, boolean> = {
  ESCRITA: true,
  PAPEL_E_ARQUIVO: false,
  HIGIENE_E_LIMPEZA: false,
  TECNOLOGIA: false,
  OUTROS: false,
};

const MAX_LOAD_CATALOGO_RETRIES = 4;

const isRetryableStatus = (status?: number) => [500, 502, 503, 504].includes(status ?? 0);

export function RequisitionsCatalogManagement() {
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [savingTransporte, setSavingTransporte] = useState(false);
  const [savingTipoManutencao, setSavingTipoManutencao] = useState(false);

  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [tiposManutencao, setTiposManutencao] = useState<TipoManutencaoCatalogo[]>([]);

  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [editingTransporteId, setEditingTransporteId] = useState<number | null>(null);
  const [editingTipoManutencaoId, setEditingTipoManutencaoId] = useState<number | null>(null);

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

  const [novoTipoManutencaoNome, setNovoTipoManutencaoNome] = useState('');
  const [novoTipoManutencaoDescricao, setNovoTipoManutencaoDescricao] = useState('');

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

  const [editTipoManutencaoNome, setEditTipoManutencaoNome] = useState('');
  const [editTipoManutencaoDescricao, setEditTipoManutencaoDescricao] = useState('');

  const [activePanel, setActivePanel] = useState<CatalogPanel>('MATERIAIS');
  const [openAddPanels, setOpenAddPanels] = useState<Record<CatalogPanel, boolean>>({
    MATERIAIS: true,
    TRANSPORTES: false,
    TIPOS: false,
  });
  const [openMaterialGroups, setOpenMaterialGroups] = useState<Record<MaterialCategoria, boolean>>(DEFAULT_OPEN_MATERIAL_GROUPS);
  const [openTransporteGroups, setOpenTransporteGroups] = useState<Record<string, boolean>>({});

  const selectFieldClassName = 'w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100';
  const inputFieldClassName = 'mt-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';

  const loadCatalogo = async (retryCount = 0) => {
    const [materiaisResult, transportesResult, tiposResult] = await Promise.allSettled([
      requisicoesApi.listarMateriais(),
      requisicoesApi.listarTransportes(),
      requisicoesApi.listarTiposManutencao(),
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
        toast.error((materiaisResult.reason as Error)?.message || 'Erro ao carregar materiais.');
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
        toast.error((transportesResult.reason as Error)?.message || 'Erro ao carregar transportes.');
      }
    }

    if (tiposResult.status === 'fulfilled') {
      setTiposManutencao(Array.isArray(tiposResult.value) ? tiposResult.value : []);
    } else {
      const status = (tiposResult.reason as ApiRequestError)?.status;
      if (status !== 404 && status !== 401 && status !== 403) {
        if (isRetryableStatus(status)) {
          pendingRetryableStatuses.push(status ?? 0);
        } else {
          toast.error((tiposResult.reason as Error)?.message || 'Erro ao carregar tipos de manutenção.');
        }
      }
      if (status === 404) {
        setTiposManutencao([]);
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
      toast.error('O nome do material é obrigatório.');
      return;
    }
    if (!novoMaterialAtributo.trim() || !novoMaterialValorAtributo.trim()) {
      toast.error('Atributo e valor do atributo são obrigatórios.');
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
      toast.success('Material criado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar material.');
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
      toast.error('Todos os campos de criação de transporte são obrigatórios.');
      return;
    }

    const lotacao = Number(novoTransporteLotacao);
    if (!Number.isFinite(lotacao) || lotacao <= 0) {
      toast.error('A lotação deve ser um número maior que zero.');
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
      toast.success('Transporte criado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar transporte.');
    } finally {
      setSavingTransporte(false);
    }
  };

  const handleCreateTipoManutencao = async () => {
    if (!novoTipoManutencaoNome.trim()) {
      toast.error('O nome do tipo de manutenção é obrigatório.');
      return;
    }

    try {
      setSavingTipoManutencao(true);
      const novoTipo = await requisicoesApi.criarTipoManutencao({
        nome: novoTipoManutencaoNome.trim(),
        descricao: novoTipoManutencaoDescricao.trim() || undefined,
      });
      setTiposManutencao((prev) => [...prev, novoTipo]);
      setNovoTipoManutencaoNome('');
      setNovoTipoManutencaoDescricao('');
      await loadCatalogo();
      toast.success('Tipo de manutenção criado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar tipo de manutenção.');
    } finally {
      setSavingTipoManutencao(false);
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

  const startEditTipoManutencao = (item: TipoManutencaoCatalogo) => {
    setEditingTipoManutencaoId(item.id);
    setEditTipoManutencaoNome(item.nome || '');
    setEditTipoManutencaoDescricao(item.descricao || '');
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
      toast.success('Material atualizado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar material.');
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
      toast.success('Transporte atualizado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar transporte.');
    }
  };

  const handleUpdateTipoManutencao = async () => {
    if (editingTipoManutencaoId == null) return;
    try {
      const atualizado = await requisicoesApi.atualizarTipoManutencao(editingTipoManutencaoId, {
        nome: editTipoManutencaoNome,
        descricao: editTipoManutencaoDescricao || undefined,
      });
      setTiposManutencao((prev) => prev.map((item) => (item.id === editingTipoManutencaoId ? atualizado : item)));
      setEditingTipoManutencaoId(null);
      await loadCatalogo();
      toast.success('Tipo de manutenção atualizado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar tipo de manutenção.');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      await requisicoesApi.apagarMaterialCatalogo(id);
      setMateriais((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success('Material apagado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao apagar material.');
    }
  };

  const handleDeleteTransporte = async (id: number) => {
    try {
      await requisicoesApi.apagarTransporteCatalogo(id);
      setTransportes((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success('Transporte apagado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao apagar transporte.');
    }
  };

  const handleDeleteTipoManutencao = async (id: number) => {
    try {
      await requisicoesApi.apagarTipoManutencao(id);
      setTiposManutencao((prev) => prev.filter((item) => item.id !== id));
      await loadCatalogo();
      toast.success('Tipo de manutenção apagado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao apagar tipo de manutenção.');
    }
  };

  const toggleAddPanel = (panel: CatalogPanel) => {
    setOpenAddPanels((prev) => {
      const willOpen = !prev[panel];
      return {
        MATERIAIS: false,
        TRANSPORTES: false,
        TIPOS: false,
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

  const materiaisPorCategoria = MATERIAL_CATEGORIA_OPTIONS.map((option) => ({
    ...option,
    items: materiais.filter((material) => material.categoria === option.value),
  }));

  const transportesPorCategoria = TRANSPORTE_CATEGORIA_OPTIONS
    .map((option) => ({
      ...option,
      items: transportes.filter((t) => t.categoria === option.value),
    }))
    .filter((grupo) => grupo.items.length > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-5 space-y-4">
        <GlassCard className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAddPanel('MATERIAIS')}
            className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left"
          >
            <span className="font-semibold text-gray-800 dark:text-white">Adicionar material</span>
            <span className="text-sm text-gray-500">{openAddPanels.MATERIAIS ? '▾' : '▸'}</span>
          </button>

          {openAddPanels.MATERIAIS ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="admin-material-nome" className="text-sm text-gray-600 dark:text-gray-300">Nome</label>
                <Input id="admin-material-nome" className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} />
              </div>

              <div>
                <label htmlFor="admin-material-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
                <select
                  id="admin-material-categoria"
                  value={novoMaterialCategoria}
                  onChange={(e) => setNovoMaterialCategoria(e.target.value as MaterialCategoria)}
                  className={selectFieldClassName}
                >
                  {MATERIAL_CATEGORIA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-material-atributo" className="text-sm text-gray-600 dark:text-gray-300">Atributo</label>
                  <Input id="admin-material-atributo" className={inputFieldClassName} value={novoMaterialAtributo} onChange={(e) => setNovoMaterialAtributo(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-material-valor-atributo" className="text-sm text-gray-600 dark:text-gray-300">Valor do atributo</label>
                  <Input id="admin-material-valor-atributo" className={inputFieldClassName} value={novoMaterialValorAtributo} onChange={(e) => setNovoMaterialValorAtributo(e.target.value)} />
                </div>
              </div>

              <Button onClick={() => void handleCreateMaterial()} disabled={savingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">
                {savingMaterial ? 'A criar...' : 'Adicionar material'}
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
            <span className="font-semibold text-gray-800 dark:text-white">Adicionar transporte</span>
            <span className="text-sm text-gray-500">{openAddPanels.TRANSPORTES ? '▾' : '▸'}</span>
          </button>

          {openAddPanels.TRANSPORTES ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-transporte-codigo" className="text-sm text-gray-600 dark:text-gray-300">Código interno</label>
                  <Input id="admin-transporte-codigo" className={inputFieldClassName} value={novoTransporteCodigo} onChange={(e) => setNovoTransporteCodigo(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
                  <Input id="admin-transporte-tipo" className={inputFieldClassName} value={novoTransporteTipo} onChange={(e) => setNovoTransporteTipo(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
                  <select
                    id="admin-transporte-categoria"
                    value={novoTransporteCategoria}
                    onChange={(e) => setNovoTransporteCategoria(e.target.value as TransporteCategoria)}
                    className={selectFieldClassName}
                  >
                    {TRANSPORTE_CATEGORIA_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-transporte-matricula" className="text-sm text-gray-600 dark:text-gray-300">Matrícula</label>
                  <Input id="admin-transporte-matricula" className={inputFieldClassName} value={novoTransporteMatricula} onChange={(e) => setNovoTransporteMatricula(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-lotacao" className="text-sm text-gray-600 dark:text-gray-300">Lotação</label>
                  <Input id="admin-transporte-lotacao" className={inputFieldClassName} type="number" min="1" value={novoTransporteLotacao} onChange={(e) => setNovoTransporteLotacao(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-marca" className="text-sm text-gray-600 dark:text-gray-300">Marca</label>
                  <Input id="admin-transporte-marca" className={inputFieldClassName} value={novoTransporteMarca} onChange={(e) => setNovoTransporteMarca(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-modelo" className="text-sm text-gray-600 dark:text-gray-300">Modelo</label>
                  <Input id="admin-transporte-modelo" className={inputFieldClassName} value={novoTransporteModelo} onChange={(e) => setNovoTransporteModelo(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="admin-transporte-data" className="text-sm text-gray-600 dark:text-gray-300">Data matrícula</label>
                  <Input id="admin-transporte-data" className={inputFieldClassName} type="date" value={novoTransporteDataMatricula} onChange={(e) => setNovoTransporteDataMatricula(e.target.value)} />
                </div>
              </div>

              <Button onClick={() => void handleCreateTransporte()} disabled={savingTransporte} className="bg-purple-600 hover:bg-purple-700 text-white">
                {savingTransporte ? 'A criar...' : 'Adicionar transporte'}
              </Button>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAddPanel('TIPOS')}
            className="w-full flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-left"
          >
            <span className="font-semibold text-gray-800 dark:text-white">Adicionar tipo de manutenção</span>
            <span className="text-sm text-gray-500">{openAddPanels.TIPOS ? '▾' : '▸'}</span>
          </button>

          {openAddPanels.TIPOS ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input className={inputFieldClassName} placeholder="Nome do tipo" value={novoTipoManutencaoNome} onChange={(e) => setNovoTipoManutencaoNome(e.target.value)} />
                <Input className={inputFieldClassName} placeholder="Descrição (opcional)" value={novoTipoManutencaoDescricao} onChange={(e) => setNovoTipoManutencaoDescricao(e.target.value)} />
              </div>

              <Button onClick={() => void handleCreateTipoManutencao()} disabled={savingTipoManutencao} className="bg-purple-600 hover:bg-purple-700 text-white">
                {savingTipoManutencao ? 'A criar...' : 'Adicionar tipo de manutenção'}
              </Button>
            </div>
          ) : null}
        </GlassCard>
      </div>

      <div className="xl:col-span-7">
        <GlassCard className="p-6 space-y-4">
          {activePanel === 'MATERIAIS' ? (
            <>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Editar materiais por categoria</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Materiais no catálogo: {materiais.length}</p>

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
                          <p className="text-sm text-gray-500">Sem materiais nesta categoria.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {grupo.items.map((item) => (
                              <div key={item.id} className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-3 text-sm">
                              {editingMaterialId === item.id ? (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Nome</p>
                                    <Input className={inputFieldClassName} value={editMaterialNome} onChange={(e) => setEditMaterialNome(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Categoria</p>
                                  <select
                                    value={editMaterialCategoria}
                                    onChange={(e) => setEditMaterialCategoria(e.target.value as MaterialCategoria)}
                                    className={selectFieldClassName}
                                  >
                                    {MATERIAL_CATEGORIA_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">Atributo</p>
                                      <Input className={inputFieldClassName} value={editMaterialAtributo} onChange={(e) => setEditMaterialAtributo(e.target.value)} />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300">Valor do atributo</p>
                                      <Input className={inputFieldClassName} value={editMaterialValorAtributo} onChange={(e) => setEditMaterialValorAtributo(e.target.value)} />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => void handleUpdateMaterial()}>Guardar</Button>
                                    <Button variant="outline" onClick={() => setEditingMaterialId(null)}>Cancelar</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={item.nome}>{item.nome}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.atributo}: {item.valorAtributo}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" className="h-8 px-3" onClick={() => startEditMaterial(item)}>Editar</Button>
                                    <Button variant="outline" className="h-8 px-3" onClick={() => void handleDeleteMaterial(item.id)}>Apagar</Button>
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
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Editar transportes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Transportes no catálogo: {transportes.length}</p>

              <div className="space-y-2">
                {transportesPorCategoria.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem transportes no catálogo.</p>
                ) : transportesPorCategoria.map((grupo) => (
                  <div key={grupo.value} className="rounded-md border border-gray-200 dark:border-gray-700 p-2">
                    <button
                      type="button"
                      onClick={() => toggleTransporteGroup(grupo.value)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {grupo.label} <span className="text-gray-500">({grupo.items.length} viatura{grupo.items.length !== 1 ? 's' : ''})</span>
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
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Código</p>
                                    <Input className={inputFieldClassName} value={editTransporteCodigo} onChange={(e) => setEditTransporteCodigo(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Tipo</p>
                                    <Input className={inputFieldClassName} value={editTransporteTipo} onChange={(e) => setEditTransporteTipo(e.target.value)} />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">Categoria</p>
                                  <select
                                    value={editTransporteCategoria}
                                    onChange={(e) => setEditTransporteCategoria(e.target.value as TransporteCategoria)}
                                    className={selectFieldClassName}
                                  >
                                    {TRANSPORTE_CATEGORIA_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">Matrícula</p>
                                  <Input className={inputFieldClassName} value={editTransporteMatricula} onChange={(e) => setEditTransporteMatricula(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Marca</p>
                                    <Input className={inputFieldClassName} value={editTransporteMarca} onChange={(e) => setEditTransporteMarca(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Modelo</p>
                                    <Input className={inputFieldClassName} value={editTransporteModelo} onChange={(e) => setEditTransporteModelo(e.target.value)} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Lotação</p>
                                    <Input className={inputFieldClassName} type="number" min="1" value={editTransporteLotacao} onChange={(e) => setEditTransporteLotacao(e.target.value)} />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">Data matrícula</p>
                                    <Input className={inputFieldClassName} type="date" value={editTransporteDataMatricula} onChange={(e) => setEditTransporteDataMatricula(e.target.value)} />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => void handleUpdateTransporte()}>Guardar</Button>
                                  <Button variant="outline" onClick={() => setEditingTransporteId(null)}>Cancelar</Button>
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
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Lotação: {item.lotacao} lugares</p>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" className="h-8 px-3" onClick={() => startEditTransporte(item)}>Editar</Button>
                                  <Button variant="outline" className="h-8 px-3" onClick={() => void handleDeleteTransporte(item.id)}>Apagar</Button>
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

          {activePanel === 'TIPOS' ? (
            <>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">Editar tipos de manutenção</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tipos no catálogo: {tiposManutencao.length}</p>

              <div className="space-y-2 max-h-[38rem] overflow-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                {tiposManutencao.map((item) => (
                  <div key={item.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-2 text-sm">
                    {editingTipoManutencaoId === item.id ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Nome</p>
                          <Input className={inputFieldClassName} value={editTipoManutencaoNome} onChange={(e) => setEditTipoManutencaoNome(e.target.value)} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Descrição</p>
                          <Input className={inputFieldClassName} value={editTipoManutencaoDescricao} onChange={(e) => setEditTipoManutencaoDescricao(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => void handleUpdateTipoManutencao()}>Guardar</Button>
                          <Button variant="outline" onClick={() => setEditingTipoManutencaoId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate">
                          {[item.nome, item.descricao].filter(Boolean).join(' - ')}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" className="h-8 px-2" onClick={() => startEditTipoManutencao(item)}>Editar</Button>
                          <Button variant="outline" className="h-8 px-2" onClick={() => void handleDeleteTipoManutencao(item.id)}>Apagar</Button>
                        </div>
                      </div>
                    )}
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
