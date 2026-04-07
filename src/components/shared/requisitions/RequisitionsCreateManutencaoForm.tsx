import { useMemo, useState } from 'react';
import { Layout, Trash2, MessageSquare, ChevronDown, ChevronUp, Car } from 'lucide-react';
import { ManutencaoCategoria, ManutencaoItem, TransporteCatalogo } from '../../../services/api';
import {
  MANUTENCAO_CATEGORIA_ORDER,
  MANUTENCAO_CATEGORIA_DISPLAY_LABELS,
  formatVehicleTitle,
} from '../../../pages/requisitions/sharedRequisitions.helpers';
import { motion, AnimatePresence } from 'framer-motion';

interface RequisitionsCreateManutencaoFormProps {
  manutencaoItems: ManutencaoItem[];
  transportes: TransporteCatalogo[];
  onToggleItem: (itemId: number, checked: boolean, transporteId?: number) => void;
  selectedManutencaoItems: Array<{ itemId: number; transporteId?: number }>;
  manutencaoObservacoesPorCategoria: Record<string, string>;
  onUpdateObservacaoCategoria: (categoria: string, observacao: string) => void;
  t: any;
  manutencaoError?: string;
  onClearSelection: () => void;
}

export function RequisitionsCreateManutencaoForm({
  manutencaoItems,
  transportes,
  onToggleItem,
  selectedManutencaoItems,
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

  // Helper to check if item/vehicle pair is selected
  const isSelected = (itemId: number, transporteId?: number) => {
    return selectedManutencaoItems.some(i => i.itemId === itemId && i.transporteId === transporteId);
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
        const isVehicleCategory = category === 'VEICULOS';

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
                  {isVehicleCategory ? <Car className="w-3 h-3" /> : <Layout className="w-3 h-3" />}
                  {isVehicleCategory 
                    ? `${transportes.length} ${t('requisitions.labels.vehicles', { count: transportes.length })}`
                    : `${Object.keys(spaces).length} ${t('maintenance.labels.space', { count: Object.keys(spaces).length })}`
                  }
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
                              {isVehicleCategory ? t('maintenance.labels.vehicle') : t('maintenance.labels.space')}
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
                          {isVehicleCategory ? (
                            // SPECIAL GRID FOR VEHICLES: Rows = Transportes, Columns = Items
                            transportes.map((transporte) => (
                              <tr key={transporte.id} className="group border-b border-border/50 last:border-0">
                                <td className="px-3 py-2.5 text-sm font-medium text-foreground group-hover:text-[color:var(--primary)] transition-colors sticky left-0 bg-card z-10 border-r border-border/30 whitespace-nowrap">
                                  {formatVehicleTitle(transporte)}
                                </td>
                                {items.map(itemName => {
                                  // For vehicles, we use any available space (e.g. 'Geral') but map it to this vehicle
                                  const item = Object.values(spaces)[0]?.[itemName];
                                  if (!item) return (
                                    <td key={itemName} className="border-r border-border/20 last:border-r-0 bg-muted/20 select-none" />
                                  );

                                  const selected = isSelected(item.id, transporte.id);

                                  return (
                                    <td
                                      key={itemName}
                                      onClick={() => onToggleItem(item.id, !selected, transporte.id)}
                                      className="border-r border-border/20 last:border-r-0 cursor-pointer select-none transition-all duration-150"
                                      style={{
                                        backgroundColor: selected
                                          ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                                          : undefined,
                                      }}
                                      title={selected ? `Desselecionar: ${itemName}` : `Selecionar: ${itemName}`}
                                    >
                                      <div className="flex items-center justify-center h-full w-full py-3">
                                        {selected ? (
                                          <div className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--primary)' }}>
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        ) : (
                                          <div className="w-6 h-6 rounded-md border-2 transition-all duration-150 group-hover:border-[color:var(--primary)]/40" style={{ borderColor: 'var(--border)' }} />
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          ) : (
                            // STANDARD TABLE: Rows = Spaces, Columns = Items
                            Object.keys(spaces).sort().map((spaceName) => (
                              <tr
                                key={spaceName}
                                className="group border-b border-border/50 last:border-0"
                              >
                                <td className="px-3 py-2.5 text-sm font-medium text-foreground group-hover:text-[color:var(--primary)] transition-colors sticky left-0 bg-card z-10 border-r border-border/30 whitespace-nowrap">
                                  {spaceName}
                                </td>
                                {items.map(itemName => {
                                  const item = spaces[spaceName][itemName];
                                  if (!item) return (
                                    <td key={itemName} className="border-r border-border/20 last:border-r-0 bg-muted/20 select-none" />
                                  );

                                  const selected = isSelected(item.id);

                                  return (
                                    <td
                                      key={itemName}
                                      onClick={() => onToggleItem(item.id, !selected)}
                                      className="border-r border-border/20 last:border-r-0 cursor-pointer select-none transition-all duration-150"
                                      style={{
                                        backgroundColor: selected
                                          ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                                          : undefined,
                                      }}
                                      title={selected ? `Desselecionar: ${itemName}` : `Selecionar: ${itemName}`}
                                    >
                                      <div className="flex items-center justify-center h-full w-full py-3">
                                        {selected ? (
                                          <div
                                            className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm"
                                            style={{
                                              backgroundColor: 'var(--primary)',
                                            }}
                                          >
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        ) : (
                                          <div
                                            className="w-6 h-6 rounded-md border-2 transition-all duration-150 group-hover:border-[color:var(--primary)]/40"
                                            style={{ borderColor: 'var(--border)' }}
                                          />
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
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

      {/* Error message */}
      {manutencaoError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
          style={{
            color: 'var(--status-error)',
            borderColor: 'color-mix(in srgb, var(--status-error) 30%, transparent)',
            backgroundColor: 'var(--status-error-soft)',
          }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--status-error)' }} />
          {manutencaoError}
        </div>
      )}

      {/* Selection Summary Panel */}
      <AnimatePresence>
        {selectedManutencaoItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--status-info-soft) 50%, var(--card))',
            }}
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  {t('maintenance.labels.selectedItems', { count: selectedManutencaoItems.length })}
                </span>
              </div>
              <button
                type="button"
                onClick={onClearSelection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-105 active:scale-95"
                style={{
                  color: 'var(--status-error)',
                  borderColor: 'color-mix(in srgb, var(--status-error) 30%, transparent)',
                  backgroundColor: 'var(--status-error-soft)',
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('maintenance.labels.clearSelection')}
              </button>
            </div>

            {/* Items grouped by category */}
            <div className="p-4 space-y-4">
              {sortedCategories.map(category => {
                const isVehicleCategory = category === 'VEICULOS';
                const categoryLabel = MANUTENCAO_CATEGORIA_DISPLAY_LABELS[category as ManutencaoCategoria] ?? category;

                // Collect all selected items for this category
                const selectedInCategory: Array<{ item: ManutencaoItem; subLabel: string; transporteId?: number }> = [];
                
                selectedManutencaoItems.forEach(selection => {
                  const item = manutencaoItems.find(i => i.id === selection.itemId);
                  if (item?.categoria === category) {
                    let subLabel = item.espaco;
                    if (isVehicleCategory && selection.transporteId) {
                      const tpt = transportes.find(t => t.id === selection.transporteId);
                      subLabel = tpt?.matricula || t('maintenance.labels.vehicle');
                    }
                    selectedInCategory.push({ item, subLabel, transporteId: selection.transporteId });
                  }
                });

                if (selectedInCategory.length === 0) return null;

                return (
                  <div key={category}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      {categoryLabel} · {selectedInCategory.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInCategory.map(({ item, subLabel, transporteId }) => (
                        <div
                          key={`${item.id}-${transporteId || 'no-tpt'}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium"
                          style={{
                            borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
                            backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                            color: 'var(--foreground)',
                          }}
                        >
                          <span className="text-muted-foreground">{subLabel}</span>
                          <span className="text-muted-foreground">·</span>
                          <span style={{ color: 'var(--primary)' }}>{item.itemVerificacao}</span>
                          <button
                            type="button"
                            onClick={() => onToggleItem(item.id, false, transporteId)}
                            className="ml-1 rounded-full w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                            title={`Remover ${item.itemVerificacao}`}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
