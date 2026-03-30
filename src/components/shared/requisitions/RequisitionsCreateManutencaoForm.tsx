import { useMemo } from 'react';
import { Layout, PenLine, Trash2 } from 'lucide-react';
import { ManutencaoCategoria, ManutencaoItem } from '../../../services/api';
import {
  MANUTENCAO_CATEGORIA_ORDER,
  MANUTENCAO_CATEGORIA_DISPLAY_LABELS,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { MaintenanceCategoryCard } from './maintenance/MaintenanceCategoryCard';
import { Input } from '../../ui/input';
import { motion, AnimatePresence } from 'framer-motion';

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
  t: (key: string) => string;
  manutencaoError?: string;
  onClearSelection: () => void;
  inputFieldClassName: string;
}

export function RequisitionsCreateManutencaoForm({
  assunto,
  onUpdateAssunto,
  manutencaoItems,
  expandedManutencaoCategorias,
  onToggleCategoriaExpansion,
  onToggleItem,
  selectedManutencaoItemIds,
  manutencaoObservacoesPorCategoria,
  onUpdateObservacaoCategoria,
  t,
  manutencaoError,
  onClearSelection,
  inputFieldClassName,
}: Readonly<RequisitionsCreateManutencaoFormProps>) {
  
  const itemsByCategoria = useMemo(() => {
    const grouped: Record<string, Record<string, ManutencaoItem[]>> = {};
    manutencaoItems.forEach(item => {
      if (!grouped[item.categoria]) grouped[item.categoria] = {};
      if (!grouped[item.categoria][item.espaco]) grouped[item.categoria][item.espaco] = [];
      grouped[item.categoria][item.espaco].push(item);
    });
    return grouped;
  }, [manutencaoItems]);

  const sortedCategories = useMemo(() => {
    return Object.keys(itemsByCategoria).sort((a, b) => {
      const idxA = MANUTENCAO_CATEGORIA_ORDER.indexOf(a as ManutencaoCategoria);
      const idxB = MANUTENCAO_CATEGORIA_ORDER.indexOf(b as ManutencaoCategoria);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [itemsByCategoria]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Subject Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md group">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white group-hover:rotate-12">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('maintenance.labels.subject')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dê um título curto ao que precisa de intervenção
            </p>
          </div>
        </div>
        <Input
          value={assunto}
          onChange={(e) => onUpdateAssunto(e.target.value)}
          placeholder={t('maintenance.placeholders.subject')}
          className={`${inputFieldClassName} h-12 bg-gray-50/50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 focus:ring-purple-500/20`}
        />
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('maintenance.labels.itemsByCategory')}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {manutencaoItems.length} itens de verificação no catálogo
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sortedCategories.map((cat) => (
            <MaintenanceCategoryCard
              key={cat}
              displayLabel={MANUTENCAO_CATEGORIA_DISPLAY_LABELS[cat as ManutencaoCategoria] ?? cat}
              itemsBySpace={itemsByCategoria[cat]}
              isExpanded={expandedManutencaoCategorias[cat] ?? false}
              onToggleExpansion={() => onToggleCategoriaExpansion(cat)}
              selectedIds={selectedManutencaoItemIds}
              onToggleItem={onToggleItem}
              observacao={manutencaoObservacoesPorCategoria[cat] ?? ''}
              onUpdateObservacao={(obs) => onUpdateObservacaoCategoria(cat, obs)}
              t={t}
            />
          ))}
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
              backgroundColor: manutencaoError ? 'rgba(254, 242, 242, 0.9)' : 'rgba(250, 245, 255, 0.9)',
            }}
          >
            {/* Error Message */}
            {manutencaoError && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-sm font-semibold">{manutencaoError}</span>
              </div>
            )}

            {/* Selection Summary */}
            {selectedManutencaoItemIds.length > 0 && !manutencaoError && (
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-600" />
                <span className="text-sm font-semibold">
                  {selectedManutencaoItemIds.length} item(ns) selecionado(s)
                </span>
              </div>
            )}

            {selectedManutencaoItemIds.length > 0 && (
              <button
                type="button"
                onClick={onClearSelection}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                {t('requisitions.ui.clearSelection')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
