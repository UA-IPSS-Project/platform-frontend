import { useEffect, useMemo, useState } from 'react';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Textarea } from '../../components/ui/textarea';
import { GlassCard } from '../../components/ui/glass-card';
import {
  MaterialCategoria,
  MaterialCatalogo,
  RequisicaoEstado,
  RequisicaoPrioridade,
  RequisicaoResponse,
  RequisicaoTipo,
  TransporteCatalogo,
  TransporteCategoria,
  requisicoesApi,
} from '../../services/api';

interface SecretaryRequisitionsPageProps {
  isDarkMode: boolean;
  currentUserId: number;
  initialTipo?: RequisicaoTipo;
  initialPrioridade?: RequisicaoPrioridade;
}

const ESTADO_OPTIONS: Array<{ value: RequisicaoEstado | ''; label: string }> = [
  { value: '', label: 'Todos os estados' },
  { value: 'ENVIADA', label: 'Enviada' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const PRIORIDADE_OPTIONS: Array<{ value: RequisicaoPrioridade; label: string }> = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const TIPO_OPTIONS: Array<{ value: RequisicaoTipo; label: string }> = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
];

const TRANSPORTE_CATEGORIA_OPTIONS: Array<{ value: TransporteCategoria; label: string }> = [
  { value: 'LIGEIRO', label: 'Ligeiro' },
  { value: 'PESADO', label: 'Pesado' },
  { value: 'PASSAGEIROS', label: 'Passageiros' },
  { value: 'ADAPTADO', label: 'Adaptado' },
];

const MATERIAL_CATEGORIA_OPTIONS: Array<{ value: MaterialCategoria; label: string }> = [
  { value: 'ESCRITA', label: 'Escrita' },
  { value: 'PAPEL_E_ARQUIVO', label: 'Papel e arquivo' },
  { value: 'HIGIENE_E_LIMPEZA', label: 'Higiene e limpeza' },
  { value: 'TECNOLOGIA', label: 'Tecnologia' },
  { value: 'OUTROS', label: 'Outros' },
];

const formatTipo = (tipo: RequisicaoTipo) => TIPO_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;
const formatPrioridade = (prioridade: RequisicaoPrioridade) => PRIORIDADE_OPTIONS.find((option) => option.value === prioridade)?.label ?? prioridade;
const formatEstado = (estado: RequisicaoEstado) => ESTADO_OPTIONS.find((option) => option.value === estado)?.label ?? estado;
const formatMaterialCategoria = (categoria?: MaterialCategoria) =>
  MATERIAL_CATEGORIA_OPTIONS.find((option) => option.value === categoria)?.label ?? categoria ?? 'Sem categoria';

const toIsoFromDateOnly = (date?: Date): string | undefined => {
  if (!date) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)).toISOString();
};

const formatDatePt = (date?: Date): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-PT').format(date);
};

const formatMaterialItemLabel = (
  material?: { id: number; nome?: string; categoria?: MaterialCategoria; atributo?: string; valorAtributo?: string },
  quantidade?: number,
): string => {
  const materialLabel = material?.nome ?? (material?.id ? `#${material.id}` : 'Material');
  const detalhe = material?.atributo && material?.valorAtributo
    ? ` - ${material.atributo}: ${material.valorAtributo}`
    : '';
  const categoria = material?.categoria ? ` [${formatMaterialCategoria(material.categoria)}]` : '';
  return `${materialLabel}${categoria}${detalhe} (x${quantidade ?? 0})`;
};

let materialLinhaCounter = 0;
const createEmptyMaterialLinha = () => ({
  rowId: `material-row-${++materialLinhaCounter}`,
  materialId: '',
  quantidade: '1',
});

const normalizarTexto = (valor?: string | null) => (valor ?? '').trim().toLowerCase();

export function SecretaryRequisitionsPage({
  isDarkMode,
  currentUserId,
  initialTipo,
  initialPrioridade,
}: Readonly<SecretaryRequisitionsPageProps>) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requisicoes, setRequisicoes] = useState<RequisicaoResponse[]>([]);
  const [openedRequisicaoId, setOpenedRequisicaoId] = useState<number | null>(null);
  const [estadoEdicao, setEstadoEdicao] = useState<RequisicaoEstado>('ENVIADA');
  const [updatingEstadoId, setUpdatingEstadoId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMaterialDialogOpen, setCreateMaterialDialogOpen] = useState(false);
  const [createTransporteDialogOpen, setCreateTransporteDialogOpen] = useState(false);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);
  const [submittingTransporte, setSubmittingTransporte] = useState(false);

  const [filterEstado, setFilterEstado] = useState<RequisicaoEstado | ''>('');
  const [filterTipo, setFilterTipo] = useState<RequisicaoTipo | ''>(initialTipo ?? '');
  const [filterPrioridade, setFilterPrioridade] = useState<RequisicaoPrioridade | ''>(initialPrioridade ?? '');
  const [filterCriadoPorNome, setFilterCriadoPorNome] = useState('');
  const [filterGeridoPorNome, setFilterGeridoPorNome] = useState('');

  const [tipo, setTipo] = useState<RequisicaoTipo>(initialTipo ?? 'MANUTENCAO');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<RequisicaoPrioridade>(initialPrioridade ?? 'MEDIA');
  const [tempoLimite, setTempoLimite] = useState<Date | undefined>();
  const [tempoLimitePickerOpen, setTempoLimitePickerOpen] = useState(false);
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [materialLinhas, setMaterialLinhas] = useState<Array<{ rowId: string; materialId: string; quantidade: string }>>([]);
  const [materialCategoriaAtiva, setMaterialCategoriaAtiva] = useState<MaterialCategoria | null>('ESCRITA');
  const [materialAdicionarNome, setMaterialAdicionarNome] = useState('');
  const [materialAdicionarVarianteId, setMaterialAdicionarVarianteId] = useState('');
  const [materialAdicionarQuantidade, setMaterialAdicionarQuantidade] = useState('1');
  const [transporteId, setTransporteId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [novoMaterialNome, setNovoMaterialNome] = useState('');
  const [novoMaterialDescricao, setNovoMaterialDescricao] = useState('');
  const [novoMaterialCategoria, setNovoMaterialCategoria] = useState<MaterialCategoria>('OUTROS');
  const [novoMaterialAtributo, setNovoMaterialAtributo] = useState('');
  const [novoMaterialValorAtributo, setNovoMaterialValorAtributo] = useState('');
  const [novoTransporteTipo, setNovoTransporteTipo] = useState('');
  const [novoTransporteCategoria, setNovoTransporteCategoria] = useState<TransporteCategoria>('LIGEIRO');
  const [novoTransporteMatricula, setNovoTransporteMatricula] = useState('');
  const [novoTransporteMarca, setNovoTransporteMarca] = useState('');
  const [novoTransporteModelo, setNovoTransporteModelo] = useState('');
  const [novoTransporteLotacao, setNovoTransporteLotacao] = useState('');
  const [novoTransporteDataMatricula, setNovoTransporteDataMatricula] = useState('');

  useEffect(() => {
    setFilterTipo(initialTipo ?? '');
    setFilterPrioridade(initialPrioridade ?? '');
    if (initialTipo) setTipo(initialTipo);
    if (initialPrioridade) setPrioridade(initialPrioridade);
  }, [initialTipo, initialPrioridade]);

  const fetchRequisicoes = async (overrides?: {
    estado?: RequisicaoEstado | '';
    tipo?: RequisicaoTipo | '';
    prioridade?: RequisicaoPrioridade | '';
    criadoPorNome?: string;
    geridoPorNome?: string;
  }) => {
    const estado = overrides?.estado ?? filterEstado;
    const tipoFiltro = overrides?.tipo ?? filterTipo;
    const prioridadeFiltro = overrides?.prioridade ?? filterPrioridade;
    const criadoPor = overrides?.criadoPorNome ?? filterCriadoPorNome;
    const geridoPor = overrides?.geridoPorNome ?? filterGeridoPorNome;

    try {
      setLoading(true);
      const data = await requisicoesApi.procurar({
        estado: estado || undefined,
        tipo: tipoFiltro || undefined,
        prioridade: prioridadeFiltro || undefined,
        criadoPorNome: criadoPor || undefined,
        geridoPorNome: geridoPor || undefined,
      });
      setRequisicoes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar requisições.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisicoes({
      estado: '',
      tipo: initialTipo ?? '',
      prioridade: initialPrioridade ?? '',
      criadoPorNome: '',
      geridoPorNome: '',
    });
  }, [initialTipo, initialPrioridade]);

  const fetchCatalogo = async () => {
    try {
      setLoadingCatalogo(true);
      const [materiaisData, transportesData] = await Promise.all([
        requisicoesApi.listarMateriais(),
        requisicoesApi.listarTransportes(),
      ]);
      setMateriais(Array.isArray(materiaisData) ? materiaisData : []);
      setTransportes(Array.isArray(transportesData) ? transportesData : []);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar materiais e transportes.');
    } finally {
      setLoadingCatalogo(false);
    }
  };

  useEffect(() => {
    if (createDialogOpen) {
      fetchCatalogo();
    }
  }, [createDialogOpen]);

  const categoriasComMateriais = useMemo(
    () => MATERIAL_CATEGORIA_OPTIONS.filter((option) => materiais.some((material) => material.categoria === option.value)),
    [materiais],
  );

  useEffect(() => {
    if (categoriasComMateriais.length === 0) {
      setMaterialCategoriaAtiva(null);
      return;
    }

    if (!materialCategoriaAtiva || !categoriasComMateriais.some((categoria) => categoria.value === materialCategoriaAtiva)) {
      setMaterialCategoriaAtiva(categoriasComMateriais[0].value);
    }
  }, [categoriasComMateriais, materialCategoriaAtiva]);

  const materiaisCategoriaAtiva = useMemo(
    () => (materialCategoriaAtiva ? materiais.filter((material) => material.categoria === materialCategoriaAtiva) : []),
    [materiais, materialCategoriaAtiva],
  );

  const opcoesNomeMaterial = useMemo(() => {
    const nomes = materiaisCategoriaAtiva.map((material) => material.nome.trim()).filter(Boolean);
    return Array.from(new Set(nomes));
  }, [materiaisCategoriaAtiva]);

  const variantesMaterialSelecionado = useMemo(
    () => materiaisCategoriaAtiva.filter((material) => normalizarTexto(material.nome) === normalizarTexto(materialAdicionarNome)),
    [materiaisCategoriaAtiva, materialAdicionarNome],
  );

  const materialAdicionarId = useMemo(() => {
    if (!materialAdicionarNome) {
      return '';
    }
    if (variantesMaterialSelecionado.length <= 1) {
      return variantesMaterialSelecionado[0] ? String(variantesMaterialSelecionado[0].id) : '';
    }
    return materialAdicionarVarianteId;
  }, [materialAdicionarNome, materialAdicionarVarianteId, variantesMaterialSelecionado]);

  useEffect(() => {
    setMaterialAdicionarNome('');
    setMaterialAdicionarVarianteId('');
    setMaterialAdicionarQuantidade('1');
  }, [materialCategoriaAtiva]);

  useEffect(() => {
    setMaterialAdicionarVarianteId('');
  }, [materialAdicionarNome]);

  const handleCriarMaterialCatalogo = async () => {
    if (!novoMaterialNome.trim()) {
      toast.error('O nome do material é obrigatório.');
      return;
    }
    if (!novoMaterialAtributo.trim() || !novoMaterialValorAtributo.trim()) {
      toast.error('Atributo e valor do atributo são obrigatórios.');
      return;
    }

    try {
      setSubmittingMaterial(true);
      const novoMaterial = await requisicoesApi.criarMaterialCatalogo({
        nome: novoMaterialNome.trim(),
        descricao: novoMaterialDescricao.trim() || undefined,
        categoria: novoMaterialCategoria,
        atributo: novoMaterialAtributo.trim(),
        valorAtributo: novoMaterialValorAtributo.trim(),
      });
      toast.success('Material criado com sucesso.');
      setMateriais((prev) => [...prev, novoMaterial]);
      setMaterialCategoriaAtiva(novoMaterial.categoria);
      setMaterialAdicionarNome(novoMaterial.nome);
      setMaterialAdicionarVarianteId(String(novoMaterial.id));
      setNovoMaterialNome('');
      setNovoMaterialDescricao('');
      setNovoMaterialCategoria('OUTROS');
      setNovoMaterialAtributo('');
      setNovoMaterialValorAtributo('');
      setCreateMaterialDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar material.');
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleCriarTransporteCatalogo = async () => {
    if (!novoTransporteTipo.trim() || !novoTransporteMatricula.trim()) {
      toast.error('Tipo e matrícula do transporte são obrigatórios.');
      return;
    }

    try {
      setSubmittingTransporte(true);
      const novoTransporte = await requisicoesApi.criarTransporteCatalogo({
        tipo: novoTransporteTipo.trim(),
        categoria: novoTransporteCategoria,
        matricula: novoTransporteMatricula.trim().toUpperCase(),
        marca: novoTransporteMarca.trim() || undefined,
        modelo: novoTransporteModelo.trim() || undefined,
        lotacao: novoTransporteLotacao ? Number(novoTransporteLotacao) : undefined,
        dataMatricula: novoTransporteDataMatricula || undefined,
      });
      toast.success('Transporte criado com sucesso.');
      setTransportes((prev) => [...prev, novoTransporte]);
      setTransporteId(String(novoTransporte.id));
      setNovoTransporteTipo('');
      setNovoTransporteCategoria('LIGEIRO');
      setNovoTransporteMatricula('');
      setNovoTransporteMarca('');
      setNovoTransporteModelo('');
      setNovoTransporteLotacao('');
      setNovoTransporteDataMatricula('');
      setCreateTransporteDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar transporte.');
    } finally {
      setSubmittingTransporte(false);
    }
  };

  const handleAddMaterialLinha = () => {
    if (!materialAdicionarNome || Number(materialAdicionarQuantidade) < 1) {
      toast.error('Selecione um material e uma quantidade válida.');
      return;
    }

    if (variantesMaterialSelecionado.length > 1 && !materialAdicionarVarianteId) {
      toast.error('Selecione o atributo do material antes de adicionar.');
      return;
    }

    if (!materialAdicionarId) {
      toast.error('Selecione um material válido.');
      return;
    }

    const existing = materialLinhas.find((item) => item.materialId === materialAdicionarId);
    if (existing) {
      setMaterialLinhas((prev) =>
        prev.map((item) =>
          item.materialId === materialAdicionarId
            ? { ...item, quantidade: materialAdicionarQuantidade }
            : item,
        ),
      );
      toast.info('Quantidade do material atualizada.');
      setMaterialAdicionarNome('');
      setMaterialAdicionarVarianteId('');
      setMaterialAdicionarQuantidade('1');
      return;
    }

    setMaterialLinhas((prev) => [
      ...prev,
      {
        ...createEmptyMaterialLinha(),
        materialId: materialAdicionarId,
        quantidade: materialAdicionarQuantidade,
      },
    ]);
    setMaterialAdicionarNome('');
    setMaterialAdicionarVarianteId('');
    setMaterialAdicionarQuantidade('1');
  };

  const handleRemoveMaterialLinha = (rowId: string) => {
    setMaterialLinhas((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const handleCreate = async () => {
    if (!currentUserId) {
      toast.error('Não foi possível identificar o utilizador autenticado.');
      return;
    }

    if (!descricao.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }

    try {
      setSubmitting(true);

      const payloadBase = {
        descricao: descricao.trim(),
        prioridade,
        tempoLimite: toIsoFromDateOnly(tempoLimite),
        criadoPorId: currentUserId,
      };

      if (tipo === 'MATERIAL') {
        const linhasValidas = materialLinhas.filter((linha) => linha.materialId && Number(linha.quantidade) > 0);
        if (linhasValidas.length === 0) {
          toast.error('Adicione pelo menos um material com quantidade válida.');
          return;
        }

        const itensDedupe = Array.from(
          linhasValidas.reduce<Map<number, number>>((acc, linha) => {
            acc.set(Number(linha.materialId), Number(linha.quantidade));
            return acc;
          }, new Map()),
        ).map(([materialId, quantidade]) => ({ materialId, quantidade }));

        await requisicoesApi.criarMaterial({
          ...payloadBase,
          itens: itensDedupe,
        });
        toast.success('Requisição de material criada com sucesso.');
      } else if (tipo === 'TRANSPORTE') {
        if (!transporteId) {
          toast.error('Selecione um transporte.');
          return;
        }
        await requisicoesApi.criarTransporte({
          ...payloadBase,
          transporteId: Number(transporteId),
        });
      } else {
        await requisicoesApi.criarManutencao({
          ...payloadBase,
          assunto: assunto.trim() || undefined,
        });
      }

      if (tipo !== 'MATERIAL') {
        toast.success('Requisição criada com sucesso.');
      }
      setDescricao('');
      setTempoLimite(undefined);
      setMaterialLinhas([]);
      setMaterialAdicionarNome('');
      setMaterialAdicionarVarianteId('');
      setMaterialAdicionarQuantidade('1');
      setTransporteId('');
      setAssunto('');
      setCreateDialogOpen(false);
      await fetchRequisicoes();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar requisição.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setFilterEstado('');
    setFilterTipo(initialTipo ?? '');
    setFilterPrioridade(initialPrioridade ?? '');
    setFilterCriadoPorNome('');
    setFilterGeridoPorNome('');
  };

  const handleOpenRequisicao = (req: RequisicaoResponse) => {
    setOpenedRequisicaoId(req.id);
    setEstadoEdicao(req.estado);
  };

  const handleAtualizarEstado = async () => {
    if (!openedRequisicaoId) return;

    try {
      setUpdatingEstadoId(openedRequisicaoId);
      await requisicoesApi.atualizarEstado(openedRequisicaoId, { estado: estadoEdicao });
      toast.success('Estado da requisição atualizado com sucesso.');
      await fetchRequisicoes();
      setOpenedRequisicaoId(null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar estado da requisição.');
    } finally {
      setUpdatingEstadoId(null);
    }
  };

  const summaryText = useMemo(() => {
    const total = requisicoes.length;
    const urgentes = requisicoes.filter((item) => item.prioridade === 'URGENTE').length;
    return `${total} requisição(ões) · ${urgentes} urgente(s)`;
  }, [requisicoes]);

  const selectedRequisicao = useMemo(
    () => requisicoes.find((item) => item.id === openedRequisicaoId) ?? null,
    [requisicoes, openedRequisicaoId],
  );

  const headingClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-semibold ${headingClass}`}>Nova Requisição</h2>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
            Nova requisição
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-semibold ${headingClass}`}>Requisições</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{summaryText}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label htmlFor="req-filter-estado" className="text-sm text-gray-600 dark:text-gray-300">Estado</label>
            <select
              id="req-filter-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as RequisicaoEstado | '')}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              {ESTADO_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
            <select
              id="req-filter-tipo"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as RequisicaoTipo | '')}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos os tipos</option>
              {TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-prioridade" className="text-sm text-gray-600 dark:text-gray-300">Prioridade</label>
            <select
              id="req-filter-prioridade"
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value as RequisicaoPrioridade | '')}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Todas as prioridades</option>
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="req-filter-criado-por" className="text-sm text-gray-600 dark:text-gray-300">Criado por nome</label>
            <Input id="req-filter-criado-por" type="text" value={filterCriadoPorNome} onChange={(e) => setFilterCriadoPorNome(e.target.value)} placeholder="Ex: Maria" />
          </div>

          <div>
            <label htmlFor="req-filter-gerido-por" className="text-sm text-gray-600 dark:text-gray-300">Gerido por nome</label>
            <Input id="req-filter-gerido-por" type="text" value={filterGeridoPorNome} onChange={(e) => setFilterGeridoPorNome(e.target.value)} placeholder="Ex: João" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => fetchRequisicoes()} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? 'A pesquisar...' : 'Pesquisar'}
          </Button>
          <Button variant="outline" onClick={handleClearFilters} disabled={loading}>Limpar filtros</Button>
        </div>

        {requisicoes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
            Sem requisições para os filtros atuais.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {requisicoes.map((req) => (
              <div key={req.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">#{req.id} · {formatTipo(req.tipo)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrioridade(req.prioridade)}</p>
                    <Button
                      variant="outline"
                      className="h-8 px-3"
                      onClick={() => handleOpenRequisicao(req)}
                    >
                      Abrir
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">{req.descricao}</p>

                <div className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-1">
                  <p>Estado: {formatEstado(req.estado)}</p>
                  <p>Criado por: {req.criadoPor?.nome || req.criadoPor?.id || '—'}</p>
                  <p>Gerido por: {req.geridoPor?.nome || req.geridoPor?.id || '—'}</p>
                  <p>Data: {req.criadoEm ? new Date(req.criadoEm).toLocaleString('pt-PT') : '—'}</p>
                  <p>Última alteração: {req.ultimaAlteracaoEstadoEm ? new Date(req.ultimaAlteracaoEstadoEm).toLocaleString('pt-PT') : '—'}</p>
                  <p>Prazo: {req.tempoLimite ? new Date(req.tempoLimite).toLocaleString('pt-PT') : '—'}</p>
                  {req.tipo === 'MATERIAL' && (
                    <p>
                      Materiais:{' '}
                      {req.itens && req.itens.length > 0
                        ? req.itens
                            .map((item) => formatMaterialItemLabel(item.material, item.quantidade))
                            .join(', ')
                        : `ID ${req.material?.id || '—'} · Qtd ${req.quantidade || '—'}`}
                    </p>
                  )}
                  {req.tipo === 'TRANSPORTE' && <p>Transporte ID: {req.transporte?.id || '—'}</p>}
                  {req.tipo === 'MANUTENCAO' && <p>Assunto: {req.assunto || '—'}</p>}
                </div>

              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Dialog open={openedRequisicaoId !== null} onOpenChange={(open) => !open && setOpenedRequisicaoId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Detalhes da requisição</DialogTitle>
          </DialogHeader>

          {selectedRequisicao && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="text-sm grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 items-start">
                  <p className="text-gray-500 dark:text-gray-400">Descrição</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.descricao || '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Tipo</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatTipo(selectedRequisicao.tipo)}</p>

                  <p className="text-gray-500 dark:text-gray-400">Prioridade</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatPrioridade(selectedRequisicao.prioridade)}</p>

                  <p className="text-gray-500 dark:text-gray-400">Estado atual</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatEstado(selectedRequisicao.estado)}</p>

                  <p className="text-gray-500 dark:text-gray-400">Criado por</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.criadoPor?.nome || '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Gerido por</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.geridoPor?.nome || '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Data de criação</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.criadoEm ? new Date(selectedRequisicao.criadoEm).toLocaleString('pt-PT') : '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Última alteração</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.ultimaAlteracaoEstadoEm ? new Date(selectedRequisicao.ultimaAlteracaoEstadoEm).toLocaleString('pt-PT') : '—'}</p>

                  <p className="text-gray-500 dark:text-gray-400">Prazo</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.tempoLimite ? new Date(selectedRequisicao.tempoLimite).toLocaleString('pt-PT') : '—'}</p>

                  {selectedRequisicao.tipo === 'MATERIAL' && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Material</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                          ? selectedRequisicao.itens
                              .map((item) => formatMaterialItemLabel(item.material, item.quantidade))
                              .join(', ')
                          : selectedRequisicao.material?.nome || '—'}
                      </p>

                      <p className="text-gray-500 dark:text-gray-400">Quantidade</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedRequisicao.itens && selectedRequisicao.itens.length > 0
                          ? selectedRequisicao.itens.reduce((sum, item) => sum + (item.quantidade || 0), 0)
                          : selectedRequisicao.quantidade || '—'}
                      </p>
                    </>
                  )}
                  {selectedRequisicao.tipo === 'TRANSPORTE' && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Transporte</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.transporte?.nome || 'Associado'}</p>
                    </>
                  )}
                  {selectedRequisicao.tipo === 'MANUTENCAO' && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400">Assunto</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedRequisicao.assunto || '—'}</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="req-estado-modal" className="text-sm text-gray-600 dark:text-gray-300">Novo estado</label>
                <select
                  id="req-estado-modal"
                  value={estadoEdicao}
                  onChange={(e) => setEstadoEdicao(e.target.value as RequisicaoEstado)}
                  className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {ESTADO_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpenedRequisicaoId(null)}
                  disabled={updatingEstadoId === selectedRequisicao.id}
                >
                  Fechar
                </Button>
                <Button
                  onClick={handleAtualizarEstado}
                  disabled={updatingEstadoId === selectedRequisicao.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updatingEstadoId === selectedRequisicao.id ? 'A guardar...' : 'Guardar estado'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Nova Requisição</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dados principais</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="req-create-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
                <select
                  id="req-create-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as RequisicaoTipo)}
                  className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {TIPO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="req-create-prioridade" className="text-sm text-gray-600 dark:text-gray-300">Prioridade</label>
                <select
                  id="req-create-prioridade"
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as RequisicaoPrioridade)}
                  className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {PRIORIDADE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Data limite</p>
                <Popover open={tempoLimitePickerOpen} onOpenChange={setTempoLimitePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1 justify-between"
                    >
                      {tempoLimite ? formatDatePt(tempoLimite) : 'Selecionar data'}
                      <CalendarIcon className="w-4 h-4 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-0 bg-transparent shadow-none w-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={tempoLimite}
                      month={tempoLimite ?? new Date()}
                      onSelect={(date) => {
                        setTempoLimite(date);
                        if (date) setTempoLimitePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

              <div>
                <label htmlFor="req-create-descricao" className="text-sm text-gray-600 dark:text-gray-300">Descrição</label>
                <Textarea id="req-create-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a requisição" />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Detalhes por tipo</h3>

              <div>
                {tipo === 'MATERIAL' && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar material</p>
                        <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCreateMaterialDialogOpen(true)}>
                          Novo material
                        </Button>
                      </div>

                                      <div className="space-y-2">
                                        {MATERIAL_CATEGORIA_OPTIONS.map((categoria) => {
                                          const materiaisDaCategoria = materiais.filter((item) => item.categoria === categoria.value);
                                          const isActive = categoria.value === materialCategoriaAtiva;
                                          const disabled = materiaisDaCategoria.length === 0;

                                          return (
                                            <div
                                              key={categoria.value}
                                              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60"
                                            >
                                              <button
                                                type="button"
                                                className="w-full px-3 py-2 flex items-center justify-between text-left"
                                                disabled={disabled}
                                                onClick={() => setMaterialCategoriaAtiva((prev) => (prev === categoria.value ? null : categoria.value))}
                                              >
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                  {categoria.label}
                                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                    ({materiaisDaCategoria.length})
                                                  </span>
                                                </span>
                                                {isActive ? (
                                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                                )}
                                              </button>

                                              {isActive && (
                                                <div className="px-3 pb-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
                                                  <div className="rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-3 mt-3">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                      Materiais de {categoria.label}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {materiaisDaCategoria.length === 0 ? (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Sem materiais nesta categoria.</span>
                                                      ) : (
                                                        materiaisDaCategoria.map((material) => (
                                                          <span
                                                            key={material.id}
                                                            className="text-xs rounded-full border border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-700 dark:text-gray-200"
                                                          >
                                                            {material.nome} - {material.atributo}: {material.valorAtributo}
                                                          </span>
                                                        ))
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-2 items-end">
                                                    <div>
                                                      <label htmlFor="req-create-material-add" className="text-sm text-gray-600 dark:text-gray-300">Material</label>
                                                      <select
                                                        id="req-create-material-add"
                                                        value={materialAdicionarNome}
                                                        onChange={(e) => setMaterialAdicionarNome(e.target.value)}
                                                        disabled={loadingCatalogo}
                                                        className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                                                      >
                                                        <option value="">{loadingCatalogo ? 'A carregar materiais...' : 'Selecionar material da categoria'}</option>
                                                        {opcoesNomeMaterial.map((nome) => (
                                                          <option key={nome} value={nome}>
                                                            {nome}
                                                          </option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                    <div>
                                                      <label htmlFor="req-create-material-atributo" className="text-sm text-gray-600 dark:text-gray-300">
                                                        Atributo
                                                      </label>
                                                      <select
                                                        id="req-create-material-atributo"
                                                        value={materialAdicionarVarianteId}
                                                        onChange={(e) => setMaterialAdicionarVarianteId(e.target.value)}
                                                        disabled={loadingCatalogo || variantesMaterialSelecionado.length <= 1}
                                                        className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                                                      >
                                                        <option value="">
                                                          {variantesMaterialSelecionado.length <= 1
                                                            ? 'Sem seleção necessária'
                                                            : 'Selecionar atributo'}
                                                        </option>
                                                        {variantesMaterialSelecionado.map((material) => (
                                                          <option key={material.id} value={material.id}>
                                                            {material.atributo && material.valorAtributo
                                                              ? `${material.atributo}: ${material.valorAtributo}`
                                                              : `Variante #${material.id}`}
                                                          </option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                    <div>
                                                      <label htmlFor="req-create-quantidade-add" className="text-sm text-gray-600 dark:text-gray-300">Quantidade</label>
                                                      <Input
                                                        id="req-create-quantidade-add"
                                                        type="number"
                                                        min="1"
                                                        value={materialAdicionarQuantidade}
                                                        onChange={(e) => setMaterialAdicionarQuantidade(e.target.value)}
                                                      />
                                                    </div>
                                                    <Button type="button" variant="outline" className="h-10 px-3" onClick={handleAddMaterialLinha}>
                                                      Adicionar
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Materiais adicionados</p>

                      {materialLinhas.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ainda não adicionaste materiais.</p>
                      ) : (
                        materialLinhas.map((linha, index) => {
                          const material = materiais.find((item) => String(item.id) === linha.materialId);
                          return (
                            <div key={linha.rowId} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2 items-end">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Material {index + 1}</p>
                                <p className="h-10 mt-1 flex items-center rounded-md border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
                                  {material?.nome || 'Material removido'}
                                </p>
                                {material && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {formatMaterialCategoria(material.categoria)} - {material.atributo}: {material.valorAtributo}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Quantidade</p>
                                <p className="h-10 mt-1 flex items-center rounded-md border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900">
                                  {linha.quantidade}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 px-3"
                                onClick={() => handleRemoveMaterialLinha(linha.rowId)}
                              >
                                Remover
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {tipo === 'TRANSPORTE' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="req-create-transporte-id" className="text-sm text-gray-600 dark:text-gray-300">Transporte</label>
                      <Button type="button" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCreateTransporteDialogOpen(true)}>
                        Novo transporte
                      </Button>
                    </div>
                    <select
                      id="req-create-transporte-id"
                      value={transporteId}
                      onChange={(e) => setTransporteId(e.target.value)}
                      disabled={loadingCatalogo}
                      className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                    >
                      <option value="">{loadingCatalogo ? 'A carregar transportes...' : 'Selecionar transporte'}</option>
                      {transportes.map((transporte) => (
                        <option key={transporte.id} value={transporte.id}>
                          {(transporte.tipo || 'Transporte')} · {transporte.matricula || 'sem matrícula'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tipo === 'MANUTENCAO' && (
                  <div>
                    <label htmlFor="req-create-assunto" className="text-sm text-gray-600 dark:text-gray-300">Assunto (opcional)</label>
                    <Input id="req-create-assunto" type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex: Torneira com fuga" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submitting ? 'A criar...' : 'Criar requisição'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createMaterialDialogOpen} onOpenChange={setCreateMaterialDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Novo material</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label htmlFor="novo-material-nome" className="text-sm text-gray-600 dark:text-gray-300">Nome</label>
              <Input id="novo-material-nome" value={novoMaterialNome} onChange={(e) => setNovoMaterialNome(e.target.value)} placeholder="Ex: Luvas" />
            </div>
            <div>
              <label htmlFor="novo-material-descricao" className="text-sm text-gray-600 dark:text-gray-300">Descrição (opcional)</label>
              <Textarea id="novo-material-descricao" value={novoMaterialDescricao} onChange={(e) => setNovoMaterialDescricao(e.target.value)} placeholder="Descrição do material" />
            </div>
            <div>
              <label htmlFor="novo-material-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
              <select
                id="novo-material-categoria"
                value={novoMaterialCategoria}
                onChange={(e) => setNovoMaterialCategoria(e.target.value as MaterialCategoria)}
                className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
              >
                {MATERIAL_CATEGORIA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="novo-material-atributo" className="text-sm text-gray-600 dark:text-gray-300">Atributo</label>
                <Input
                  id="novo-material-atributo"
                  value={novoMaterialAtributo}
                  onChange={(e) => setNovoMaterialAtributo(e.target.value)}
                  placeholder="Ex: Cor, Tipo, Tamanho"
                />
              </div>
              <div>
                <label htmlFor="novo-material-valor-atributo" className="text-sm text-gray-600 dark:text-gray-300">Valor do atributo</label>
                <Input
                  id="novo-material-valor-atributo"
                  value={novoMaterialValorAtributo}
                  onChange={(e) => setNovoMaterialValorAtributo(e.target.value)}
                  placeholder="Ex: Azul, A4, 100ml"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateMaterialDialogOpen(false)} disabled={submittingMaterial}>
                Cancelar
              </Button>
              <Button onClick={handleCriarMaterialCatalogo} disabled={submittingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submittingMaterial ? 'A criar...' : 'Criar material'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createTransporteDialogOpen} onOpenChange={setCreateTransporteDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Novo transporte</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="novo-transporte-tipo" className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
                <Input id="novo-transporte-tipo" value={novoTransporteTipo} onChange={(e) => setNovoTransporteTipo(e.target.value)} placeholder="Ex: Carrinha" />
              </div>
              <div>
                <label htmlFor="novo-transporte-categoria" className="text-sm text-gray-600 dark:text-gray-300">Categoria</label>
                <select
                  id="novo-transporte-categoria"
                  value={novoTransporteCategoria}
                  onChange={(e) => setNovoTransporteCategoria(e.target.value as TransporteCategoria)}
                  className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {TRANSPORTE_CATEGORIA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="novo-transporte-matricula" className="text-sm text-gray-600 dark:text-gray-300">Matrícula</label>
                <Input id="novo-transporte-matricula" value={novoTransporteMatricula} onChange={(e) => setNovoTransporteMatricula(e.target.value)} placeholder="Ex: 00-AA-00" />
              </div>
              <div>
                <label htmlFor="novo-transporte-lotacao" className="text-sm text-gray-600 dark:text-gray-300">Lotação (opcional)</label>
                <Input id="novo-transporte-lotacao" type="number" min="1" value={novoTransporteLotacao} onChange={(e) => setNovoTransporteLotacao(e.target.value)} />
              </div>

              <div>
                <label htmlFor="novo-transporte-marca" className="text-sm text-gray-600 dark:text-gray-300">Marca (opcional)</label>
                <Input id="novo-transporte-marca" value={novoTransporteMarca} onChange={(e) => setNovoTransporteMarca(e.target.value)} placeholder="Ex: Ford" />
              </div>
              <div>
                <label htmlFor="novo-transporte-modelo" className="text-sm text-gray-600 dark:text-gray-300">Modelo (opcional)</label>
                <Input id="novo-transporte-modelo" value={novoTransporteModelo} onChange={(e) => setNovoTransporteModelo(e.target.value)} placeholder="Ex: Transit" />
              </div>

              <div>
                <label htmlFor="novo-transporte-data-matricula" className="text-sm text-gray-600 dark:text-gray-300">Data matrícula (opcional)</label>
                <Input id="novo-transporte-data-matricula" type="date" value={novoTransporteDataMatricula} onChange={(e) => setNovoTransporteDataMatricula(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateTransporteDialogOpen(false)} disabled={submittingTransporte}>
                Cancelar
              </Button>
              <Button onClick={handleCriarTransporteCatalogo} disabled={submittingTransporte} className="bg-purple-600 hover:bg-purple-700 text-white">
                {submittingTransporte ? 'A criar...' : 'Criar transporte'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
