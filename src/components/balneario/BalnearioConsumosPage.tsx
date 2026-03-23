import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Package, BarChart3, Minus, Plus, Save, AlertTriangle, ShoppingBag, Droplets, Footprints } from 'lucide-react';
import { armazemApi, ItemArmazemDTO, ConsumoEstatisticaDTO } from '../../services/api/armazem/armazemApi';

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

    // Estatísticas
    const [stats, setStats] = useState<ConsumoEstatisticaDTO | null>(null);
    const [statsPeriodo, setStatsPeriodo] = useState<'DIA' | 'SEMANA' | 'MES'>('MES');
    const [statsLoading, setStatsLoading] = useState(false);

    const carregarItens = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await armazemApi.listarTodos();
            setItems(data);
        } catch (error) {
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
        } catch (error) {
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

    // =====================================================================
    // ARMAZÉM HANDLERS
    // =====================================================================

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

    const hasChanges = (item: ItemArmazemDTO) => {
        const editing = editingItems[item.id];
        if (!editing) return false;
        return editing.quantidade !== item.quantidade || editing.quantidadeMinima !== item.quantidadeMinima;
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
        } catch (error) {
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
        const changedItems = items.filter(item => hasChanges(item));
        if (changedItems.length === 0) return;

        for (const item of changedItems) {
            await handleSaveItem(item);
        }
    };

    // =====================================================================
    // GROUPING
    // =====================================================================

    const groupedItems = items.reduce<Record<string, ItemArmazemDTO[]>>((acc, item) => {
        if (!acc[item.categoria]) acc[item.categoria] = [];
        acc[item.categoria].push(item);
        return acc;
    }, {});

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'DETERGENTES': return <Droplets className="w-5 h-5" />;
            case 'HIGIENE': return <ShoppingBag className="w-5 h-5" />;
            case 'CALCADO': return <Footprints className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'DETERGENTES': return t('consumos.categories.detergentes', 'Detergentes');
            case 'HIGIENE': return t('consumos.categories.higiene', 'Higiene');
            case 'CALCADO': return t('consumos.categories.calcado', 'Stock de Calçado');
            default: return cat;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'DETERGENTES': return 'from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800';
            case 'HIGIENE': return 'from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 border-pink-200 dark:border-pink-800';
            case 'CALCADO': return 'from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800';
            default: return 'from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-700';
        }
    };

    const getIconBgColor = (cat: string) => {
        switch (cat) {
            case 'DETERGENTES': return 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400';
            case 'HIGIENE': return 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400';
            case 'CALCADO': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400';
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
        }
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

        const anyChanges = items.some(item => hasChanges(item));

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
                            {editingMinimos ? t('consumos.editingMinimos', 'A editar mínimos') : t('consumos.editMinimos', 'Editar Mínimos')}
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

                {/* Categories */}
                {Object.entries(groupedItems).filter(([cat]) => cat !== 'CALCADO').map(([categoria, catItems]) => (
                    <div key={categoria} className={`bg-gradient-to-br ${getCategoryColor(categoria)} rounded-2xl border p-6 shadow-sm`}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor(categoria)}`}>
                                {getCategoryIcon(categoria)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {getCategoryLabel(categoria)}
                            </h3>
                        </div>

                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {t('consumos.product', 'Produto')}
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

                        {/* Items */}
                        {catItems.map(item => {
                            const editing = editingItems[item.id];
                            const qty = editing?.quantidade ?? item.quantidade;
                            const min = editing?.quantidadeMinima ?? item.quantidadeMinima;
                            const estado = qty >= min ? 'OK' : 'BAIXO';
                            const isSaving = savingItems.has(item.id);
                            const changed = hasChanges(item);

                            return (
                                <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-2 py-3 border-b border-gray-100/60 dark:border-gray-700/30 last:border-b-0">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.nome}</span>

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
                                                        Stock Baixo
                                                    </span>
                                                )}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Calçado Section - Special Grid Layout */}
                {groupedItems['CALCADO'] && (
                    <div className={`bg-gradient-to-br ${getCategoryColor('CALCADO')} rounded-2xl border p-6 shadow-sm`}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor('CALCADO')}`}>
                                    <Footprints className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {getCategoryLabel('CALCADO')}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {t('consumos.quantityBySize', 'Quantidade por tamanho')}
                                    </p>
                                </div>
                            </div>
                            {groupedItems['CALCADO'].some(item => hasChanges(item)) && (
                                <Button
                                    onClick={handleSaveAll}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    size="sm"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    {t('consumos.save', 'Guardar')}
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-3">
                            {groupedItems['CALCADO']
                                .sort((a, b) => parseInt(a.nome) - parseInt(b.nome))
                                .map(item => {
                                    const editing = editingItems[item.id];
                                    const qty = editing?.quantidade ?? item.quantidade;
                                    const min = editing?.quantidadeMinima ?? item.quantidadeMinima;
                                    const estado = qty >= min ? 'OK' : 'BAIXO';

                                    return (
                                        <div
                                            key={item.id}
                                            className={`rounded-xl border p-3 text-center transition-all ${
                                                estado === 'BAIXO'
                                                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                            }`}
                                        >
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                                                {t('consumos.size', 'Tamanho')}
                                            </p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                                {item.nome}
                                            </p>

                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleQuantidadeChange(item, -1)}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <Input
                                                    type="number"
                                                    value={qty}
                                                    onChange={(e) => handleQuantidadeInput(item, e.target.value)}
                                                    className={`w-12 h-7 text-center text-sm font-semibold border rounded ${
                                                        estado === 'BAIXO'
                                                            ? 'border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30'
                                                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                    }`}
                                                    min={0}
                                                />
                                                <button
                                                    onClick={() => handleQuantidadeChange(item, 1)}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {estado === 'BAIXO' && (
                                                <p className="text-[10px] text-red-600 dark:text-red-400 mt-1.5 font-medium">
                                                    {t('consumos.low', 'Baixo')}
                                                </p>
                                            )}

                                            {hasChanges(item) && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveItem(item)}
                                                    disabled={savingItems.has(item.id)}
                                                    className="mt-2 h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-700 text-white w-full"
                                                >
                                                    <Save className="w-3 h-3 mr-0.5" />
                                                    {savingItems.has(item.id) ? '...' : t('consumos.save', 'Guardar')}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Total count */}
                        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                            <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm text-purple-700 dark:text-purple-300">
                                {t('consumos.totalInStock', 'Total em stock')}: <strong>
                                    {groupedItems['CALCADO'].reduce((sum, item) => {
                                        const editing = editingItems[item.id];
                                        return sum + (editing?.quantidade ?? item.quantidade);
                                    }, 0)} {t('consumos.pairs', 'pares')}
                                </strong>
                            </span>
                        </div>
                    </div>
                )}
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

        // Aggregate by item name for the table
        const byItem: Record<string, number> = {};
        for (const item of stats.itens) {
            byItem[item.nome] = (byItem[item.nome] || 0) + item.quantidade;
        }
        const sortedItems = Object.entries(byItem).sort((a, b) => b[1] - a[1]);

        // Aggregate by date for the chart
        const byDate: Record<string, number> = {};
        for (const item of stats.itens) {
            byDate[item.data] = (byDate[item.data] || 0) + item.quantidade;
        }
        const sortedDates = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
        const maxValue = Math.max(...sortedDates.map(([, v]) => v), 1);

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
                    {Object.entries(stats.totaisPorCategoria).map(([cat, total]) => (
                        <div key={cat} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{getCategoryLabel(cat)}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{total}</p>
                        </div>
                    ))}
                </div>

                {/* Simple bar chart */}
                {sortedDates.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            {t('consumos.consumptionOverTime', 'Consumos ao Longo do Tempo')}
                        </h3>
                        <div className="flex items-end gap-1 h-40">
                            {sortedDates.map(([date, value]) => {
                                const height = (value / maxValue) * 100;
                                const dateLabel = new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
                                return (
                                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>
                                        <div
                                            className="w-full bg-purple-500 rounded-t-md transition-all duration-300 min-h-[4px]"
                                            style={{ height: `${Math.max(height, 3)}%` }}
                                        />
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 rotate-0">{dateLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Top consumed items table */}
                {sortedItems.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            {t('consumos.mostConsumed', 'Itens Mais Consumidos')}
                        </h3>
                        <div className="space-y-2">
                            {sortedItems.map(([nome, quantidade], index) => (
                                <div key={nome} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-mono text-gray-400 w-6">#{index + 1}</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{nome}</span>
                                    </div>
                                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                                        {quantidade}x
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {stats.totalGeral === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                        <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
                        <p>{t('consumos.noDataForPeriod', 'Sem dados de consumo para este período')}</p>
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
            <div className="flex items-center gap-4 mb-6">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('armazem')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'armazem'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <Package className="w-4 h-4 inline mr-2" />
                        {t('consumos.warehouse', 'Armazém')}
                    </button>
                    <button
                        onClick={() => setActiveTab('estatisticas')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'estatisticas'
                                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        {t('consumos.statistics', 'Estatísticas')}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'armazem' ? renderArmazem() : renderEstatisticas()}
        </div>
    );
}
