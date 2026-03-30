import { useMemo, Fragment } from 'react';
import { Layout, PenLine, Trash2, MessageSquare, CheckCircle2 } from 'lucide-react';
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
  t: any; // Use any to allow i18next interpolation
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
  
  // 1. Identificar espaços únicos (colunas)
  const uniqueSpaces = useMemo(() => {
    return Array.from(new Set(manutencaoItems.map(item => item.espaco))).sort();
  }, [manutencaoItems]);

  // 2. Agrupar itens por Categoria e Nome de Item (linhas)
  // Cada linha representa um "tipo de item" (ex: Lâmpadas) que pode existir em vários espaços.
  const groupedData = useMemo(() => {
    const grouped: Record<string, Record<string, Record<string, ManutencaoItem>>> = {};
    
    manutencaoItems.forEach(item => {
      if (!grouped[item.categoria]) grouped[item.categoria] = {};
      if (!grouped[item.categoria][item.itemVerificacao]) grouped[item.categoria][item.itemVerificacao] = {};
      grouped[item.categoria][item.itemVerificacao][item.espaco] = item;
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          className={`${inputFieldClassName} h-12 bg-white/50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-base`}
        />
      </div>

      {/* Main Table Section */}
      <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-20">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 min-w-[200px] bg-gray-50/90 dark:bg-gray-800/90">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-purple-500" />
                  {t('maintenance.labels.item')}
                </div>
                </th>
                {uniqueSpaces.map(space => (
                  <th key={space} className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center min-w-[120px]">
                    {space}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map(category => (
                <Fragment key={category}>
                  {/* Category Header Row */}
                  <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                    <td colSpan={uniqueSpaces.length + 1} className="p-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                          {MANUTENCAO_CATEGORIA_DISPLAY_LABELS[category as ManutencaoCategoria] ?? category}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 border border-purple-100 dark:border-purple-900/30">
                            <MessageSquare className="w-3 h-3 text-purple-400" />
                            <input
                              type="text"
                              value={manutencaoObservacoesPorCategoria[category] ?? ''}
                              onChange={(e) => onUpdateObservacaoCategoria(category, e.target.value)}
                              placeholder={t('maintenance.placeholders.observations')}
                              className="bg-transparent border-none outline-none text-[10px] text-gray-600 dark:text-gray-400 w-48 placeholder:italic"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Item Rows */}
                  {Object.keys(groupedData[category]).sort().map(itemName => (
                    <tr key={itemName} className="group hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors border-b border-gray-50 dark:border-gray-800">
                      <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {itemName}
                      </td>
                      {uniqueSpaces.map(space => {
                        const item = groupedData[category][itemName][space];
                        if (!item) return <td key={space} className="p-4 text-center text-gray-200 dark:text-gray-800 font-bold">•</td>;
                        
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
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats/Summary hint */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span>Selecione os itens necessários em cada espaço para criar a requisição.</span>
          </div>
      </div>

      {/* Floating Footer / Error / Selection Bar */}
      <AnimatePresence>
        {(manutencaoError || selectedManutencaoItemIds.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4 z-50 p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden"
            style={{
              borderColor: manutencaoError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(147, 51, 234, 0.4)',
              backgroundColor: manutencaoError ? 'rgba(254, 242, 242, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Error Message */}
            {manutencaoError && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-sm font-bold">{manutencaoError}</span>
              </div>
            )}

            {/* Selection Summary */}
            {selectedManutencaoItemIds.length > 0 && !manutencaoError && (
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-600" />
                <span className="text-sm font-bold">
                  {t('maintenance.labels.selectedItems', { count: selectedManutencaoItemIds.length })}
                </span>
              </div>
            )}

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
