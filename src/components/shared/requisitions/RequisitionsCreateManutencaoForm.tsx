import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { ManutencaoItem } from '../../../services/api';

interface RequisitionsCreateManutencaoFormProps {
  manutencaoItems: ManutencaoItem[];
  expandedManutencaoItems: Record<string, boolean>;
  expandedManutencaoCategorias: Record<string, boolean>;
  onToggleCategoriaExpansion: (categoria: string) => void;
  onToggleItemVisibility: (itemId: string) => void;
  onToggleItem: (itemId: number, checked: boolean) => void;
  selectedManutencaoItemIds: number[];
  manutencaoItemObservacoes: Record<number, string>;
  onUpdateObservacao: (itemId: number, observacao: string) => void;
  t: (key: string) => string;
}

export function RequisitionsCreateManutencaoForm({
  manutencaoItems,
  expandedManutencaoItems,
  expandedManutencaoCategorias,
  onToggleCategoriaExpansion,
  onToggleItemVisibility,
  onToggleItem,
  selectedManutencaoItemIds,
  manutencaoItemObservacoes,
  onUpdateObservacao,
  t,
}: Readonly<RequisitionsCreateManutencaoFormProps>) {
  // Group items by category and then by espaco (space/room)
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

  // Get unique verification items per categoria
  const getVerificacaoItemsForCategoria = (categoria: string): string[] => {
    const items = itemsPorCategoria[categoria];
    if (!items) return [];
    const itemSet = new Set<string>();
    Object.values(items).forEach((espacoItems) => {
      espacoItems.forEach((item) => itemSet.add(item.itemVerificacao));
    });
    return Array.from(itemSet).sort();
  };

  // Find item by category, espaco, and verificacao
  const findItem = (categoria: string, espaco: string, verificacao: string): ManutencaoItem | undefined => {
    const items = itemsPorCategoria[categoria]?.[espaco];
    return items?.find((item) => item.itemVerificacao === verificacao);
  };

  const categoriaOrder = ['CATL', 'RC', 'PRE_ESCOLAR', 'CRECHE'];
  const categoriaNomes: Record<string, string> = {
    CATL: 'CATL',
    RC: 'R/C',
    PRE_ESCOLAR: 'Pré-Escolar',
    CRECHE: 'Creche',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.availableItems')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Selecione os itens de verificação para cada espaço</p>
        </div>

        {categoriaOrder.map((categoria) => {
          const espacoData = itemsPorCategoria[categoria];
          if (!espacoData) return null;

          const isExpandedCategoria = expandedManutencaoCategorias[categoria] ?? false;
          const espacoNomes = Object.keys(espacoData).sort();
          const verificacaoItems = getVerificacaoItemsForCategoria(categoria);

          return (
            <div key={categoria} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleCategoriaExpansion(categoria)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Toggle ${categoriaNomes[categoria]} expansion`}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{categoriaNomes[categoria]}</span>
                {isExpandedCategoria ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isExpandedCategoria && (
                <div className="p-4 space-y-4">
                  {/* Table for all spaces in this category */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            Espaço
                          </th>
                          {verificacaoItems.map((verificacao) => (
                            <th
                              key={verificacao}
                              className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-center font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs"
                            >
                              {verificacao}
                            </th>
                          ))}
                          <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-left font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {espacoNomes.map((espaco) => (
                          <tr key={espaco}>
                            <td className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs">
                              {espaco}
                            </td>
                            {verificacaoItems.map((verificacao) => {
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
                            <td className="border border-gray-300 dark:border-gray-600 p-2">
                              <input
                                type="text"
                                value={manutencaoItemObservacoes[`${categoria}-${espaco}`] || ''}
                                onChange={(e) =>
                                  onUpdateObservacao(parseInt(`${categoria}-${espaco}`) || 0, e.target.value)
                                }
                                placeholder="Notas..."
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedManutencaoItemIds.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-900/20 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ✓ {selectedManutencaoItemIds.length} item(ns) selecionado(s)
          </p>
        </div>
      )}
    </div>
  );
}
