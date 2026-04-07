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

  // Estado local para colapsar categorias - fechadas por default
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

  // Agrupar por Categoria -> Espaço -> Item (Linhas = Espaços, Colunas = Itens)
  const groupedData = useMemo(() => {
    const grouped: Record<string, {
      items: string[];
      spaces: Record<string, Record<string, ManutencaoItem>>;
    }> = {};

    manutencaoItems.forEach(item => {
      if (!grouped[item.categoria]) {
        grouped[item.categoria] = { items: [], spaces: {} };
      }
      if (!grouped[item.categoria].items.includes(item.itemVerificacao)) {
        grouped[item.categoria].items.push(item.itemVerificacao);
      }
      if (!grouped[item.categoria].spaces[item.espaco]) {
        grouped[item.categoria].spaces[item.espaco] = {};
      }
      grouped[item.categoria].spaces[item.espaco][item.itemVerificacao] = item;
    });

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Categories Sections */}
      {sortedCategories.map((category) => {
        const { items, spaces } = groupedData[category];
        const categoryLabel = MANUTENCAO_CATEGORIA_DISPLAY_LABELS[category as ManutencaoCategoria] ?? category;
        const isCollapsed = collapsedCategories[category];

        return (
          <section key={category} className="space-y-3">
            {/* Category Header / Toggle Button */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full px-4 py-2.5 group hover:bg-[color:var(--status-info-soft)] rounded-xl transition-all duration-200 border border-transparent hover:border-[color:var(--primary)]/20"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-1 h-5 rounded-full transition-all duration-300 ${isCollapsed ? 'opacity-40 scale-y-75' : 'opacity-100'}`}
                  style={{ backgroundColor: 'var(--primary)' }}
                />
                <h2 className="text-base font-bold uppercase tracking-widest text-foreground group-hover:text-[color:var(--primary)] transition-colors">
                  {categoryLabel}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Layout className="w-3 h-3" />
                  {Object.keys(spaces).length} {t('maintenance.labels.space')}
                </div>
                {isCollapsed
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                }
              </div>
            </button>

            {/* Collapsible Table */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/60">
                            <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border min-w-[150px] sticky left-0 bg-muted/80 z-10">
                              {t('maintenance.labels.space')}
                            </th>
                            {items.map(itemName => (
                              <th
                                key={itemName}
                                className="p-3 text-[9px] font-bold uppercase tracking-normal text-muted-foreground border-b border-border text-center min-w-[100px] leading-tight max-w-[120px] whitespace-normal"
                              >
                                {itemName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(spaces).sort().map((spaceName) => (
                            <tr
                              key={spaceName}
                              className="group border-b border-border/50 last:border-0 transition-colors hover:bg-[color:var(--status-info-soft)]/40"
                            >
                              <td className="p-3 text-sm font-medium text-foreground group-hover:text-[color:var(--primary)] transition-colors sticky left-0 bg-card z-10 border-r border-border/30">
                                {spaceName}
                              </td>
                              {items.map(itemName => {
                                const item = spaces[spaceName][itemName];
                                if (!item) return (
                                  <td key={itemName} className="p-3 text-center text-muted-foreground/20 select-none cursor-default">
                                    <span>—</span>
                                  </td>
                                );

                                const isSelected = selectedManutencaoItemIds.includes(item.id);

                                return (
                                  <td key={itemName} className="p-3 text-center">
                                    <div className="flex justify-center items-center">
                                      <Checkbox
                                        id={`item-${item.id}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => onToggleItem(item.id, checked as boolean)}
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
                    <div className="p-4 bg-muted/20 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-3 h-3" style={{ color: 'var(--primary)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {t('maintenance.labels.observations')}
                        </span>
                      </div>
                      <textarea
                        value={manutencaoObservacoesPorCategoria[category] ?? ''}
                        onChange={(e) => onUpdateObservacaoCategoria(category, e.target.value)}
                        placeholder={t('maintenance.placeholders.observations')}
                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground outline-none focus:ring-2 focus:border-[color:var(--primary)]/40 transition-all resize-none h-20 placeholder:text-muted-foreground placeholder:italic"
                        style={{ '--tw-ring-color': 'color-mix(in srgb, var(--primary) 15%, transparent)' } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}

      {/* Floating Footer — Error / Selection Bar */}
      <AnimatePresence>
        {(manutencaoError || selectedManutencaoItemIds.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 min-w-[320px] max-w-[90vw]"
            style={{
              borderColor: manutencaoError
                ? 'color-mix(in srgb, var(--status-error) 40%, transparent)'
                : 'color-mix(in srgb, var(--primary) 30%, transparent)',
              backgroundColor: manutencaoError
                ? 'color-mix(in srgb, var(--status-error-soft) 98%, transparent)'
                : 'color-mix(in srgb, var(--card) 98%, transparent)',
            }}
          >
            <div className="flex items-center gap-6">
              {/* Error Message */}
              {manutencaoError && (
                <div className="flex items-center gap-2" style={{ color: 'var(--status-error)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--status-error)' }} />
                  <span className="text-sm font-bold tracking-tight">{manutencaoError}</span>
                </div>
              )}

              {/* Selection Summary */}
              {selectedManutencaoItemIds.length > 0 && !manutencaoError && (
                <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: 'var(--primary)' }} />
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border"
                style={{
                  color: 'var(--status-error)',
                  borderColor: 'color-mix(in srgb, var(--status-error) 30%, transparent)',
                  backgroundColor: 'var(--status-error-soft)',
                }}
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
