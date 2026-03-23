import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { ManutencaoCategoria, ManutencaoItem } from '../../../services/api';
import {
  MANUTENCAO_CATEGORIA_ORDER,
  MANUTENCAO_CATEGORIA_DISPLAY_LABELS,
  MANUTENCAO_ESPACOS_POR_CATEGORIA,
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
  const itemsPorCategoria = manutencaoItems.reduce(
    (acc, item) => {
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
  );

  const findItem = (categoria: string, espaco: string, verificacao: string): ManutencaoItem | undefined => {
    const items = itemsPorCategoria[categoria]?.[espaco];
    return items?.find((item) => item.itemVerificacao === verificacao);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.availableItems')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Selecione os itens de verificação por espaço.</p>
        </div>

        {MANUTENCAO_CATEGORIA_ORDER.map((categoria) => {
          const isExpandedCategoria = expandedManutencaoCategorias[categoria] ?? false;
          const espacos = MANUTENCAO_ESPACOS_POR_CATEGORIA[categoria];

          return (
            <div key={categoria} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleCategoriaExpansion(categoria)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Toggle ${MANUTENCAO_CATEGORIA_DISPLAY_LABELS[categoria]} expansion`}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{MANUTENCAO_CATEGORIA_DISPLAY_LABELS[categoria]}</span>
                {isExpandedCategoria ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isExpandedCategoria && (
                <div className="p-4 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            Espaço
                          </th>
                          {MANUTENCAO_VERIFICACOES_ORDEM.map((verificacao) => (
                            <th
                              key={verificacao}
                              className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-center font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs"
                            >
                              {verificacao}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {espacos.map((espaco) => (
                          <tr key={espaco}>
                            <td className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs">
                              {espaco}
                            </td>
                            {MANUTENCAO_VERIFICACOES_ORDEM.map((verificacao) => {
                              const item = findItem(categoria, espaco, verificacao);
                              if (!item) return <td key={verificacao} className="border border-gray-300 dark:border-gray-600 p-2" />;

                              const isChecked = selectedManutencaoItemIds.includes(item.id);
                              return (
                                <td
                                  key={verificacao}
                                  className="border border-gray-300 dark:border-gray-600 p-2 text-center"
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
                    <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor={`obs-${categoria}`}>
                      Observações
                    </label>
                    <input
                      id={`obs-${categoria}`}
                      type="text"
                      value={manutencaoObservacoesPorCategoria[categoria] ?? ''}
                      onChange={(e) => onUpdateObservacaoCategoria(categoria, e.target.value)}
                      placeholder="Observações da categoria"
                      className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {manutencaoError && (
        <p className="text-red-500 text-sm">{manutencaoError}</p>
      )}

      {selectedManutencaoItemIds.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-900/20 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ✓ {selectedManutencaoItemIds.length} item(ns) selecionado(s)
          </p>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
          >
            {t('requisitions.ui.clearSelection')}
          </button>
        </div>
      )}
    </div>
  );
}
