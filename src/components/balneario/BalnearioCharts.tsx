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
    data: { name: string; value: number }[];
    barChartTitle: string;
    pieChartTitle: string;
    customColors?: string[];
}

export function BalnearioCharts({ isDarkMode, data, barChartTitle, pieChartTitle, customColors }: BalnearioChartsProps) {
    const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
    const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-100';

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className={textSecondaryClass}>A carregar estatísticas...</p>
            </div>
        );
    }

    // Cores para os gráficos
    const defaultColors = ['#a855f7', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];
    const COLORS = customColors || defaultColors;

    return (
        <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <GlassCard className="p-6">
                    <h3 className={`text-lg font-bold mb-6 ${textClass}`}>{barChartTitle}</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
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
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Pie Chart */}
                <GlassCard className="p-6">
                    <h3 className={`text-lg font-bold mb-6 ${textClass}`}>{pieChartTitle}</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
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
