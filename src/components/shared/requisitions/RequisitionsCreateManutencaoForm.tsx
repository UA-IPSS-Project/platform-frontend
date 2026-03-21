import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
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

  const categoriaOrder = ['CATL', 'RC', 'PRE_ESCOLAR', 'CRECHE'];
  const categoriaNomes: Record<string, string> = {
    CATL: 'CATL',
    RC: 'R/C',
    PRE_ESCOLAR: 'Pré-Escolar',
    CRECHE: 'Creche',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.availableItems')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.selectItemsHint')}</p>
        </div>

        <div className="space-y-2">
          {categoriaOrder.map((categoria) => {
            const espacoData = itemsPorCategoria[categoria];
            if (!espacoData) return null;

            const isExpandedCategoria = expandedManutencaoCategorias[categoria] ?? false;
            const espacoNomes = Object.keys(espacoData).sort();

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
                  <div className="space-y-2 p-4">
                    {espacoNomes.map((espaco) => {
                      const items = espacoData[espaco];
                      const espacoKey = `${categoria}-${espaco}`;
                      const isExpandedEspaco = expandedManutencaoItems[espacoKey] ?? false;

                      return (
                        <div key={espacoKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => onToggleItemVisibility(espacoKey)}
                            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label={`Toggle ${espaco} expansion`}
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{espaco}</span>
                            {isExpandedEspaco ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>

                          {isExpandedEspaco && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 space-y-2">
                              {items.map((item) => {
                                const isChecked = selectedManutencaoItemIds.includes(item.id);
                                return (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(nextChecked) => onToggleItem(item.id, !!nextChecked)}
                                    />
                                    <span>{item.itemVerificacao}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedManutencaoItemIds.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-blue-50 dark:bg-blue-900/20 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('requisitions.ui.selectedItems', { count: selectedManutencaoItemIds.length })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('requisitions.ui.itemsSelected')}
          </p>
        </div>
      )}
    </div>
  );
}
