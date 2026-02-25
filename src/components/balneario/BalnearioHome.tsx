import { useEffect, useState } from 'react';
import { GlassCard } from '../ui/glass-card';
import {
    Calendar,
    ClipboardList,
    Coffee, // assuming a generic icon for consumos until tailored
    TrendingUp,
    Clock,
    ArrowRight,
} from 'lucide-react';
import { useIsMobile } from '../ui/use-mobile';

interface BalnearioHomeProps {
    isDarkMode: boolean;
    onNavigate: (view: string) => void;
}

const recentActivity = [
    { type: 'marcacao', text: 'Nova marcação para Balneário - João Santos', time: 'Há 10 min', color: 'bg-purple-500' },
    { type: 'consumo', text: 'Registo de Consumo - Banho', time: 'Há 45 min', color: 'bg-blue-500' },
];

export default function BalnearioHome({ isDarkMode, onNavigate }: BalnearioHomeProps) {
    const isMobile = useIsMobile();
    const [marcacoesHoje, setMarcacoesHoje] = useState<string>('0');
    const [consumosHoje, setConsumosHoje] = useState<string>('0');

    useEffect(() => {
        // Simulando chamada à API
        setMarcacoesHoje('5');
        setConsumosHoje('12');
    }, []);

    const stats = [
        { icon: Calendar, label: 'Marcações Hoje', value: marcacoesHoje, color: '#a855f7', view: 'appointments' }, // purple-500
        { icon: Coffee, label: 'Consumos Registo', value: consumosHoje, color: '#3b82f6', view: 'consumos' }, // blue-500
        { icon: ClipboardList, label: 'Requisições Pendentes', value: '2', color: '#f59e0b', view: 'requisitions' }, // amber-500
    ];

    const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
    const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Welcome Section */}
            <GlassCard className="p-6">
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-4`}>
                    <div>
                        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${textClass} mb-1`}>
                            Gestão do Balneário
                        </h1>
                        <p className={`text-base ${textSecondaryClass}`}>
                            Acesso rápido a marcações e consumos
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700 ${isMobile ? 'w-full justify-center' : 'whitespace-nowrap'}`}>
                        <Clock className={`w-4 h-4 ${textSecondaryClass}`} />
                        <span className={`text-sm font-medium ${textSecondaryClass} capitalize ${isMobile ? 'text-xs' : ''}`}>
                            {new Date().toLocaleDateString('pt-PT', {
                                weekday: isMobile ? 'short' : 'long',
                                day: 'numeric',
                                month: isMobile ? 'short' : 'long',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Stats Grid */}
            <div className="flex flex-row gap-6 w-full overflow-x-auto pb-2">
                {stats.map((stat, index) => (
                    <div key={index} onClick={() => onNavigate(stat.view)} className="cursor-pointer group flex-1 min-w-[200px]">
                        <GlassCard className="p-6 h-full hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden flex flex-col justify-center">
                            <div className="relative z-10 flex items-center justify-between w-full">
                                <div className="flex flex-col min-w-0">
                                    <p className={`text-xs font-medium ${textSecondaryClass} mb-1 truncate uppercase tracking-wider`}>{stat.label}</p>
                                    <p className={`text-3xl font-bold ${textClass} tracking-tight`}>{stat.value}</p>
                                </div>
                                <div
                                    className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3"
                                    style={{ backgroundColor: stat.color }}
                                >
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6 items-start`}>
                {/* Recent Activity */}
                <div className="h-full">
                    <GlassCard className="p-0 overflow-hidden h-full min-h-[400px]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className={`text-lg font-bold ${textClass}`}>Atividade Recente</h2>
                            <button
                                onClick={() => onNavigate('notificacoes')}
                                className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
                            >
                                Ver tudo <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="group p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-md cursor-pointer flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 ${activity.color}`}>
                                        {activity.type === 'marcacao' ? <Calendar className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold ${textClass} text-sm mb-0.5 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors`}>{activity.text}</p>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className={`w-3 h-3 ${textSecondaryClass}`} />
                                            <p className={`text-xs ${textSecondaryClass}`}>{activity.time}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-purple-500 transition-colors transform group-hover:translate-x-1" />
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Quick Actions */}
                <div className="h-full">
                    <GlassCard className="p-0 h-full min-h-[400px] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className={`text-lg font-bold ${textClass}`}>Ações Rápidas</h2>
                        </div>
                        <div className="p-4 flex-1 flex items-center">
                            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full`}>
                                <button
                                    onClick={() => onNavigate('appointments')}
                                    className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(88, 28, 135, 0.2)' : '#faf5ff', // purple-50
                                        borderColor: isDarkMode ? '#6b21a8' : '#f3e8ff'
                                    }}
                                >
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                                        style={{ backgroundColor: isDarkMode ? 'rgba(88, 28, 135, 0.5)' : '#ffffff', color: '#9333ea' }}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <p className={`font-semibold ${textClass} text-lg mb-1`}>Marcações</p>
                                    <p className={`text-sm ${textSecondaryClass}`}>Ver agenda</p>
                                </button>

                                <button
                                    onClick={() => onNavigate('consumos')}
                                    className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', // blue-50
                                        borderColor: isDarkMode ? '#2563eb' : '#dbeafe'
                                    }}
                                >
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                                        style={{ backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.5)' : '#ffffff', color: '#3b82f6' }}>
                                        <Coffee className="w-6 h-6" />
                                    </div>
                                    <p className={`font-semibold ${textClass} text-lg mb-1`}>Consumos</p>
                                    <p className={`text-sm ${textSecondaryClass}`}>Registar consumo</p>
                                </button>

                                <button
                                    onClick={() => onNavigate('requisitions')}
                                    className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb', // amber-50
                                        borderColor: isDarkMode ? '#d97706' : '#fef3c7'
                                    }}
                                >
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                                        style={{ backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.5)' : '#ffffff', color: '#f59e0b' }}>
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <p className={`font-semibold ${textClass} text-lg mb-1`}>Requisições</p>
                                    <p className={`text-sm ${textSecondaryClass}`}>Efetuar pedido</p>
                                </button>

                                <button
                                    onClick={() => onNavigate('reports')}
                                    className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                                    style={{
                                        backgroundColor: isDarkMode ? 'rgba(20, 83, 45, 0.2)' : '#f0fdf4', // green-50
                                        borderColor: isDarkMode ? '#166534' : '#dcfce7'
                                    }}
                                >
                                    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                                        style={{ backgroundColor: isDarkMode ? 'rgba(20, 83, 45, 0.5)' : '#ffffff', color: '#16a34a' }}>
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <p className={`font-semibold ${textClass} text-lg mb-1`}>Relatórios</p>
                                    <p className={`text-sm ${textSecondaryClass}`}>Estatísticas</p>
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
