import { useState, useMemo } from 'react';
import { ChevronDown, Search, ShoppingBag, Box, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Input } from '../../ui/input';
import { MaterialItemGroup } from '../../../pages/requisitions/sharedRequisitions.helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { validateMaterialQuantity, finalizeMaterialQuantity } from '../../../utils/validations/requisition.validation';

interface RequisitionsCreateMaterialFormProps {
  materialLinhas: Array<{ rowId: string; materialId: string; quantidade: string }>;
  expandedMaterialItems: Record<string, boolean>;
  expandedMaterialCategorias: Partial<Record<string, boolean>>;
  materiaisPorCategoria: Array<{
    categoria: string;
    label: string;
    itens: MaterialItemGroup[];
  }>;
  materiaisAdicionadosTotal: number;
  onToggleCategoriaExpansion: (categoria: string) => void;
  onToggleItemVisibility: (itemKey: string) => void;
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
  onToggleVariante,
  onUpdateVarianteQuantidade,
  onRemoveMaterialLinha,
  quantityFieldClassName,
  materiaisAdicionadosAgrupados = [],
  materiaisError,
  t,
}: Readonly<RequisitionsCreateMaterialFormProps>) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Find currently active category (first expanded one or the first one available)
  const activeCategory = Object.keys(expandedMaterialCategorias).find(k => expandedMaterialCategorias[k]) 
    ?? materiaisPorCategoria[0]?.categoria;

  const filteredMateriaisPorCategoria = useMemo(() => {
    if (!searchTerm) return materiaisPorCategoria;
    
    const term = searchTerm.toLowerCase();
    return materiaisPorCategoria.map((cat) => ({
      ...cat,
      itens: cat.itens.filter((item) => 
        item.nome.toLowerCase().includes(term) || 
        item.variantes.some(v => v.atributo?.toLowerCase().includes(term) || v.valorAtributo?.toLowerCase().includes(term))
      )
    })).filter(cat => cat.itens.length > 0);
  }, [searchTerm, materiaisPorCategoria]);

  const currentCategoryData = filteredMateriaisPorCategoria.find(v => v.categoria === activeCategory) 
    ?? filteredMateriaisPorCategoria[0];
  
  const handleItemSelection = (item: MaterialItemGroup) => {
    const isSingleVariant = item.variantes.length === 1;
    if (isSingleVariant) {
      const variante = item.variantes[0];
      const isCurrentlySelected = materialLinhas.some(l => l.materialId === String(variante.id));
      if (!isCurrentlySelected) {
        onToggleVariante(variante.id, true);
      }
    }
    onToggleItemVisibility(item.itemKey);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
      <div className="space-y-6 min-w-0">
        {/* Search and Navigation */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
            <Input
              placeholder={t('requisitions.ui.searchPlaceholder', { defaultValue: 'Pesquisar materiais...' })}
              className="pl-10 pr-10 h-11 bg-card border-border rounded-xl shadow-sm focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-foreground z-10"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {materiaisPorCategoria.map((cat) => {
              const isActive = activeCategory === cat.categoria;
              const matchCount = searchTerm 
                ? filteredMateriaisPorCategoria.find(fc => fc.categoria === cat.categoria)?.itens.length ?? 0
                : cat.itens.length;

              return (
                <button
                  key={cat.categoria}
                  onClick={() => onToggleCategoriaExpansion(cat.categoria)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'bg-card/60 text-muted-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {t(cat.label)}
                  <span className={`ml-2 text-xs opacity-70 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {matchCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Material Selection Grid */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchTerm}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {currentCategoryData?.itens.map((item) => {
                const selectedCount = item.variantes.filter((variante) =>
                  materialLinhas.some((linha) => linha.materialId === String(variante.id)),
                ).length;
                const isSelected = selectedCount > 0;
                const isExpanded = expandedMaterialItems[item.itemKey] === true;

                return (
                  <div
                    key={item.itemKey}
                    className={`group relative flex flex-col rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? 'border-primary/30 bg-primary/10 ring-1 ring-primary/20'
                        : 'border-border bg-card/40 hover:border-primary/40'
                    }`}
                  >
                    <div 
                      className="p-4 flex-1 space-y-3 cursor-pointer"
                      onClick={() => handleItemSelection(item)}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.nome}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/15' : 'hover:bg-primary/10'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemSelection(item);
                          }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Variants and Selection */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-2"
                          >
                            <div className="space-y-3 p-3 rounded-xl bg-card/70 border border-border">
                              {item.variantes.map((variante) => {
                                const checked = materialLinhas.some((linha) => linha.materialId === String(variante.id));
                                const linha = materialLinhas.find((l) => l.materialId === String(variante.id));
                                const label = variante.atributo && variante.valorAtributo
                                  ? `${variante.atributo}: ${variante.valorAtributo}`
                                  : t('requisitions.ui.defaultVariant', { defaultValue: 'Padrão' });
                                  return (
                                    <div key={variante.id} className="space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <div 
                                          className="flex-1 flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-accent transition-colors group/variant cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleVariante(variante.id, !checked);
                                          }}
                                        >
                                          <Checkbox
                                            id={`var-${variante.id}`}
                                            checked={checked}
                                            onClick={(e) => e.stopPropagation()}
                                            onCheckedChange={(c) => onToggleVariante(variante.id, !!c)}
                                            className="h-4 w-4 rounded-md border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                          />
                                          <label 
                                            htmlFor={`var-${variante.id}`} 
                                            className="flex-1 text-sm text-foreground/85 cursor-pointer select-none truncate"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {label}
                                          </label>
                                        </div>
                                        {checked && (
                                          <div className="flex items-center gap-1 bg-card rounded-lg p-0.5 border border-border shadow-sm">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 rounded-md hover:bg-primary/10 text-primary"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const current = parseInt(linha?.quantidade || '1', 10);
                                                if (current > 1) {
                                                  onUpdateVarianteQuantidade(variante.id, String(current - 1));
                                                }
                                              }}
                                            >
                                              <span className="text-lg font-medium">−</span>
                                            </Button>
                                            <Input
                                              type="text"
                                              inputMode="numeric"
                                              className={`h-6 w-10 text-center text-xs border-none bg-transparent shadow-none focus-visible:ring-0 p-0 font-bold ${quantityFieldClassName}`}
                                              value={linha?.quantidade ?? '1'}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const validated = validateMaterialQuantity(e.target.value);
                                                onUpdateVarianteQuantidade(variante.id, validated);
                                              }}
                                              onBlur={(e) => {
                                                const finalized = finalizeMaterialQuantity(e.target.value);
                                                onUpdateVarianteQuantidade(variante.id, finalized);
                                              }}
                                            />
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 rounded-md hover:bg-primary/10 text-primary"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const current = parseInt(linha?.quantidade || '1', 10);
                                                if (current < 200) {
                                                  onUpdateVarianteQuantidade(variante.id, String(current + 1));
                                                }
                                              }}
                                            >
                                              <span className="text-lg font-medium">+</span>
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {!isExpanded && (
                      <div className="px-4 pb-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemSelection(item);
                          }}
                          className={`w-full h-9 rounded-xl transition-all duration-300 ${
                            isSelected
                              ? 'bg-primary/15 text-primary hover:bg-primary/20'
                              : 'bg-card border-border hover:border-primary/50 text-foreground/85'
                          }`}
                          variant="outline"
                        >
                          {isSelected 
                            ? t('requisitions.ui.editSelection', { defaultValue: 'Editar Seleção' }) 
                            : (item.variantes.length === 1 ? t('requisitions.ui.add', { defaultValue: 'Adicionar' }) : t('requisitions.ui.selectVariants', { defaultValue: 'Selecionar Opções' }))}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {!currentCategoryData && searchTerm && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">{t('requisitions.ui.noMatches', { defaultValue: 'Nenhum material encontrado' })}</p>
                    <p className="text-xs text-muted-foreground">"{searchTerm}"</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Cart Summary Side Panel */}
      <div className="space-y-6">
        <div className="sticky top-6">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
            <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 to-status-info-soft/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary shadow-lg shadow-primary/20">
                    <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{t('requisitions.ui.addedMaterials')}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">{t('requisitions.ui.selectionSummary', { defaultValue: 'Resumo da Seleção' })}</p>
                  </div>
                </div>
                {materialLinhas.length > 0 && (
                  <div className="px-2 py-1 rounded-lg bg-primary/15 text-primary text-[10px] font-bold">
                    {materiaisAdicionadosTotal} units
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {materialLinhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <Box className="w-12 h-12 mb-3" />
                  <p className="text-sm font-medium">{t('requisitions.ui.noMaterialsYet')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {materiaisAdicionadosAgrupados.map((grupo) => (
                    <div key={grupo.categoria} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{t(grupo.label)}</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <div className="space-y-2">
                        {grupo.itens.map((item) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={item.rowId}
                            className="group p-3 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-foreground truncate" title={item.descricao}>
                                  {item.descricao}
                                </p>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 pr-1">
                                    <span className="text-[10px] text-muted-foreground font-medium">{t('requisitions.ui.quantityShort')}:</span>
                                    <div className="flex items-center gap-1 bg-card/90 border border-border rounded-lg p-0.5 shadow-sm transition-shadow focus-within:shadow-md">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md hover:bg-primary/10 text-primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const current = parseInt(item.quantidade || '1', 10);
                                          if (current > 1) {
                                            onUpdateVarianteQuantidade(item.materialId, String(current - 1));
                                          }
                                        }}
                                      >
                                        <span className="text-lg font-medium">−</span>
                                      </Button>
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        className="h-6 w-10 text-center text-xs border-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary rounded font-bold text-primary p-0"
                                        value={item.quantidade}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const validated = validateMaterialQuantity(e.target.value);
                                          onUpdateVarianteQuantidade(item.materialId, validated);
                                        }}
                                        onBlur={(e) => {
                                          const finalized = finalizeMaterialQuantity(e.target.value);
                                          onUpdateVarianteQuantidade(item.materialId, finalized);
                                        }}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-md hover:bg-primary/10 text-primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const current = parseInt(item.quantidade || '1', 10);
                                          if (current < 200) {
                                            onUpdateVarianteQuantidade(item.materialId, String(current + 1));
                                          }
                                        }}
                                      >
                                        <span className="text-lg font-medium">+</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-status-error-soft hover:text-status-error transition-all duration-200"
                                onClick={() => onRemoveMaterialLinha(item.rowId)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-muted/40">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span className="text-sm">{t('requisitions.ui.totalSelected', { defaultValue: 'Total Selecionado' })}</span>
                <span className="text-lg text-primary">{materialLinhas.length} items</span>
              </div>
              {materiaisError && (
                <p className="text-status-error text-[10px] mt-2 font-medium">{materiaisError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
