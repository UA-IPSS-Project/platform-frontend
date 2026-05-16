import { Checkbox } from '../ui/checkbox';
import { SortableStringList } from './SortableStringList';
import type { FormFieldConfigPanelProps, FormFieldRenderProps } from './types';

interface Cfg {
  rows: string[];
  showTotal: boolean;
}

function parse(raw: Record<string, unknown>): Cfg {
  return {
    rows: Array.isArray(raw.rows)
      ? (raw.rows as string[])
      : ['Trabalho dependente', 'Trabalho independente', 'Pensão/Reforma'],
    showTotal: raw.showTotal !== false,
  };
}

const SOURCE_COL = 'Fonte de rendimento';
const AMOUNT_COL = 'Montante (€)';

export function LedgerTable({ config }: FormFieldRenderProps) {
  const { rows, showTotal } = parse(config);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-3/4">
              {SOURCE_COL}
            </th>
            <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
              {AMOUNT_COL}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                {row}
              </td>
              <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">
                <input
                  type="number"
                  className="w-full bg-transparent text-sm text-right focus:outline-none text-gray-800 dark:text-gray-200"
                  placeholder="0,00"
                />
              </td>
            </tr>
          ))}

          {showTotal && (
            <tr>
              <td className="border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Total
              </td>
              <td className="border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 px-2 py-1">
                <input
                  type="number"
                  className="w-full bg-transparent text-sm text-right font-semibold focus:outline-none text-gray-800 dark:text-gray-200"
                  placeholder="0,00"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function LedgerTableConfig({ config, onChange }: FormFieldConfigPanelProps) {
  const { rows, showTotal } = parse(config);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-1.5 block">
          Fontes de rendimento
        </label>
        <SortableStringList
          items={rows}
          onChange={r => onChange({ ...config, rows: r })}
          addLabel="Adicionar fonte"
          itemPlaceholder="Ex: Trabalho dependente"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="ledger-total"
          checked={showTotal}
          onCheckedChange={v => onChange({ ...config, showTotal: v === true })}
        />
        <label
          htmlFor="ledger-total"
          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
        >
          Mostrar linha &ldquo;Total&rdquo;
        </label>
      </div>
    </div>
  );
}
