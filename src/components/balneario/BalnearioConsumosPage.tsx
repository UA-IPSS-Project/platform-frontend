import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Save, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '../ui/alert-dialog';
import { armazemApi, ItemArmazemDTO, ConsumoEstatisticaDTO } from '../../services/api/armazem/armazemApi';
import { marcacoesApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BalnearioCharts } from './BalnearioCharts';

interface BalnearioConsumosPageProps {
    isDarkMode: boolean;
    variant?: 'armazem' | 'estatisticas';
}

export function BalnearioConsumosPage({ isDarkMode: _isDarkMode, variant = 'armazem' }: BalnearioConsumosPageProps) {
    const { t } = useTranslation();
    const [items, setItems] = useState<ItemArmazemDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItems, setEditingItems] = useState<Record<number, { quantidade: number; quantidadeMinima: number }>>({});
    const [savingItems, setSavingItems] = useState<Set<number>>(new Set());
    const [editingMinimos, setEditingMinimos] = useState(false);

    // Estatísticas
    const [stats, setStats] = useState<ConsumoEstatisticaDTO | null>(null);
    const [attendanceStats, setAttendanceStats] = useState<any>(null);
    const [statsPeriodo, setStatsPeriodo] = useState<'DIA' | 'SEMANA' | 'MES'>('MES');
    const [statsLoading, setStatsLoading] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const carregarItens = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await armazemApi.listarTodos();
            setItems(data);
        } catch {
            toast.error(t('consumos.loadError', 'Erro ao carregar itens do armazém'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const carregarEstatisticas = useCallback(async () => {
        try {
            setStatsLoading(true);
            const [data, attendanceData] = await Promise.all([
                armazemApi.obterEstatisticas(statsPeriodo),
                marcacoesApi.obterEstatisticasFrequenciaBalneario(statsPeriodo)
            ]);
            setStats(data);
            setAttendanceStats(attendanceData);
        } catch (e) {
            console.error(e);
            toast.error(t('consumos.statsError', 'Erro ao carregar estatísticas'));
        } finally {
            setStatsLoading(false);
        }
    }, [statsPeriodo, t]);

    const actualTab = variant; // Using the passed variant directly

    useEffect(() => {
        carregarItens();
    }, [carregarItens]);

    useEffect(() => {
        if (actualTab === 'estatisticas') {
            carregarEstatisticas();
        }
    }, [actualTab, carregarEstatisticas]);

    // Global unsaved changes warning (for browser reload/close)
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (items.some(item => hasItemChanges(item)) || editingMinimos) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [items, editingMinimos]);

    // =====================================================================
    // ARMAZÉM HANDLERS
    // =====================================================================

    const anyChanges = items.some(item => hasItemChanges(item));

    function hasItemChanges(item: ItemArmazemDTO) {
        const editing = editingItems[item.id];
        if (!editing) return false;
        return editing.quantidade !== item.quantidade || editing.quantidadeMinima !== item.quantidadeMinima;
    }

    const handleQuantidadeChange = (item: ItemArmazemDTO, delta: number) => {
        const current = editingItems[item.id] || { quantidade: item.quantidade, quantidadeMinima: item.quantidadeMinima };
        const novaQtd = Math.max(0, current.quantidade + delta);
        setEditingItems(prev => ({
            ...prev,
            [item.id]: { ...current, quantidade: novaQtd }
        }));
    };

    const handleQuantidadeInput = (item: ItemArmazemDTO, value: string) => {
        const current = editingItems[item.id] || { quantidade: item.quantidade, quantidadeMinima: item.quantidadeMinima };
        const novaQtd = Math.max(0, parseInt(value) || 0);
        setEditingItems(prev => ({
            ...prev,
            [item.id]: { ...current, quantidade: novaQtd }
        }));
    };

    const handleMinimoChange = (item: ItemArmazemDTO, value: string) => {
        const current = editingItems[item.id] || { quantidade: item.quantidade, quantidadeMinima: item.quantidadeMinima };
        const novoMin = Math.max(0, parseInt(value) || 0);
        setEditingItems(prev => ({
            ...prev,
            [item.id]: { ...current, quantidadeMinima: novoMin }
        }));
    };

    const handleSaveItem = async (item: ItemArmazemDTO) => {
        const editing = editingItems[item.id];
        if (!editing) return;

        setSavingItems(prev => new Set(prev).add(item.id));
        try {
            const updated = await armazemApi.atualizarItem(item.id, {
                quantidade: editing.quantidade,
                quantidadeMinima: editing.quantidadeMinima,
            });
            setItems(prev => prev.map(i => i.id === item.id ? updated : i));
            setEditingItems(prev => {
                const copy = { ...prev };
                delete copy[item.id];
                return copy;
            });
            toast.success(t('consumos.itemSaved', 'Item atualizado com sucesso'));
        } catch {
            toast.error(t('consumos.saveError', 'Erro ao guardar'));
        } finally {
            setSavingItems(prev => {
                const copy = new Set(prev);
                copy.delete(item.id);
                return copy;
            });
        }
    };

    const handleSaveAll = async () => {
        const changedItems = items.filter(item => hasItemChanges(item));
        if (changedItems.length === 0) return;
        for (const item of changedItems) {
            await handleSaveItem(item);
        }
    };

    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // =====================================================================
    // GROUPING
    // =====================================================================

    const groupedItems = items.reduce<Record<string, ItemArmazemDTO[]>>((acc, item) => {
        if (!acc[item.categoria]) acc[item.categoria] = [];
        acc[item.categoria].push(item);
        return acc;
    }, {
        'HIGIENE': [],
        'DETERGENTES': [],
        'VESTUARIO': [],
        'CALCADO': []
    });

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'DETERGENTES': return t('consumos.categories.detergentes', 'Detergentes');
            case 'HIGIENE': return t('consumos.categories.higiene', 'Higiene');
            case 'VESTUARIO': return t('consumos.categories.vestuario', 'Vestuário');
            case 'CALCADO': return t('consumos.categories.calcado', 'Calçado');
            default: return cat;
        }
    };

    // =====================================================================
    // RENDER ITEM ROW (shared by all categories including calçado)
    // =====================================================================

    const renderItemRow = (item: ItemArmazemDTO, isCalcado = false) => {
        const editing = editingItems[item.id];
        const qty = editing?.quantidade ?? item.quantidade;
        const min = editing?.quantidadeMinima ?? item.quantidadeMinima;
        const estado = qty >= min ? 'OK' : 'BAIXO';
        const isSaving = savingItems.has(item.id);
        const changed = hasItemChanges(item);

        return (
            <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 py-3 border-b border-border last:border-b-0">
                <span className="font-medium text-foreground">
                    {isCalcado ? `${t('consumos.size', 'Tamanho')} ${item.nome}` : t(`consumos.products.${item.nome}`, item.nome)}
                </span>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 w-40 justify-center">
                    <button
                        onClick={() => handleQuantidadeChange(item, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Diminuir"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    <Input
                        type="number"
                        value={qty}
                        onChange={(e) => handleQuantidadeInput(item, e.target.value)}
                        className={`w-16 h-8 text-center text-sm font-semibold border rounded-lg ${
                            estado === 'BAIXO'
                                ? 'border-[color:var(--status-error)]/40 bg-[color:var(--status-error-soft)] text-[color:var(--status-error)]'
                                : 'border-border bg-background text-foreground'
                        }`}
                        min={0}
                    />
                    <span className="text-xs text-muted-foreground w-8">{item.unidade}</span>
                    <button
                        onClick={() => handleQuantidadeChange(item, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Aumentar"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Minimum */}
                <div className="w-24 text-center">
                    {editingMinimos ? (
                        <Input
                            type="number"
                            value={min}
                            onChange={(e) => handleMinimoChange(item, e.target.value)}
                            className="w-16 h-8 text-center text-sm mx-auto border-border bg-background"
                            min={0}
                        />
                    ) : (
                        <span className="text-sm text-muted-foreground">{min} {item.unidade}</span>
                    )}
                </div>

                {/* Status + Save */}
                <div className="w-24 flex items-center justify-center gap-1">
                    {changed ? (
                        <Button
                            size="sm"
                            onClick={() => handleSaveItem(item)}
                            disabled={isSaving}
                            className="h-7 px-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                        >
                            <Save className="w-3 h-3 mr-1" />
                            {isSaving ? '...' : t('consumos.save', 'Guardar')}
                        </Button>
                    ) : (
                        <Badge className={`text-xs px-3 py-1 ${
                            estado === 'OK'
                                ? 'bg-[color:var(--status-success-soft)] text-[color:var(--status-success)] border-[color:var(--status-success)]/40'
                                : 'bg-[color:var(--status-error-soft)] text-[color:var(--status-error)] border-[color:var(--status-error)]/40'
                        }`}>
                            {estado === 'OK' ? (
                                <span>OK</span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {t('consumos.low', 'Baixo')}
                                </span>
                            )}
                        </Badge>
                    )}
                </div>
            </div>
        );
    };

    // =====================================================================
    // RENDER: ARMAZÉM
    // =====================================================================

    const renderArmazem = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Action bar */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {t('consumos.armazemDescription', 'Gestão de inventário do balneário. Clique nos valores para editar.')}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={editingMinimos ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEditingMinimos(!editingMinimos)}
                            className={editingMinimos ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
                        >
                            {editingMinimos ? t('consumos.exitEditing', 'Sair da edição') : t('consumos.editMinimos', 'Editar Mínimos')}
                        </Button>
                        {anyChanges && (
                            <Button
                                onClick={handleSaveAll}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="sm"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                {t('consumos.saveAll', 'Guardar Tudo')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* All categories rendered as white cards with table layout */}
                {Object.keys(groupedItems).sort((a, b) => {
                    if (a === 'CALCADO') return 1;
                    if (b === 'CALCADO') return -1;
                    return a.localeCompare(b);
                }).map(categoria => {
                    const catItems = groupedItems[categoria];
                    const isCollapsed = collapsedCategories[categoria];

                    return (
                        <div key={categoria} className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
                            <div 
                                className="flex items-center justify-between mb-5 cursor-pointer select-none group"
                                onClick={() => toggleCategory(categoria)}
                            >
                                <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight">
                                    {getCategoryLabel(categoria)}
                                </h2>
                                <button
                                    className="p-1.5 rounded-full bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors"
                                >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                </button>
                            </div>

                            {!isCollapsed && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Table Header */}
                                    <div className={categoria === 'CALCADO' ? "grid grid-cols-1 lg:grid-cols-2 gap-x-8" : ""}>
                                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 pb-2 border-b border-border/70">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {categoria === 'CALCADO' ? t('consumos.size', 'Tamanho') : t('consumos.product', 'Produto')}
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-40">
                                                {t('consumos.quantity', 'Quantidade')}
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-24">
                                                {t('consumos.minimum', 'Mínimo')}
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-24">
                                                {t('consumos.status', 'Estado')}
                                            </span>
                                        </div>
                                        {categoria === 'CALCADO' && (
                                            <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 pb-2 border-b border-border/70">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {t('consumos.size', 'Tamanho')}
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-40">
                                                    {t('consumos.quantity', 'Quantidade')}
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-24">
                                                    {t('consumos.minimum', 'Mínimo')}
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-24">
                                                    {t('consumos.status', 'Estado')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {catItems.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            {t('consumos.noItemsConfigured', 'Nenhum produto configurado nesta categoria.')}
                                        </div>
                                    ) : (
                                        <div className={categoria === 'CALCADO' ? "grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0" : "flex flex-col"}>
                                            {(categoria === 'CALCADO'
                                                ? [...catItems].sort((a, b) => parseInt(a.nome) - parseInt(b.nome))
                                                : catItems
                                            ).map(item => renderItemRow(item, categoria === 'CALCADO'))}
                                        </div>
                                    )}

                                    {/* Total count for calçado */}
                                    {categoria === 'CALCADO' && (
                                        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
                                            <span className="text-sm text-muted-foreground">
                                                {t('consumos.totalInStock', 'Total em stock')}: <strong>
                                                    {catItems.reduce((sum, item) => {
                                                        const editing = editingItems[item.id];
                                                        return sum + (editing?.quantidade ?? item.quantidade);
                                                    }, 0)} {t('consumos.pairs', 'pares')}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // =====================================================================
    // RENDER: ESTATÍSTICAS
    // =====================================================================

    const renderEstatisticas = () => {
        if (statsLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            );
        }

        if (!stats) return null;

        // Aggregate by category for summary cards
        const catLabels: Record<string, string> = {
            'HIGIENE': getCategoryLabel('HIGIENE'),
            'DETERGENTES': getCategoryLabel('DETERGENTES'),
            'VESTUARIO': getCategoryLabel('VESTUARIO'),
            'CALCADO': getCategoryLabel('CALCADO'),
        };


        // Aggregate by category for category summary
        const catTotals = {
            'HIGIENE': stats.totaisPorCategoria['HIGIENE'] || 0,
            'DETERGENTES': stats.totaisPorCategoria['DETERGENTES'] || 0,
            'VESTUARIO': stats.totaisPorCategoria['VESTUARIO'] || 0,
            'CALCADO': stats.totaisPorCategoria['CALCADO'] || 0,
            ...Object.entries(stats.totaisPorCategoria)
                .filter(([cat]) => !['HIGIENE', 'DETERGENTES', 'CALCADO', 'VESTUARIO'].includes(cat))
                .reduce((acc, [cat, val]) => ({ ...acc, [cat]: val }), {})
        } as Record<string, number>;

        const getCatBarColorHex = (cat: string) => {
            switch (cat) {
                case 'HIGIENE': return 'var(--primary)';
                case 'DETERGENTES': return 'var(--status-success)';
                case 'VESTUARIO': return 'var(--status-info)';
                case 'CALCADO': return 'var(--status-warning)';
                default: return 'var(--status-neutral)';
            }
        };

        // Initialize with all items from the inventory to show 0 for unconsumed items
        const statsByCategory = items.reduce((acc, item) => {
            if (!acc[item.categoria]) acc[item.categoria] = [];
            acc[item.categoria].push({ nome: item.nome, quantidade: 0 });
            return acc;
        }, {
            'HIGIENE': [],
            'DETERGENTES': [],
        } as Record<string, { nome: string; quantidade: number }[]>);

        if (stats && stats.itens) {
            for (const statItem of stats.itens) {
                if (!statsByCategory[statItem.categoria]) {
                    statsByCategory[statItem.categoria] = [];
                }
                const existing = statsByCategory[statItem.categoria].find(i => i.nome === statItem.nome);
                if (existing) {
                    existing.quantidade += statItem.quantidade;
                } else {
                    statsByCategory[statItem.categoria].push({ nome: statItem.nome, quantidade: statItem.quantidade });
                }
            }
        }

        return (
            <div className="space-y-6">
                {/* Period selector */}
                <div className="flex items-center gap-2">
                    {(['DIA', 'SEMANA', 'MES'] as const).map(periodo => (
                        <Button
                            key={periodo}
                            variant={statsPeriodo === periodo ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatsPeriodo(periodo)}
                            className={statsPeriodo === periodo ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
                        >
                            {periodo === 'DIA' ? t('consumos.day', 'Hoje') : periodo === 'SEMANA' ? t('consumos.week', 'Semana') : t('consumos.month', 'Mês')}
                        </Button>
                    ))}
                </div>{/* Period selector */}

                <div className="flex flex-col gap-8 mb-8">
                    {/* DIV PRESENÇAS */}
                    <div className="bg-card/50 rounded-2xl p-6 border border-border shadow-sm">
                        <h2 className="text-2xl font-bold mb-6 text-foreground">Estatísticas de Presenças</h2>
                        {/* Presenças Summary */}
                        {attendanceStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('stats.totalAppointments', 'Marcações')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">{attendanceStats.totalMarcacoes}</p>
                                </div>
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider text-[color:var(--status-success)]">{t('stats.attended', 'Compareceu')}</p>
                                    <p className="text-3xl font-bold text-[color:var(--status-success)] mt-1">{attendanceStats.totalPresencas}</p>
                                </div>
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider text-[color:var(--status-error)]">{t('stats.missed', 'Faltou')}</p>
                                    <p className="text-3xl font-bold text-[color:var(--status-error)] mt-1">{attendanceStats.totalFaltou}</p>
                                </div>
                                <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider text-[color:var(--status-warning)]">{t('stats.agendado', 'Agendado')}</p>
                                    <p className="text-3xl font-bold text-[color:var(--status-warning)] mt-1">{attendanceStats.totalAgendadas}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* BalnearioCharts for Presenças */}
                        {attendanceStats && (
                            <BalnearioCharts 
                                isDarkMode={_isDarkMode} 
                                data={[
                                    { name: 'Compareceu', value: attendanceStats.totalPresencas },
                                    { name: 'Faltou', value: attendanceStats.totalFaltou },
                                    { name: 'Agendado', value: attendanceStats.totalAgendadas }
                                ]}
                                barChartTitle="Comparação de Estados"
                                pieChartTitle="Distribuição de Estados"
                                customColors={['var(--status-success)', 'var(--status-error)', 'var(--status-warning)']}
                            />
                        )}
                    </div>

                    {/* DIV CONSUMOS */}
                    <div className="bg-card/50 rounded-2xl p-6 border border-border shadow-sm">
                        <h2 className="text-2xl font-bold mb-6 text-foreground">Estatísticas de Consumos</h2>
                        {/* Summary cards consumos */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('consumos.totalConsumptions', 'Total Consumos')}</p>
                                <p className="text-3xl font-bold text-primary mt-1">{stats.totalGeral}</p>
                            </div>
                            <div className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Categorias Ativas</p>
                                <p className="text-3xl font-bold text-foreground mt-1">{Object.keys(stats.totaisPorCategoria).length}</p>
                            </div>
                            {Object.entries(catTotals).slice(0, 2).map(([cat, total]) => (
                                <div key={cat} className="bg-card rounded-xl border border-border p-4 shadow-sm text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{catLabels[cat] || cat}</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">{total}</p>
                                </div>
                            ))}
                        </div>

                        {/* BalnearioCharts for Consumos */}
                        {stats && (
                            <BalnearioCharts 
                                isDarkMode={_isDarkMode} 
                                data={Object.entries(stats.totaisPorCategoria).map(([name, value]) => ({ name: catLabels[name] || name, value }))}
                                barChartTitle="Consumo por Categoria"
                                pieChartTitle="Distribuição de Itens"
                            />
                        )}

                        {/* Modular Category Bar Charts */}
                        {Object.entries(statsByCategory).length === 0 ? (
                            <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center justify-center h-48 mt-6">
                                <p className="text-sm text-muted-foreground">{t('consumos.noDataForPeriod', 'Sem dados de consumo para este período')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                {Object.keys(statsByCategory).sort((a, b) => {
                                    if (a === 'CALCADO') return 1;
                                    if (b === 'CALCADO') return -1;
                                    return a.localeCompare(b);
                                }).map(cat => {
                                    const items = statsByCategory[cat].sort((a,b) => b.quantidade - a.quantidade);
                                    return (
                                        <div key={cat} className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col">
                                            <h3 className="text-base font-bold text-foreground mb-6 uppercase tracking-tight">
                                                {catLabels[cat] || cat}
                                            </h3>
                                            {items.length === 0 ? (
                                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-10">
                                                    {t('consumos.noItemsConfigured', 'Nenhum produto configurado nesta categoria.')}
                                                </div>
                                            ) : (
                                                <div style={{ height: Math.max(200, items.length * 50 + 50) }} className="w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart 
                                                        layout="vertical" 
                                                        data={items} 
                                                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                                        <XAxis 
                                                            type="number"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                                                            allowDecimals={false}
                                                        />
                                                        <YAxis 
                                                            type="category"
                                                            dataKey="nome" 
                                                            tickFormatter={(nome) => cat === 'CALCADO' ? String(nome).replace(/N[º°]\s*/i, '').trim() : (t(`consumos.products.${nome}`, nome) as string)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                                                            width={cat === 'CALCADO' ? 60 : 100}
                                                        />
                                                        <Tooltip 
                                                            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--foreground)', backgroundColor: 'var(--card)' }}
                                                            formatter={(value: number) => [<span className="font-bold text-primary">{value}</span>, t('consumos.quantity', 'Quantidade')]}
                                                            labelFormatter={(nome) => cat === 'CALCADO' ? `Tamanho ${nome}` : t(`consumos.products.${nome}`, nome as string)}
                                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--foreground)' }}
                                                        />
                                                        <Bar 
                                                            dataKey="quantidade" 
                                                            radius={[0, 4, 4, 0]} 
                                                            barSize={24}
                                                        >
                                                            {items.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={getCatBarColorHex(cat)} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Charts */}
            </div>
        );
    };

    // =====================================================================
    // MAIN RENDER
    // =====================================================================

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Tab Content */}
            {actualTab === 'armazem' ? renderArmazem() : renderEstatisticas()}

            {/* Unsaved changes warning dialog */}
            <AlertDialog open={false}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('consumos.unsavedTitle', 'Modificações por guardar')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('consumos.unsavedDescription', 'Tem modificações que não foram guardadas. Deseja descartar as alterações?')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('profile.unsaved.stay', 'Ficar')}
                        </AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
                            {t('profile.unsaved.discard', 'Descartar')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
