import { useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { ManutencaoCategoria, ManutencaoItem } from '../../../services/api';
import {
  MANUTENCAO_CATEGORIA_ORDER,
  MANUTENCAO_CATEGORIA_DISPLAY_LABELS,
  MANUTENCAO_VERIFICACOES_ORDEM,
} from '../../../pages/requisitions/sharedRequisitions.helpers';

interface RequisitionsCreateManutencaoFormProps {
  manutencaoItems: ManutencaoItem[];
  expandedManutencaoCategorias: Record<ManutencaoCategoria, boolean>;
  onToggleCategoriaExpansion: (categoria: ManutencaoCategoria) => void;
  onToggleItem: (itemId: number, checked: boolean) => void;
  selectedManutencaoItemIds: number[];
  manutencaoObservacoesPorCategoria: Record<ManutencaoCategoria, string>;
  onUpdateObservacaoCategoria: (categoria: ManutencaoCategoria, observacao: string) => void;
  t: (key: string) => string;
  manutencaoError?: string;
  onClearSelection: () => void;
}

export function RequisitionsCreateManutencaoForm({
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
}: Readonly<RequisitionsCreateManutencaoFormProps>) {
  const itemsPorCategoria = useMemo(() => manutencaoItems.reduce(
    (acc, item: ManutencaoItem) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = {};
      }
      if (!acc[item.categoria][item.espaco]) {
        acc[item.categoria][item.espaco] = [];
      }
      acc[item.categoria][item.espaco].push(item);
      return acc;
    },
    {} as Record<string, Record<string, ManutencaoItem[]>>
  ), [manutencaoItems]);

  const categories = useMemo(() => 
    Array.from(new Set(manutencaoItems.map(i => i.categoria))).sort((a: string, b: string) => {
      const idxA = MANUTENCAO_CATEGORIA_ORDER.indexOf(a as ManutencaoCategoria);
      const idxB = MANUTENCAO_CATEGORIA_ORDER.indexOf(b as ManutencaoCategoria);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    }),
    [manutencaoItems]
  );

  const findItem = (categoria: string, espaco: string, verificacao: string): ManutencaoItem | undefined => {
    const items = itemsPorCategoria[categoria]?.[espaco];
    return items?.find((item) => item.itemVerificacao === verificacao);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card/80 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground/85">{t('requisitions.ui.availableItems')}</p>
          <p className="text-xs text-muted-foreground">Selecione os itens de verificação por espaço.</p>
        </div>

        {categories.map((categoria) => {
          const isExpandedCategoria = expandedManutencaoCategorias[categoria as ManutencaoCategoria] ?? false;
          const espacos = Array.from(new Set(manutencaoItems.filter(i => i.categoria === categoria).map(i => i.espaco))).sort();
          const verifficacoes = Array.from(new Set(manutencaoItems.filter(i => i.categoria === categoria).map(i => i.itemVerificacao))).sort((a, b) => {
            const idxA = MANUTENCAO_VERIFICACOES_ORDEM.indexOf(a as any);
            const idxB = MANUTENCAO_VERIFICACOES_ORDEM.indexOf(b as any);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          const displayLabel = MANUTENCAO_CATEGORIA_DISPLAY_LABELS[categoria as ManutencaoCategoria] ?? categoria.replace(/_/g, ' ').toUpperCase();

          return (
            <div key={categoria} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleCategoriaExpansion(categoria as ManutencaoCategoria)}
                className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
                aria-label={`Toggle ${displayLabel} expansion`}
              >
                <span className="font-medium text-foreground">{displayLabel}</span>
                {isExpandedCategoria ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isExpandedCategoria && (
                <div className="p-4 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border border-border bg-muted p-2 text-left font-semibold text-foreground whitespace-nowrap">
                            Espaço
                          </th>
                          {verifficacoes.map((verificacao) => (
                            <th
                              key={verificacao}
                              className="border border-border bg-muted p-2 text-center font-semibold text-foreground whitespace-nowrap text-xs"
                            >
                              {verificacao}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {espacos.map((espaco) => (
                          <tr key={espaco}>
                            <td className="border border-border bg-muted/40 p-2 font-medium text-foreground/85 whitespace-nowrap text-xs">
                              {espaco}
                            </td>
                            {verifficacoes.map((verificacao) => {
                              const item = findItem(categoria, espaco, verificacao);
                              if (!item) return <td key={verificacao} className="border border-border p-2" />;

                              const isChecked = selectedManutencaoItemIds.includes(item.id);
                              return (
                                <td
                                  key={verificacao}
                                  className="border border-border p-2 text-center"
                                >
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(nextChecked) => onToggleItem(item.id, !!nextChecked)}
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

                  <div>
                    <label className="text-sm text-muted-foreground" htmlFor={`obs-${categoria}`}>
                      Observações
                    </label>
                    <input
                      id={`obs-${categoria}`}
                      type="text"
                      value={manutencaoObservacoesPorCategoria[categoria as ManutencaoCategoria] ?? ''}
                      onChange={(e) => onUpdateObservacaoCategoria(categoria as ManutencaoCategoria, e.target.value)}
                      placeholder="Observações da categoria"
                      className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {manutencaoError && (
        <p className="text-status-error text-sm">{manutencaoError}</p>
      )}

      {selectedManutencaoItemIds.length > 0 && (
        <div className="rounded-lg border border-status-info/30 p-3 bg-status-info-soft/40 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <p className="text-sm font-medium text-status-info">
            ✓ {selectedManutencaoItemIds.length} item(ns) selecionado(s)
          </p>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-status-error hover:text-status-error/90 text-sm font-medium transition-colors"
          >
            {t('requisitions.ui.clearSelection')}
          </button>
        </div>
      )}
    </div>
  );
}
