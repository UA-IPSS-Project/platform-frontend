import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { GlassCard } from '../ui/glass-card';
import { TrendingUp, Users, Package, Clock } from 'lucide-react';

interface BalnearioChartsProps {
    isDarkMode: boolean;
    stats: {
        periodo: string;
        totalGeral: number;
        totaisPorCategoria: Record<string, number>;
        itens: Array<{
            categoria: string;
            nome: string;
            quantidade: number;
            data: string;
        }>;
    } | null;
}

export function BalnearioCharts({ isDarkMode, stats }: BalnearioChartsProps) {
    const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
    const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-100';

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className={textSecondaryClass}>A carregar estatísticas...</p>
            </div>
        );
    }

    // Preparar dados para o gráfico de barras (Consumo por Categoria)
    const categoryData = Object.entries(stats.totaisPorCategoria).map(([name, value]) => ({
        name,
        value
    }));

    // Cores para os gráficos
    const COLORS = ['#a855f7', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Users className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <p className={`text-xs font-medium uppercase tracking-wider ${textSecondaryClass}`}>Total Consumos</p>
                        <p className={`text-2xl font-bold ${textClass}`}>{stats.totalGeral}</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className={`text-xs font-medium uppercase tracking-wider ${textSecondaryClass}`}>Categorias Ativas</p>
                        <p className={`text-2xl font-bold ${textClass}`}>{categoryData.length}</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className={`text-xs font-medium uppercase tracking-wider ${textSecondaryClass}`}>Período</p>
                        <p className={`text-2xl font-bold ${textClass}`}>{stats.periodo}</p>
                    </div>
                </GlassCard>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Consumption by Category */}
                <GlassCard className="p-6">
                    <h3 className={`text-lg font-bold mb-6 ${textClass}`}>Consumo por Categoria</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                                        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                                        color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Pie Chart: Distribution */}
                <GlassCard className="p-6">
                    <h3 className={`text-lg font-bold mb-6 ${textClass}`}>Distribuição de Itens</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                                        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* Table: Item Details */}
            <GlassCard className="overflow-hidden">
                <div className={`px-6 py-4 border-b ${borderClass}`}>
                    <h3 className={`text-lg font-bold ${textClass}`}>Detalhes de Consumo Recente</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`border-b ${borderClass} bg-gray-50/50 dark:bg-gray-800/30`}>
                                <th className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>Data</th>
                                <th className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>Categoria</th>
                                <th className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>Item</th>
                                <th className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>Quantidade</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${borderClass}`}>
                            {stats.itens.slice(0, 10).map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className={`px-6 py-3 text-sm ${textSecondaryClass}`}>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            {item.data}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            item.categoria === 'HIGIENE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                            item.categoria === 'VESTUARIO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                        }`}>
                                            {item.categoria}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-3 text-sm font-medium ${textClass}`}>{item.nome}</td>
                                    <td className={`px-6 py-3 text-sm font-bold ${textClass}`}>{item.quantidade}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
