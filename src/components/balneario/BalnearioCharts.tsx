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
        </div>
    );
}
