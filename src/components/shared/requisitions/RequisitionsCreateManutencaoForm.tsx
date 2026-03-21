import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { ManutencaoItem } from '../../../services/api';

interface RequisitionsCreateManutencaoFormProps {
  manutencaoItems: ManutencaoItem[];
  expandedManutencaoCategorias: Record<string, boolean>;
  onToggleCategoriaExpansion: (categoria: string) => void;
  onToggleItem: (itemId: number, checked: boolean) => void;
  selectedManutencaoItemIds: number[];
  manutencaoObservacoesPorCategoria: Record<string, string>;
  onUpdateObservacaoCategoria: (categoria: string, observacao: string) => void;
  t: (key: string) => string;
}

const CATEGORIA_ORDER = ['CATL', 'RC', 'PRE_ESCOLAR', 'CRECHE'] as const;

const CATEGORIA_NOMES: Record<string, string> = {
  CATL: 'CATL',
  RC: 'R/C',
  PRE_ESCOLAR: 'Pré Escolar',
  CRECHE: 'Crech',
};

const ESPACOS_POR_CATEGORIA: Record<string, string[]> = {
  CATL: [
    'WC masculino',
    'WC feminino',
    'Salão',
    'Salão (palco)',
  ],
  RC: [
    'Parque exterior',
    'Relvado',
    'Acolhimento pré',
    'Acolhimento creche',
    'Gabinete',
    'WC deficientes',
    'WC Rosa',
    'WC azul',
    'Gabinete médico',
    'Oficina',
    'Corredor + WC',
    'Biblioteca',
    'Refeitório',
    'Lavatórios + Hall',
    'Elevador',
    'Escadas acesso 1º',
  ],
  PRE_ESCOLAR: [
    'Sala acolhimento',
    'Sala de educadoras',
    'WC deficientes',
    'WC azul',
    'WC cor de rosa',
    'Hall',
    'Escadas acesso 2º',
    'Corredor',
    'Sala Amarela',
    'Sala Azul',
    'Sala Verde',
    'Sala Arco-Íris',
    'WC',
    'Parque exterior',
  ],
  CRECHE: [
    'Parque ext. 3º andar',
    'S. Acolhimento grande',
    'S. Acollhimento peq.',
    'WC',
    'WC azul',
    'Corredor e hall',
    'Escadas acesso sotão',
    'Sala Amarela limão',
    'Sala Verde Alface',
    'Sala Vermelha',
    'Refeitório',
    'Copa',
    'Fraldário',
    'Sala azul turquesa',
    'Berçário',
  ],
};

const VERIFICACOES_ORDEM = [
  'Alumínios',
  'Blackouts',
  'Madeiras',
  'Armários',
  'Aquecedores',
  'Torneiras',
  'Eletricidade',
  'Cabides',
  'Paredes',
  'Tetos',
  'Chão',
] as const;

export function RequisitionsCreateManutencaoForm({
  manutencaoItems,
  expandedManutencaoCategorias,
  onToggleCategoriaExpansion,
  onToggleItem,
  selectedManutencaoItemIds,
  manutencaoObservacoesPorCategoria,
  onUpdateObservacaoCategoria,
  t,
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

        {CATEGORIA_ORDER.map((categoria) => {
          const isExpandedCategoria = expandedManutencaoCategorias[categoria] ?? false;
          const espacos = ESPACOS_POR_CATEGORIA[categoria];

          return (
            <div key={categoria} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleCategoriaExpansion(categoria)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Toggle ${CATEGORIA_NOMES[categoria]} expansion`}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">{CATEGORIA_NOMES[categoria]}</span>
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
                          {VERIFICACOES_ORDEM.map((verificacao) => (
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
                            {VERIFICACOES_ORDEM.map((verificacao) => {
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
