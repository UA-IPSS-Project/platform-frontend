
import type React from 'react';
import { useTranslation } from 'react-i18next';
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
    Legend,
    type TooltipProps
} from 'recharts';
import { GlassCard } from '../ui/glass-card';

interface BalnearioChartsProps {
    data: { name: string; value: number }[];
    barChartTitle: string;
    pieChartTitle: string;
    customColors?: string[];
}

export function BalnearioCharts({ data, barChartTitle, pieChartTitle, customColors }: BalnearioChartsProps) {
    const { t } = useTranslation();

    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-4 rounded-xl shadow-lg border bg-card border-border">
                    <div className="text-[17px] tracking-wide font-extrabold pb-3 border-b border-dashed text-foreground border-border">
                        {label || payload[0]?.name || ''}
                    </div>
                    <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-[16px] text-foreground">{t('consumos.quantity', 'Quantidade')} :</span>
                        <span className="text-[18px] font-bold text-primary">{payload[0].value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">{t('consumos.loadingStats', 'A carregar estatísticas...')}</p>
            </div>
        );
    }

    // Cores para os gráficos
    const defaultColors = [
        'var(--status-in-progress)',
        'var(--status-info)',
        'var(--status-warning)',
        'var(--status-success)',
        'var(--status-error)',
        'var(--chart-2)',
        'var(--primary)',
        'var(--chart-4)',
    ];
    const COLORS = customColors || defaultColors;

    return (
        <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-6 text-foreground">{barChartTitle}</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--muted)'}} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Pie Chart */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold mb-6 text-foreground">{pieChartTitle}</h3>
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
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
