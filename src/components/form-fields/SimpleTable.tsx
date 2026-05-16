import { Input } from '../ui/input';
import { SortableStringList } from './SortableStringList';
import type { FormFieldConfigPanelProps, FormFieldRenderProps } from './types';

interface Cfg {
  columns: string[];
  rows: number;
}

function parse(raw: Record<string, unknown>): Cfg {
  return {
    columns: Array.isArray(raw.columns)
      ? (raw.columns as string[])
      : ['Coluna 1', 'Coluna 2', 'Coluna 3'],
    rows: typeof raw.rows === 'number' && raw.rows > 0 ? raw.rows : 3,
  };
}

export function SimpleTable({ config }: FormFieldRenderProps) {
  const { columns, rows } = parse(config);
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
                <td
                  key={ci}
                  className="border border-gray-200 dark:border-gray-700 px-2 py-1"
                >
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-300"
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimpleTableConfig({ config, onChange }: FormFieldConfigPanelProps) {
  const { columns, rows } = parse(config);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-1.5 block">
          Colunas
        </label>
        <SortableStringList
          items={columns}
          onChange={cols => onChange({ ...config, columns: cols })}
          addLabel="+ Adicionar coluna"
          itemPlaceholder="Nome da coluna"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">
          Número de linhas
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
    </div>
  );
}