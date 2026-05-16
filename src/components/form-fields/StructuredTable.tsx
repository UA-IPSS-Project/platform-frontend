import { SortableStringList } from './SortableStringList';
import type { FormFieldConfigPanelProps, FormFieldRenderProps } from './types';

interface Cfg {
  rows: string[];
  columns: string[];
}

function parse(raw: Record<string, unknown>): Cfg {
  return {
    rows: Array.isArray(raw.rows)
      ? (raw.rows as string[])
      : ['Situação profissional', 'Habilitações literárias', 'Estado civil'],
    columns: Array.isArray(raw.columns)
      ? (raw.columns as string[])
      : ['Requerente', 'Cônjuge/U.F.'],
  };
}

export function StructuredTable({ config }: FormFieldRenderProps) {
  const { rows, columns } = parse(config);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2" />
            {columns.map((col, ci) => (
              <th
                key={ci}
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td className="border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/20 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {row}
              </td>
              {columns.map((_, ci) => (
                <td
                  key={ci}
                  className="border border-gray-200 dark:border-gray-700 px-2 py-1"
                >
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-center focus:outline-none text-gray-800 dark:text-gray-200"
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

export function StructuredTableConfig({ config, onChange }: FormFieldConfigPanelProps) {
  const { rows, columns } = parse(config);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-1.5 block">
          Linhas (características)
        </label>
        <SortableStringList
          items={rows}
          onChange={r => onChange({ ...config, rows: r })}
          addLabel="Adicionar linha"
          itemPlaceholder="Ex: Situação profissional"
        />
      </div>

      <div>
        <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase mb-1.5 block">
          Colunas
        </label>
        <SortableStringList
          items={columns}
          onChange={cols => onChange({ ...config, columns: cols })}
          addLabel="Adicionar coluna"
          itemPlaceholder="Ex: Requerente"
        />
      </div>
    </div>
  );
}
