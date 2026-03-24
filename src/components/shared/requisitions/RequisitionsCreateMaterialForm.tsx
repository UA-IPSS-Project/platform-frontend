import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { MaterialItemGroup } from '../../../pages/requisitions/sharedRequisitions.helpers';

interface RequisitionsCreateMaterialFormProps {
  materialLinhas: Array<{ rowId: string; materialId: string; quantidade: string }>;
  expandedMaterialItems: Record<string, boolean>;
  expandedMaterialCategorias: Partial<Record<string, boolean>>;
  materiaisPorCategoria: Array<{
    categoria: string;
    label: string;
    itens: MaterialItemGroup[];
  }>;
  materiaisAdicionados: Array<{
    rowId: string;
    descricao: string;
    quantidade: number;
  }>;
  materiaisAdicionadosTotal: number;
  onToggleCategoriaExpansion: (categoria: string) => void;
  onToggleItemVisibility: (itemKey: string) => void;
  onToggleItem: (item: MaterialItemGroup, checked: boolean) => void;
  onToggleVariante: (varianteId: number, checked: boolean) => void;
  onUpdateVarianteQuantidade: (varianteId: number, quantidade: string) => void;
  onRemoveMaterialLinha: (rowId: string) => void;
  quantityFieldClassName: string;
  materiaisAdicionadosAgrupados?: Array<{
    categoria: string;
    label: string;
    itens: Array<{
      rowId: string;
      materialId: number;
      descricao: string;
      quantidade: string;
    }>;
  }>;
  materiaisError?: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export function RequisitionsCreateMaterialForm({
  materialLinhas,
  expandedMaterialItems,
  expandedMaterialCategorias,
  materiaisPorCategoria,
  materiaisAdicionadosTotal,
  onToggleCategoriaExpansion,
  onToggleItemVisibility,
  onToggleItem,
  onToggleVariante,
  onUpdateVarianteQuantidade,
  onRemoveMaterialLinha,
  quantityFieldClassName,
  materiaisAdicionadosAgrupados = [],
  materiaisError,
  t,
}: Readonly<RequisitionsCreateMaterialFormProps>) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.availableMaterials')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.selectMaterialsHint')}</p>
        </div>

        {materiaisPorCategoria.map((categoria) => {
          const isCategoriaExpanded = expandedMaterialCategorias[categoria.categoria] === true;
          const itemsCategoria = categoria.itens;

          return (
            <div key={categoria.categoria} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleCategoriaExpansion(categoria.categoria)}
                className="w-full px-3 py-2 flex items-center justify-between text-left"
              >
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {t(categoria.label)}
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({itemsCategoria.length})</span>
                </p>
                {isCategoriaExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isCategoriaExpanded && (itemsCategoria.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  {t('requisitions.ui.noItemsInCategory')}
                </p>
              ) : (
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  {itemsCategoria.map((item) => {
                    const hasPendingSelection = expandedMaterialItems[item.itemKey] === true;
                    const selectedCount = item.variantes.filter((variante) =>
                      materialLinhas.some((linha) => linha.materialId === String(variante.id)),
                    ).length;
                    const itemChecked = selectedCount > 0 || hasPendingSelection;
                    const isExpanded = itemChecked && expandedMaterialItems[item.itemKey] !== false;
                    const safeItemKey = encodeURIComponent(item.itemKey);

                    return (
                      <div key={item.itemKey} className="space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-1 py-1 -mx-1">
                            <Checkbox
                              id={`item-toggle-${safeItemKey}`}
                              checked={itemChecked}
                              onCheckedChange={(checked) => onToggleItem(item, !!checked)}
                            />
                            <label
                              htmlFor={`item-toggle-${safeItemKey}`}
                              className="truncate text-sm text-gray-700 dark:text-gray-200 cursor-pointer select-none"
                              title={item.nome}
                            >
                              {item.nome}
                            </label>
                          </div>

                          {itemChecked && (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => onToggleItemVisibility(item.itemKey)}
                            >
                              {isExpanded ? t('requisitions.ui.hideAttributes') : t('requisitions.ui.showAttributes')}
                            </Button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="pl-6 space-y-2 rounded-md border border-gray-200/70 dark:border-gray-700/70 bg-gray-50/70 dark:bg-gray-800/40 p-2">
                            {item.variantes.map((variante) => {
                              const checked = materialLinhas.some((linha) => linha.materialId === String(variante.id));
                              const linhaSelecionada = materialLinhas.find((linha) => linha.materialId === String(variante.id));
                              const atributoLabel = variante.atributo && variante.valorAtributo
                                ? `${variante.atributo}: ${variante.valorAtributo}`
                                : `Variante #${variante.id}`;

                              return (
                                <div key={variante.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-2 items-center">
                                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(nextChecked) => onToggleVariante(variante.id, !!nextChecked)}
                                    />
                                    <span>{atributoLabel}</span>
                                  </label>

                                  {checked && (
                                    <div>
                                      <label htmlFor={`qtd-variante-${variante.id}`} className="text-xs text-gray-500 dark:text-gray-400">{t('requisitions.ui.quantityShort')}</label>
                                      <Input
                                        id={`qtd-variante-${variante.id}`}
                                        type="number"
                                        min="1"
                                        className={quantityFieldClassName}
                                        value={linhaSelecionada?.quantidade ?? '1'}
                                        onChange={(event) => onUpdateVarianteQuantidade(variante.id, event.target.value)}
                                        onBlur={(e) => {
                                          if (!e.target.value) {
                                            onUpdateVarianteQuantidade(variante.id, '1');
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                          }
                                        }}
                                      />
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
              ))}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('requisitions.ui.addedMaterials')}</p>

        {materialLinhas.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('requisitions.ui.noMaterialsYet')}</p>
        ) : (
          <div className="space-y-4">
            {materiaisAdicionadosAgrupados.map((grupo) => (
              <div key={grupo.categoria} className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t(grupo.label)}</p>

                <div className="space-y-2">
                  {grupo.itens.map((item) => (
                    <div
                      key={item.rowId}
                      className="grid grid-cols-[minmax(0,1fr)_88px_auto] gap-2 items-center rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900"
                    >
                      <p className="min-w-0 truncate text-sm text-gray-900 dark:text-gray-100" title={item.descricao}>
                        {item.descricao}
                      </p>
                      <Input
                        type="number"
                        min="1"
                        className={`${quantityFieldClassName} w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        value={item.quantidade}
                        onChange={(event) => onUpdateVarianteQuantidade(item.materialId, event.target.value)}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            onUpdateVarianteQuantidade(item.materialId, '1');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-3"
                        onClick={() => onRemoveMaterialLinha(item.rowId)}
                      >
                        {t('requisitions.ui.remove')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('requisitions.ui.totalRows', { count: materialLinhas.length })}</span>
              <span>{t('requisitions.ui.totalUnits', { count: materiaisAdicionadosTotal })}</span>
            </div>
          </div>
        )}
      </div>

      {materiaisError && (
        <p className="text-red-500 text-xs">{materiaisError}</p>
      )}
    </div>
  );
}
