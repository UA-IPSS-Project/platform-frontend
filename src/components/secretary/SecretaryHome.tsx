import { useEffect, useState, type ReactNode } from 'react';
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
import { marcacoesApi, utilizadoresApi, requisicoesApi, Notificacao } from '../../services/api';
import { useIsMobile } from '../ui/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface SecretaryHomeProps {
  isDarkMode: boolean;
  onNavigate: (view: string) => void;
  notifications?: Notificacao[];
}

// Fallback activity if no notifications exist
const fallbackActivity = [
  { type: 'marcacao', text: 'Sem atividades recentes', time: '-', color: 'bg-muted' },
];

export default function SecretaryHome({ isDarkMode, onNavigate, notifications = [] }: SecretaryHomeProps) {
  const isMobile = useIsMobile();
  void isDarkMode;
  const [marcacoesHoje, setMarcacoesHoje] = useState<string>('...');
  const [utentesAtivos, setUtentesAtivos] = useState<string>('...');
  const [requisicoesPendentes, setRequisicoesPendentes] = useState<string>('...');

  const statColorClassByStatusType = {
    info: 'bg-status-rose-1',
    primary: 'bg-status-rose-2',
    warning: 'bg-status-rose-3',
    success: 'bg-status-rose-4',
  } as const;

  const quickActionCardClassByStatusType = {
    info: 'border-2 border-status-rose-3 bg-status-rose-1/35',
    primary: 'border-2 border-status-rose-3 bg-status-rose-2/35',
    warning: 'border-2 border-status-rose-4 bg-status-rose-3/35',
    success: 'border-2 border-status-rose-4 bg-status-rose-4/35',
  } as const;

  const quickActionIconColorStyleByStatusType = {
    info: { color: 'var(--status-rose-foreground)' },
    primary: { color: 'var(--status-rose-foreground)' },
    warning: { color: 'var(--status-rose-foreground)' },
    success: { color: 'var(--status-rose-foreground)' },
  } as const;

  type StatusType = keyof typeof statColorClassByStatusType;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [marcacoes, utentes, requisicoes] = await Promise.all([
          marcacoesApi.contarHoje(),
          utilizadoresApi.contarUtentesAtivos(),
          requisicoesApi.listar('ABERTO')
        ]);
        setMarcacoesHoje(marcacoes.toString());
        setUtentesAtivos(utentes.toString());
        setRequisicoesPendentes(requisicoes.length.toString());
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setMarcacoesHoje('0');
        setUtentesAtivos('0');
        setRequisicoesPendentes('0');
      }
    };

    fetchStats();
  }, []);

  const stats: Array<{
    icon: typeof Calendar;
    label: string;
    value: string;
    statusType: StatusType;
    view: string;
  }> = [
    {
      icon: Calendar,
      label: 'Marcações Hoje',
      value: marcacoesHoje,
      statusType: 'info',
      view: 'appointments',
    },
    {
      icon: FileText,
      label: 'Candidaturas Pendentes',
      value: '12',
      statusType: 'primary',
      view: 'candidaturas',
    },
    {
      icon: ClipboardList,
      label: 'Requisições Abertas',
      value: requisicoesPendentes,
      statusType: 'warning',
      view: 'requisitions',
    },
    {
      icon: Users,
      label: 'Utentes Ativos',
      value: utentesAtivos,
      statusType: 'success',
      view: 'management',
    },
  ];

  const textClass = 'text-foreground';
  const textSecondaryClass = 'text-muted-foreground';

  const quickActions: Array<{
    icon: typeof Calendar;
    title: string;
    subtitle: string;
    statusType: StatusType;
    view: string;
  }> = [
    {
      icon: Calendar,
      title: 'Nova Marcação',
      subtitle: 'Agendar atendimento',
      statusType: 'info',
      view: 'appointments',
    },
    {
      icon: FileText,
      title: 'Candidaturas',
      subtitle: 'Ver pendentes',
      statusType: 'primary',
      view: 'candidaturas',
    },
    {
      icon: UserPlus,
      title: 'Criar Conta',
      subtitle: 'Novo utilizador',
      statusType: 'warning',
      view: 'management',
    },
    {
      icon: TrendingUp,
      title: 'Relatórios',
      subtitle: 'Ver estatísticas',
      statusType: 'success',
      view: 'reports',
    },
  ];

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
          <div className={`flex items-center gap-2 bg-muted/40 px-4 py-2 rounded-full border border-border ${isMobile ? 'w-full justify-center' : 'whitespace-nowrap'}`}>
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
                  className={`p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-3 ${statColorClassByStatusType[stat.statusType]}`}
                >
                  <stat.icon className="w-6 h-6 text-status-rose-foreground" />
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className={`text-lg font-bold ${textClass}`}>Atividade Recente</h2>
              <button
                onClick={() => onNavigate('notificacoes')}
                className="text-primary text-sm font-medium hover:opacity-80 flex items-center gap-1 transition-colors"
              >
                Ver tudo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {(notifications.length > 0 
                ? [...notifications].sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()).slice(0, 4) 
                : []).map((notification, index) => {
                const iconMap: Record<string, ReactNode> = {
                  LEMBRETE: <Calendar className="w-5 h-5" />,
                  CANCELAMENTO: <Clock className="w-5 h-5" />,
                  FICHEIRO: <FileText className="w-5 h-5" />,
                  SISTEMA: <TrendingUp className="w-5 h-5" />,
                };

                const colorMap: Record<string, string> = {
                  LEMBRETE: 'bg-[color:var(--status-info)]',
                  CANCELAMENTO: 'bg-destructive',
                  FICHEIRO: 'bg-primary',
                  SISTEMA: 'bg-[color:var(--status-success)]',
                };

                const timeAgo = formatDistanceToNow(new Date(notification.dataCriacao), { 
                  addSuffix: true, 
                  locale: pt 
                });

                return (
                  <div key={notification.id || index} className="group p-4 rounded-xl border border-border bg-muted/30 hover:bg-card transition-all duration-300 hover:shadow-md cursor-pointer flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm flex-shrink-0 ${colorMap[notification.tipo] || 'bg-primary'}`}>
                      {iconMap[notification.tipo] ?? <Calendar className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${textClass} text-sm mb-0.5 truncate group-hover:text-primary transition-colors`}>{notification.titulo}</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3 h-3 ${textSecondaryClass}`} />
                        <p className={`text-xs ${textSecondaryClass} capitalize`}>{timeAgo}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                  </div>
                );
              })}

              {notifications.length === 0 && fallbackActivity.map((activity, index) => (
                <div key={index} className="group p-4 rounded-xl border border-border bg-muted/10 flex items-center gap-4 opacity-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm flex-shrink-0 ${activity.color}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${textClass} text-sm mb-0.5`}>{activity.text}</p>
                    <p className={`text-xs ${textSecondaryClass}`}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <div className="h-full">
          <GlassCard className="p-0 h-full min-h-[400px] flex flex-col">
            <div className="px-6 py-4 border-b border-border">
              <h2 className={`text-lg font-bold ${textClass}`}>Ações Rápidas</h2>
            </div>
            <div className="p-4 flex-1 flex items-center">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full`}>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => onNavigate(action.view)}
                    className={`p-6 rounded-2xl border transition-all duration-200 text-left group ${quickActionCardClassByStatusType[action.statusType]}`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform bg-white"
                      style={quickActionIconColorStyleByStatusType[action.statusType]}
                    >
                      <action.icon className="w-6 h-6" />
                    </div>
                    <p className={`font-semibold ${textClass} text-lg mb-1`}>{action.title}</p>
                    <p className={`text-sm ${textSecondaryClass}`}>{action.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
