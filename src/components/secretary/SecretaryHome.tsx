import React from 'react';
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

interface SecretaryHomeProps {
  isDarkMode: boolean;
  onNavigate: (view: string) => void;
}

const stats = [
  { icon: Calendar, label: 'Marcações Hoje', value: '8', color: 'bg-purple-500', view: 'appointments' },
  { icon: FileText, label: 'Candidaturas Pendentes', value: '12', color: 'bg-pink-500', view: 'candidaturas' },
  { icon: ClipboardList, label: 'Requisições', value: '5', color: 'bg-blue-500', view: 'requisitions' },
  { icon: Users, label: 'Utentes Ativos', value: '156', color: 'bg-green-500', view: 'management' },
];

const recentActivity = [
  { type: 'marcacao', text: 'Nova marcação - Maria Silva', time: 'Há 5 min' },
  { type: 'candidatura', text: 'Candidatura Creche recebida', time: 'Há 15 min' },
  { type: 'requisicao', text: 'Requisição aprovada - Escola', time: 'Há 1 hora' },
  { type: 'utente', text: 'Novo utente registado', time: 'Há 2 horas' },
];

export default function SecretaryHome({ isDarkMode, onNavigate }: SecretaryHomeProps) {
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBgClass = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-purple-50';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>
              Bem-vindo ao Portal Florinhas do Vouga
            </h1>
            <p className={`${textSecondaryClass} mt-1`}>
              Gestão completa da instituição
            </p>
          </div>
          <div className={`flex items-center gap-2 text-sm ${textSecondaryClass}`}>
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-PT', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} onClick={() => onNavigate(stat.view)} className="cursor-pointer">
            <GlassCard className="p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-sm ${textSecondaryClass} mb-2`}>{stat.label}</p>
                  <p className={`text-3xl font-bold ${textClass}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} flex-shrink-0`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${textClass}`}>Atividade Recente</h2>
            <button 
              onClick={() => onNavigate('notificacoes')}
              className="text-purple-600 dark:text-purple-400 text-sm hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
            >
              Ver tudo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-xl ${hoverBgClass} transition-colors`}>
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{activity.text}</p>
                  <p className={`text-xs ${textSecondaryClass} mt-1`}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="p-6">
          <h2 className={`text-lg font-semibold ${textClass} mb-4`}>Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate('appointments')}
              className={`w-full p-4 rounded-xl ${isDarkMode ? 'bg-purple-900/30 hover:bg-purple-900/50' : 'bg-purple-50 hover:bg-purple-100'} transition-colors text-left`}
            >
              <Calendar className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`} />
              <p className={`font-medium ${textClass}`}>Nova Marcação</p>
              <p className={`text-xs ${textSecondaryClass}`}>Agendar atendimento</p>
            </button>
            <button 
              onClick={() => onNavigate('candidaturas')}
              className={`w-full p-4 rounded-xl ${isDarkMode ? 'bg-pink-900/30 hover:bg-pink-900/50' : 'bg-pink-50 hover:bg-pink-100'} transition-colors text-left`}
            >
              <FileText className={`w-6 h-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'} mb-2`} />
              <p className={`font-medium ${textClass}`}>Candidaturas</p>
              <p className={`text-xs ${textSecondaryClass}`}>Ver pendentes</p>
            </button>
            <button 
              onClick={() => onNavigate('management')}
              className={`w-full p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/30 hover:bg-blue-900/50' : 'bg-blue-50 hover:bg-blue-100'} transition-colors text-left`}
            >
              <UserPlus className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`} />
              <p className={`font-medium ${textClass}`}>Criar Conta</p>
              <p className={`text-xs ${textSecondaryClass}`}>Novo utilizador</p>
            </button>
            <button 
              onClick={() => onNavigate('reports')}
              className={`w-full p-4 rounded-xl ${isDarkMode ? 'bg-green-900/30 hover:bg-green-900/50' : 'bg-green-50 hover:bg-green-100'} transition-colors text-left`}
            >
              <TrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'} mb-2`} />
              <p className={`font-medium ${textClass}`}>Relatórios</p>
              <p className={`text-xs ${textSecondaryClass}`}>Ver estatísticas</p>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
