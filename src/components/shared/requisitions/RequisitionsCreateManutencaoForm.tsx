import { useMemo } from 'react';
import { Layout, PenLine, Trash2, MessageSquare } from 'lucide-react';
import { ManutencaoCategoria, ManutencaoItem } from '../../../services/api';
import {
  MANUTENCAO_CATEGORIA_ORDER,
  MANUTENCAO_CATEGORIA_DISPLAY_LABELS,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { Input } from '../../ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '../../ui/checkbox';

interface RequisitionsCreateManutencaoFormProps {
  assunto: string;
  onUpdateAssunto: (value: string) => void;
  manutencaoItems: ManutencaoItem[];
  expandedManutencaoCategorias: Record<string, boolean>;
  onToggleCategoriaExpansion: (categoria: string) => void;
  onToggleItem: (itemId: number, checked: boolean) => void;
  selectedManutencaoItemIds: number[];
  manutencaoObservacoesPorCategoria: Record<string, string>;
  onUpdateObservacaoCategoria: (categoria: string, observacao: string) => void;
  t: any;
  manutencaoError?: string;
  onClearSelection: () => void;
  inputFieldClassName: string;
}

export function RequisitionsCreateManutencaoForm({
  assunto,
  onUpdateAssunto,
  manutencaoItems,
  onToggleItem,
  selectedManutencaoItemIds,
  manutencaoObservacoesPorCategoria,
  onUpdateObservacaoCategoria,
  t,
  manutencaoError,
  onClearSelection,
  inputFieldClassName,
}: Readonly<RequisitionsCreateManutencaoFormProps>) {
  
  // 1. Agrupar TUDO por Categoria -> Item -> Espaço
  const groupedData = useMemo(() => {
    const grouped: Record<string, {
      spaces: string[],
      items: Record<string, Record<string, ManutencaoItem>>
    }> = {};
    
    manutencaoItems.forEach(item => {
      if (!grouped[item.categoria]) {
        grouped[item.categoria] = {
          spaces: [],
          items: {}
        };
      }
      
      if (!grouped[item.categoria].spaces.includes(item.espaco)) {
        grouped[item.categoria].spaces.push(item.espaco);
      }
      
      if (!grouped[item.categoria].items[item.itemVerificacao]) {
        grouped[item.categoria].items[item.itemVerificacao] = {};
      }
      
      grouped[item.categoria].items[item.itemVerificacao][item.espaco] = item;
    });

    // Ordenar espaços de cada categoria
    Object.keys(grouped).forEach(cat => {
      grouped[cat].spaces.sort();
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
      {/* Subject Section */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md group">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 transition-all group-hover:bg-purple-600 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 shadow-sm">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {t('maintenance.labels.subject')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('maintenance.placeholders.subject_hint') || 'Dê um título curto ao que precisa de intervenção'}
            </p>
          </div>
        </div>
        <Input
          value={assunto}
          onChange={(e) => onUpdateAssunto(e.target.value)}
          placeholder={t('maintenance.placeholders.subject')}
          className={`${inputFieldClassName} h-12 bg-white/50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-base font-medium`}
        />
      </div>

      {/* Categories Sections */}
      {sortedCategories.map((category) => {
        const { spaces, items } = groupedData[category];
        const categoryLabel = MANUTENCAO_CATEGORIA_DISPLAY_LABELS[category as ManutencaoCategoria] ?? category;

        return (
          <section key={category} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                <h2 className="text-lg font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">
                  {categoryLabel}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <Layout className="w-3 h-3" />
                {spaces.length} {t('maintenance.labels.spaces') || 'Espaços'}
              </div>
            </div>

            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg transition-all hover:shadow-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 min-w-[200px]">
                        {t('maintenance.labels.item')}
                      </th>
                      {spaces.map(space => (
                        <th key={space} className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 text-center min-w-[100px]">
                          {space}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(items).sort().map((itemName) => (
                      <tr key={itemName} className="group hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors border-b border-gray-50/50 dark:border-gray-800/50 last:border-0">
                        <td className="p-4 text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                          {itemName}
                        </td>
                        {spaces.map(space => {
                          const item = items[itemName][space];
                          if (!item) return (
                            <td key={space} className="p-4 text-center text-gray-200 dark:text-gray-800 font-bold select-none cursor-default">
                              <span className="opacity-20">—</span>
                            </td>
                          );
                          
                          const isSelected = selectedManutencaoItemIds.includes(item.id);
                          
                          return (
                            <td key={space} className="p-4 text-center">
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
