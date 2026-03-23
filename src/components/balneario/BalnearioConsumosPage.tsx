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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BalnearioConsumosPageProps {
    isDarkMode: boolean;
}

type TabType = 'armazem' | 'estatisticas';

export function BalnearioConsumosPage({ isDarkMode: _isDarkMode }: BalnearioConsumosPageProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('armazem');
    const [items, setItems] = useState<ItemArmazemDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItems, setEditingItems] = useState<Record<number, { quantidade: number; quantidadeMinima: number }>>({});
    const [savingItems, setSavingItems] = useState<Set<number>>(new Set());
    const [editingMinimos, setEditingMinimos] = useState(false);

    // Unsaved changes warning
    const [pendingTab, setPendingTab] = useState<TabType | null>(null);

    // Estatísticas
    const [stats, setStats] = useState<ConsumoEstatisticaDTO | null>(null);
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
            const data = await armazemApi.obterEstatisticas(statsPeriodo);
            setStats(data);
        } catch {
            toast.error(t('consumos.statsError', 'Erro ao carregar estatísticas'));
        } finally {
            setStatsLoading(false);
        }
    }, [statsPeriodo, t]);

    useEffect(() => {
        carregarItens();
    }, [carregarItens]);

    useEffect(() => {
        if (activeTab === 'estatisticas') {
            carregarEstatisticas();
        }
    }, [activeTab, carregarEstatisticas]);

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

    // Tab switching with unsaved changes warning
    const handleTabSwitch = (newTab: TabType) => {
        if (newTab === activeTab) return;
        if (activeTab === 'armazem' && (anyChanges || editingMinimos)) {
            setPendingTab(newTab);
        } else {
            setActiveTab(newTab);
        }
    };

    const confirmTabSwitch = () => {
        if (pendingTab) {
            setEditingItems({});
            setEditingMinimos(false);
            setActiveTab(pendingTab);
            setPendingTab(null);
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
    }, {});

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'DETERGENTES': return t('consumos.categories.detergentes', 'Detergentes');
            case 'HIGIENE': return t('consumos.categories.higiene', 'Higiene');
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
            <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 py-3 border-b border-gray-100 dark:border-gray-700/30 last:border-b-0">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                    {isCalcado ? `${t('consumos.size', 'Tamanho')} ${item.nome}` : t(`consumos.products.${item.nome}`, item.nome)}
                </span>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 w-40 justify-center">
                    <button
                        onClick={() => handleQuantidadeChange(item, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                        min={0}
                    />
                    <span className="text-xs text-gray-400 w-8">{item.unidade}</span>
                    <button
                        onClick={() => handleQuantidadeChange(item, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                            className="w-16 h-8 text-center text-sm mx-auto border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                            min={0}
                        />
                    ) : (
                        <span className="text-sm text-gray-600 dark:text-gray-400">{min} {item.unidade}</span>
                    )}
                </div>

                {/* Status + Save */}
                <div className="w-24 flex items-center justify-center gap-1">
                    {changed ? (
                        <Button
                            size="sm"
                            onClick={() => handleSaveItem(item)}
                            disabled={isSaving}
                            className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                        >
                            <Save className="w-3 h-3 mr-1" />
                            {isSaving ? '...' : t('consumos.save', 'Guardar')}
                        </Button>
                    ) : (
                        <Badge className={`text-xs px-3 py-1 ${
                            estado === 'OK'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800'
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
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Action bar */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('consumos.armazemDescription', 'Gestão de inventário do balneário. Clique nos valores para editar.')}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={editingMinimos ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEditingMinimos(!editingMinimos)}
                            className={editingMinimos ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                        >
                            {editingMinimos ? t('consumos.exitEditing', 'Sair da edição') : t('consumos.editMinimos', 'Editar Mínimos')}
                        </Button>
                        {anyChanges && (
                            <Button
                                onClick={handleSaveAll}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
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
                        <div key={categoria} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm mb-6">
                            <div 
                                className="flex items-center justify-between mb-5 cursor-pointer select-none group"
                                onClick={() => toggleCategory(categoria)}
                            >
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                    {getCategoryLabel(categoria)}
                                </h2>
                                <button
                                    className="p-1.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700 dark:group-hover:bg-gray-700 transition-colors"
                                >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                </button>
                            </div>

                            {!isCollapsed && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Table Header */}
                                    <div className={categoria === 'CALCADO' ? "grid grid-cols-1 lg:grid-cols-2 gap-x-8" : ""}>
                                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {categoria === 'CALCADO' ? t('consumos.size', 'Tamanho') : t('consumos.product', 'Produto')}
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-40">
                                                {t('consumos.quantity', 'Quantidade')}
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-24">
                                                {t('consumos.minimum', 'Mínimo')}
                                            </span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-24">
                                                {t('consumos.status', 'Estado')}
                                            </span>
                                        </div>
                                        {categoria === 'CALCADO' && (
                                            <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    {t('consumos.size', 'Tamanho')}
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-40">
                                                    {t('consumos.quantity', 'Quantidade')}
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-24">
                                                    {t('consumos.minimum', 'Mínimo')}
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center w-24">
                                                    {t('consumos.status', 'Estado')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items - for calçado, two columns on large screens + sorting */}
                                    <div className={categoria === 'CALCADO' ? "grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0" : "flex flex-col"}>
                                        {(categoria === 'CALCADO'
                                            ? [...catItems].sort((a, b) => parseInt(a.nome) - parseInt(b.nome))
                                            : catItems
                                        ).map(item => renderItemRow(item, categoria === 'CALCADO'))}
                                    </div>

                                    {/* Total count for calçado */}
                                    {categoria === 'CALCADO' && (
                                        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
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
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                </div>
            );
        }

        if (!stats) return null;

        // Aggregate by category for summary cards
        const catLabels: Record<string, string> = {
            'HIGIENE': getCategoryLabel('HIGIENE'),
            'DETERGENTES': getCategoryLabel('DETERGENTES'),
            'CALCADO': getCategoryLabel('CALCADO'),
        };


        // Aggregate by category for category summary
        const catTotals = {
            'HIGIENE': stats.totaisPorCategoria['HIGIENE'] || 0,
            'DETERGENTES': stats.totaisPorCategoria['DETERGENTES'] || 0,
            'CALCADO': stats.totaisPorCategoria['CALCADO'] || 0
        };

        const getCatBarColorHex = (cat: string) => {
            switch (cat) {
                case 'HIGIENE': return '#EC4899';
                case 'DETERGENTES': return '#22C55E';
                case 'CALCADO': return '#A855F7';
                default: return '#6B7280';
            }
        };

        const statsByCategory = stats.itens.reduce((acc, item) => {
            if (!acc[item.categoria]) acc[item.categoria] = [];
            
            const existing = acc[item.categoria].find(i => i.nome === item.nome);
            if (existing) {
                existing.quantidade += item.quantidade;
            } else {
                acc[item.categoria].push({ nome: item.nome, quantidade: item.quantidade });
            }
            return acc;
        }, {} as Record<string, { nome: string; quantidade: number }[]>);

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
                            className={statsPeriodo === periodo ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                        >
                            {periodo === 'DIA' ? t('consumos.day', 'Hoje') : periodo === 'SEMANA' ? t('consumos.week', 'Semana') : t('consumos.month', 'Mês')}
                        </Button>
                    ))}
                </div>

                {/* Summary cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('consumos.totalConsumptions', 'Total Consumos')}</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalGeral}</p>
                            </div>
                            {Object.entries(catTotals).map(([cat, total]) => (
                                <div key={cat} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{catLabels[cat] || cat}</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{total}</p>
                                </div>
                            ))}
                        </div>

                        {/* Modular Category Bar Charts */}
                        {Object.entries(statsByCategory).length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-center h-48 mt-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('consumos.noDataForPeriod', 'Sem dados de consumo para este período')}</p>
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
                                        <div key={cat} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-tight">
                                                {catLabels[cat] || cat}
                                            </h3>
                                            <div style={{ height: Math.max(200, items.length * 50 + 50) }} className="w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart 
                                                        layout="vertical" 
                                                        data={items} 
                                                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                                        <XAxis 
                                                            type="number"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                                            allowDecimals={false}
                                                        />
                                                        <YAxis 
                                                            type="category"
                                                            dataKey="nome" 
                                                            tickFormatter={(nome) => cat === 'CALCADO' ? `Nº ${nome}` : (t(`consumos.products.${nome}`, nome) as string)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                                            width={cat === 'CALCADO' ? 60 : 100}
                                                        />
                                                        <Tooltip 
                                                            cursor={{ fill: '#F3F4F6', opacity: 0.4 }}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#111827' }}
                                                            formatter={(value: number) => [<span className="font-bold text-purple-600">{value}</span>, t('consumos.quantity', 'Quantidade')]}
                                                            labelFormatter={(nome) => cat === 'CALCADO' ? `Tamanho ${nome}` : t(`consumos.products.${nome}`, nome as string)}
                                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}
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
                                        </div>
                                    );
                                })}
                            </div>
                        )}
            </div>
        );
    };

    // =====================================================================
    // MAIN RENDER
    // =====================================================================

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Header with Tabs */}
            <div className="flex justify-start mb-8">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5 w-[350px]">
                    <button
                        onClick={() => handleTabSwitch('armazem')}
                        className={`flex-1 py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                            activeTab === 'armazem'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        {t('consumos.warehouse', 'Armazém')}
                    </button>
                    <button
                        onClick={() => handleTabSwitch('estatisticas')}
                        className={`flex-1 py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                            activeTab === 'estatisticas'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        {t('consumos.statistics', 'Estatísticas')}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'armazem' ? renderArmazem() : renderEstatisticas()}

            {/* Unsaved changes warning dialog */}
            <AlertDialog open={pendingTab !== null} onOpenChange={() => setPendingTab(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('consumos.unsavedTitle', 'Modificações por guardar')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('consumos.unsavedDescription', 'Tem modificações que não foram guardadas. Deseja descartar as alterações?')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingTab(null)}>
                            {t('profile.unsaved.stay', 'Ficar')}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmTabSwitch} className="bg-red-600 hover:bg-red-700 text-white">
                            {t('profile.unsaved.discard', 'Descartar')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
