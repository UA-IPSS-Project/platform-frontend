import { useMemo, useState } from 'react';
import { Layout, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { ManutencaoCategoria, ManutencaoItem } from '../../../services/api';
import {
  MANUTENCAO_CATEGORIA_ORDER,
  MANUTENCAO_CATEGORIA_DISPLAY_LABELS,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '../../ui/checkbox';

interface RequisitionsCreateManutencaoFormProps {
  manutencaoItems: ManutencaoItem[];
  onToggleItem: (itemId: number, checked: boolean) => void;
  selectedManutencaoItemIds: number[];
  manutencaoObservacoesPorCategoria: Record<string, string>;
  onUpdateObservacaoCategoria: (categoria: string, observacao: string) => void;
  t: any;
  manutencaoError?: string;
  onClearSelection: () => void;
}

export function RequisitionsCreateManutencaoForm({
  manutencaoItems,
  onToggleItem,
  selectedManutencaoItemIds,
  manutencaoObservacoesPorCategoria,
  onUpdateObservacaoCategoria,
  t,
  manutencaoError,
  onClearSelection,
}: Readonly<RequisitionsCreateManutencaoFormProps>) {
  
  // Estado local para colapsar categorias - agora abertas por default
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MANUTENCAO_CATEGORIA_ORDER.forEach(cat => {
      initial[cat] = true;
    });
    return initial;
  });

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // 1. Agrupar TUDO por Categoria -> Espaço -> Item (para as Linhas serem Espaços)
  const groupedData = useMemo(() => {
    const grouped: Record<string, {
      items: string[], // Nomes de itens únicos (Colunas)
      spaces: Record<string, Record<string, ManutencaoItem>> // Espaços (Linhas)
    }> = {};
    
    manutencaoItems.forEach(item => {
      if (!grouped[item.categoria]) {
        grouped[item.categoria] = {
          items: [],
          spaces: {}
        };
      }
      
      if (!grouped[item.categoria].items.includes(item.itemVerificacao)) {
        grouped[item.categoria].items.push(item.itemVerificacao);
      }
      
      if (!grouped[item.categoria].spaces[item.espaco]) {
        grouped[item.categoria].spaces[item.espaco] = {};
      }
      
      grouped[item.categoria].spaces[item.espaco][item.itemVerificacao] = item;
    });

    // Ordenar itens (colunas) de cada categoria
    Object.keys(grouped).forEach(cat => {
      grouped[cat].items.sort();
    });

    return grouped;
  }, [manutencaoItems]);

  const sortedCategories = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => {
      const idxA = MANUTENCAO_CATEGORIA_ORDER.indexOf(a as ManutencaoCategoria);
      const idxB = MANUTENCAO_CATEGORIA_ORDER.indexOf(b as ManutencaoCategoria);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [groupedData]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Categories Sections */}
      {sortedCategories.map((category) => {
        const { items, spaces } = groupedData[category];
        const categoryLabel = MANUTENCAO_CATEGORIA_DISPLAY_LABELS[category as ManutencaoCategoria] ?? category;
        const isCollapsed = collapsedCategories[category];

        return (
          <section key={category} className="space-y-4">
            <button 
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full px-2 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-6 bg-purple-500 rounded-full transition-all duration-300 ${isCollapsed ? 'scale-y-50 opacity-50' : ''}`} />
                <h2 className="text-lg font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 group-hover:text-purple-600 transition-colors">
                  {categoryLabel}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <div className="flex items-center gap-2">
                  <Layout className="w-3 h-3" />
                  {Object.keys(spaces).length} {t('maintenance.labels.space')}
                </div>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </button>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg transition-all hover:shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md">
                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 min-w-[150px] sticky left-0 bg-gray-50/90 dark:bg-gray-800/90 z-10 backdrop-blur-md">
                              {t('maintenance.labels.space')}
                            </th>
                            {items.map(itemName => (
                              <th key={itemName} className="p-4 text-[9px] font-black uppercase tracking-normal text-gray-400 border-b border-gray-100 dark:border-gray-800 text-center min-w-[100px] leading-tight max-w-[120px] whitespace-normal">
                                {itemName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(spaces).sort().map((spaceName) => (
                            <tr key={spaceName} className="group hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors border-b border-gray-50/50 dark:border-gray-800/50 last:border-0">
                              <td className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors sticky left-0 bg-white/60 dark:bg-gray-900/60 z-10 backdrop-blur-sm">
                                {spaceName}
                              </td>
                              {items.map(itemName => {
                                const item = spaces[spaceName][itemName];
                                if (!item) return (
                                  <td key={itemName} className="p-4 text-center text-gray-200 dark:text-gray-800 font-bold select-none cursor-default">
                                    <span className="opacity-10">/</span>
                                  </td>
                                );
                                
                                const isSelected = selectedManutencaoItemIds.includes(item.id);
                                
                                return (
                                  <td key={itemName} className="p-4 text-center">
                                    <div className="flex justify-center items-center">
                                      <Checkbox
                                        id={`item-${item.id}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => onToggleItem(item.id, checked as boolean)}
                                        className={`w-5 h-5 rounded-md transition-all duration-300 border-2 ${
                                          isSelected 
                                            ? 'bg-purple-600 border-purple-600 scale-110 shadow-lg shadow-purple-500/20' 
                                            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                                        }`}
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Observation Section PER Category */}
                    <div className="p-4 bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {t('maintenance.labels.observations')}
                        </span>
                      </div>
                      <textarea
                        value={manutencaoObservacoesPorCategoria[category] ?? ''}
                        onChange={(e) => onUpdateObservacaoCategoria(category, e.target.value)}
                        placeholder={t('maintenance.placeholders.observations')}
                        className="w-full bg-white/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all resize-none h-20 placeholder:italic"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}

      {/* Floating Footer / Error / Selection Bar */}
      <AnimatePresence>
        {(manutencaoError || selectedManutencaoItemIds.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 min-w-[320px] max-w-[90vw]"
            style={{
              borderColor: manutencaoError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(147, 51, 234, 0.4)',
              backgroundColor: manutencaoError ? 'rgba(254, 242, 242, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            }}
          >
            <div className="flex items-center gap-6">
              {/* Error Message */}
              {manutencaoError && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-sm font-bold tracking-tight">{manutencaoError}</span>
                </div>
              )}

              {/* Selection Summary */}
              {selectedManutencaoItemIds.length > 0 && !manutencaoError && (
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-sm" />
                  <span className="text-sm font-bold tracking-tight">
                    {t('maintenance.labels.selectedItems', { count: selectedManutencaoItemIds.length })}
                  </span>
                </div>
              )}
            </div>

            {selectedManutencaoItemIds.length > 0 && (
              <button
                type="button"
                onClick={onClearSelection}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-sm border border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                {t('maintenance.labels.clearSelection')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
