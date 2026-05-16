import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { SortableStringList } from './SortableStringList';
import type { FormFieldConfigPanelProps, FormFieldRenderProps } from './types';

interface Cfg {
  columns: string[];
  rows: number;
  showOutros: boolean;
  showTotal: boolean;
}

function parse(raw: Record<string, unknown>): Cfg {
  return {
    columns: Array.isArray(raw.columns)
      ? (raw.columns as string[])
      : ['Nome', 'Parentesco', 'Data Nasc.', 'NIF'],
    rows: typeof raw.rows === 'number' && raw.rows > 0 ? raw.rows : 4,
    showOutros: raw.showOutros === true,
    showTotal: raw.showTotal !== false,
  };
}

const SPECIAL_CELL = 'border border-gray-200 dark:border-gray-700 px-2 py-1 bg-gray-50/80 dark:bg-gray-800/40';
const DATA_CELL = 'border border-gray-200 dark:border-gray-700 px-2 py-1';

export function GridTable({ config }: FormFieldRenderProps) {
  const { columns, rows, showOutros, showTotal } = parse(config);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((col, ci) => (
              <th
                key={ci}
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, ri) => (
            <tr key={ri}>
              {columns.map((_, ci) => (
                <td key={ci} className={DATA_CELL}>
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm focus:outline-none text-gray-800 dark:text-gray-200"
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}

          {showOutros && (
            <tr>
              {columns.map((_, ci) => (
                <td key={ci} className={SPECIAL_CELL}>
                  {ci === 0 ? (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Outros
                    </span>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-transparent text-sm focus:outline-none text-gray-800 dark:text-gray-200"
                      placeholder="—"
                    />
                  )}
                </td>
              ))}
            </tr>
          )}

          {showTotal && (
            <tr>
              {columns.map((_, ci) => (
                <td key={ci} className={SPECIAL_CELL}>
                  {ci === 0 ? (
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Total
                    </span>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-transparent text-sm font-medium focus:outline-none text-gray-800 dark:text-gray-200"
                      placeholder="—"
                    />
                  )}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function GridTableConfig({ config, onChange }: FormFieldConfigPanelProps) {
  const { columns, rows, showOutros, showTotal } = parse(config);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-1.5 block">
          Colunas
        </label>
        <SortableStringList
          items={columns}
          onChange={cols => onChange({ ...config, columns: cols })}
          addLabel="Adicionar coluna"
          itemPlaceholder="Nome da coluna"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
          Linhas de dados
        </label>
        <Input
          type="number"
          min={1}
          max={20}
          value={rows}
          onChange={e =>
            onChange({ ...config, rows: Math.max(1, parseInt(e.target.value) || 1) })
          }
          className="mt-1.5 w-24"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
          Opções
        </label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="grid-outros"
            checked={showOutros}
            onCheckedChange={v => onChange({ ...config, showOutros: v === true })}
          />
          <label
            htmlFor="grid-outros"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
          >
            Mostrar linha &ldquo;Outros&rdquo;
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="grid-total"
            checked={showTotal}
            onCheckedChange={v => onChange({ ...config, showTotal: v === true })}
          />
          <label
            htmlFor="grid-total"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
          >
            Mostrar linha &ldquo;Total&rdquo;
          </label>
        </div>
      </div>
    </div>
  );
}
