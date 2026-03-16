import React, { useEffect, useState } from 'react';
import { GlassCard } from '../ui/glass-card';
import {
  Calendar,
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  Clock,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { marcacoesApi, utilizadoresApi } from '../../services/api';
import { useIsMobile } from '../ui/use-mobile';

interface SecretaryHomeProps {
  isDarkMode: boolean;
  onNavigate: (view: string) => void;
}

const recentActivity = [
  { type: 'marcacao', text: 'Nova marcação - Maria Silva', time: 'Há 5 min', color: 'bg-purple-500' },
  { type: 'candidatura', text: 'Candidatura Creche recebida', time: 'Há 15 min', color: 'bg-pink-500' },
  { type: 'requisicao', text: 'Requisição aprovada - Escola', time: 'Há 1 hora', color: 'bg-blue-500' },
  { type: 'utente', text: 'Novo utente registado', time: 'Há 2 horas', color: 'bg-green-500' },
];

export default function SecretaryHome({ isDarkMode, onNavigate }: SecretaryHomeProps) {
  const isMobile = useIsMobile();
  const [marcacoesHoje, setMarcacoesHoje] = useState<string>('...');
  const [utentesAtivos, setUtentesAtivos] = useState<string>('...');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [marcacoes, utentes] = await Promise.all([
          marcacoesApi.contarHoje(),
          utilizadoresApi.contarUtentesAtivos(),
        ]);
        setMarcacoesHoje(marcacoes.toString());
        setUtentesAtivos(utentes.toString());
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setMarcacoesHoje('0');
        setUtentesAtivos('0');
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { icon: Calendar, label: 'Marcações Hoje', value: marcacoesHoje, color: '#a855f7', view: 'appointments' }, // purple-500
    { icon: FileText, label: 'Candidaturas Pendentes', value: '12', color: '#db2777', view: 'candidaturas' }, // pink-600
    { icon: ClipboardList, label: 'Requisições', value: '5', color: '#2563eb', view: 'requisitions' }, // blue-600
    { icon: Users, label: 'Utentes Ativos', value: utentesAtivos, color: '#16a34a', view: 'management' }, // green-600
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
              Bem-vindo ao Portal Florinhas do Vouga
            </h1>
            <p className={`text-base ${textSecondaryClass}`}>
              Gestão completa da instituição
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

      {/* Stats Grid - Flex row for side-by-side */}
      <div className="flex flex-row gap-6 w-full overflow-x-auto pb-2">
        {stats.map((stat, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onNavigate(stat.view)}
            className="cursor-pointer group flex-1 min-w-[200px] p-0 text-left bg-transparent border-0"
            aria-label={`Abrir ${stat.label}`}
          >
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
          </button>
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
              {recentActivity.map((activity, index) => {
                const iconMap: Record<string, React.ReactNode> = {
                  marcacao: <Calendar className="w-5 h-5" />,
                  candidatura: <FileText className="w-5 h-5" />,
                  requisicao: <ClipboardList className="w-5 h-5" />,
                  utente: <Users className="w-5 h-5" />,
                };
                return (
                  <div key={index} className="group p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-md cursor-pointer flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 ${activity.color}`}>
                      {iconMap[activity.type] ?? <Calendar className="w-5 h-5" />}
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
                );
              })}
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
                  <p className={`font-semibold ${textClass} text-lg mb-1`}>Nova Marcação</p>
                  <p className={`text-sm ${textSecondaryClass}`}>Agendar atendimento</p>
                </button>

                <button
                  onClick={() => onNavigate('candidaturas')}
                  className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(131, 24, 67, 0.2)' : '#fdf2f8', // pink-50 (#fdf2f8)
                    borderColor: isDarkMode ? '#9d174d' : '#fce7f3'
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                    style={{ backgroundColor: isDarkMode ? 'rgba(131, 24, 67, 0.5)' : '#ffffff', color: '#db2777' }}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className={`font-semibold ${textClass} text-lg mb-1`}>Candidaturas</p>
                  <p className={`text-sm ${textSecondaryClass}`}>Ver pendentes</p>
                </button>

                <button
                  onClick={() => onNavigate('management')}
                  className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(30, 58, 138, 0.2)' : '#eff6ff', // blue-50 (#eff6ff)
                    borderColor: isDarkMode ? '#1e40af' : '#dbeafe'
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                    style={{ backgroundColor: isDarkMode ? 'rgba(30, 58, 138, 0.5)' : '#ffffff', color: '#2563eb' }}>
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <p className={`font-semibold ${textClass} text-lg mb-1`}>Criar Conta</p>
                  <p className={`text-sm ${textSecondaryClass}`}>Novo utilizador</p>
                </button>

                <button
                  onClick={() => onNavigate('reports')}
                  className={`p-6 rounded-2xl border transition-all duration-200 text-left group`}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(20, 83, 45, 0.2)' : '#f0fdf4', // green-50 (#f0fdf4)
                    borderColor: isDarkMode ? '#166534' : '#dcfce7'
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                    style={{ backgroundColor: isDarkMode ? 'rgba(20, 83, 45, 0.5)' : '#ffffff', color: '#16a34a' }}>
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className={`font-semibold ${textClass} text-lg mb-1`}>Relatórios</p>
                  <p className={`text-sm ${textSecondaryClass}`}>Ver estatísticas</p>
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
