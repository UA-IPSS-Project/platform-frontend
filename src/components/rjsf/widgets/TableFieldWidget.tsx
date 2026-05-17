import { Input } from '@/components/ui/input';
import { inputCls, safeParseJson, serializeJson, type RjsfWidgetProps } from './types';

type TableConfig = {
  columns?: string[];
  rows?: number | string[];
  showOutros?: boolean;
  showTotal?: boolean;
};

function toStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => (typeof item === 'string' ? item : String(item ?? '')));
}

function getTableConfig(options: RjsfWidgetProps['options']): TableConfig {
  const config = options.fieldConfig ?? {};
  return {
    columns: toStringArray(config.columns, []),
    rows: Array.isArray(config.rows)
      ? toStringArray(config.rows, [])
      : typeof config.rows === 'number'
        ? config.rows
        : undefined,
    showOutros: config.showOutros === true,
    showTotal: config.showTotal !== false,
  };
}

function toCellMatrix(value: unknown, rowCount: number, columnCount: number, depth = 0): string[][] {
  const parsed = safeParseJson(value);
  if (Array.isArray(parsed)) {
    return Array.from({ length: rowCount }, (_, rowIndex) =>
      Array.from({ length: columnCount }, (_, colIndex) => {
        const row = parsed[rowIndex];
        if (Array.isArray(row)) {
          return typeof row[colIndex] === 'string' ? row[colIndex] : String(row[colIndex] ?? '');
        }
        return rowIndex === 0 && colIndex === 0 ? String(row ?? '') : '';
      }),
    );
  }

  if (depth === 0 && parsed && typeof parsed === 'object' && Array.isArray((parsed as any).cells)) {
    return toCellMatrix((parsed as any).cells, rowCount, columnCount, 1);
  }

  const matrix = Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => ''));
  if (typeof parsed === 'string' && parsed.trim()) {
    matrix[0][0] = parsed.trim();
  }
  return matrix;
}

export function TableFieldWidget(props: RjsfWidgetProps) {
  const { id, value, disabled, readonly, onChange, onBlur, onFocus, options } = props;
  const tableType = options.tableType || 'table';
  const config = getTableConfig(options);
  const isReadOnly = Boolean(disabled || readonly);

  const updateValue = (nextValue: unknown) => onChange(serializeJson(nextValue));

  if (tableType === 'ledger_table') {
    const rows = Array.isArray(config.rows) ? config.rows : [];
    const parsed = safeParseJson(value);
    const items = Array.isArray(parsed?.items)
      ? parsed.items
      : rows.map((rowLabel) => ({ label: rowLabel, amount: '' }));
    const totalValue = typeof parsed?.total === 'string' ? parsed.total : '';

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500">Fonte de rendimento</th>
              <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-right text-xs font-medium text-gray-500">Montante (€)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rowLabel, rowIndex) => {
              const item = items[rowIndex] || { label: rowLabel, amount: '' };
              return (
                <tr key={rowLabel}>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-700">{rowLabel}</td>
                  <td className="border border-gray-200 px-2 py-1">
                    <Input
                      type="text"
                      value={typeof item.amount === 'string' ? item.amount : ''}
                      disabled={isReadOnly}
                      className={inputCls}
                      onChange={(event) => {
                        const nextItems = items.map((entry: any, index: number) =>
                          index === rowIndex ? { ...entry, label: rowLabel, amount: event.target.value } : entry,
                        );
                        updateValue({ type: tableType, items: nextItems, total: totalValue });
                      }}
                      onBlur={(event) => onBlur(id, event.target.value)}
                      onFocus={(event) => onFocus(id, event.target.value)}
                      placeholder="0,00"
                    />
                  </td>
                </tr>
              );
            })}
            {config.showTotal ? (
              <tr>
                <td className="border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm font-semibold text-gray-700">Total</td>
                <td className="border border-gray-200 bg-gray-50/80 px-2 py-1">
                  <Input
                    type="text"
                    value={totalValue}
                    disabled={isReadOnly}
                    className={inputCls}
                    onChange={(event) => updateValue({ type: tableType, items, total: event.target.value })}
                    onBlur={(event) => onBlur(id, event.target.value)}
                    onFocus={(event) => onFocus(id, event.target.value)}
                    placeholder="0,00"
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }

  if (tableType === 'structured_table') {
    const rowLabels = Array.isArray(config.rows) ? config.rows : [];
    const columns = config.columns || [];
    const parsed = safeParseJson(value);
    const rows = Array.isArray(parsed?.rows)
      ? parsed.rows
      : rowLabels.map((label) => ({ label, values: Array.from({ length: columns.length }, () => '') }));

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-3 py-2" />
              {columns.map((column) => (
                <th key={column} className="border border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-500">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowLabel, rowIndex) => {
              const rowValue = rows[rowIndex] || { label: rowLabel, values: Array.from({ length: columns.length }, () => '') };
              const cellValues = Array.isArray(rowValue.values) ? rowValue.values : [];
              return (
                <tr key={rowLabel}>
                  <td className="border border-gray-200 bg-gray-50/60 px-3 py-2 text-sm font-medium text-gray-700">{rowLabel}</td>
                  {columns.map((column, colIndex) => (
                    <td key={`${rowLabel}-${column}`} className="border border-gray-200 px-2 py-1">
                      <Input
                        type="text"
                        value={typeof cellValues[colIndex] === 'string' ? cellValues[colIndex] : ''}
                        disabled={isReadOnly}
                        className={inputCls}
                        onChange={(event) => {
                          const nextRows = rows.map((entry: any, index: number) =>
                            index === rowIndex
                              ? { ...entry, label: rowLabel, values: entry.values?.map((cell: string, cellIndex: number) => (cellIndex === colIndex ? event.target.value : cell)) ?? [] }
                              : entry,
                          );
                          updateValue({ type: tableType, rows: nextRows });
                        }}
                        onBlur={(event) => onBlur(id, event.target.value)}
                        onFocus={(event) => onFocus(id, event.target.value)}
                        placeholder="—"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const columns = config.columns || [];
  const rowCount = typeof config.rows === 'number' ? config.rows : 0;
  const totalRows = rowCount + (config.showOutros ? 1 : 0) + (config.showTotal ? 1 : 0);
  const parsed = safeParseJson(value);
  const cells = toCellMatrix(parsed, totalRows, columns.length);

  if (columns.length === 0 || totalRows === 0) {
    return <p className="text-sm text-muted-foreground">Tabela sem configuração.</p>;
  }

  const normalRows = cells.slice(0, rowCount);
  const extrasStart = rowCount;
  const outrosRow = config.showOutros ? cells[extrasStart] ?? Array.from({ length: columns.length }, () => '') : null;
  const totalRow = config.showTotal ? cells[extrasStart + (config.showOutros ? 1 : 0)] ?? Array.from({ length: columns.length }, () => '') : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalRows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {columns.map((column, colIndex) => (
                <td key={`${rowIndex}-${column}`} className="border border-gray-200 px-2 py-1">
                  <Input
                    type="text"
                    value={typeof row[colIndex] === 'string' ? row[colIndex] : ''}
                    disabled={isReadOnly}
                    className={inputCls}
                    onChange={(event) => {
                      const nextRows = cells.map((existingRow) => [...existingRow]);
                      nextRows[rowIndex][colIndex] = event.target.value;
                      updateValue({ type: tableType, cells: nextRows });
                    }}
                    onBlur={(event) => onBlur(id, event.target.value)}
                    onFocus={(event) => onFocus(id, event.target.value)}
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>
          ))}

          {config.showOutros ? (
            <tr>
              {columns.map((column, colIndex) => (
                <td key={`outros-${column}`} className="border border-gray-200 bg-gray-50/80 px-2 py-1">
                  {colIndex === 0 ? (
                    <span className="text-xs font-medium text-gray-500">Outros</span>
                  ) : (
                    <Input
                      type="text"
                      value={typeof outrosRow?.[colIndex] === 'string' ? outrosRow[colIndex] : ''}
                      disabled={isReadOnly}
                      className={inputCls}
                      onChange={(event) => {
                        const nextRows = cells.map((existingRow) => [...existingRow]);
                        nextRows[extrasStart] = nextRows[extrasStart] ?? Array.from({ length: columns.length }, () => '');
                        nextRows[extrasStart][colIndex] = event.target.value;
                        updateValue({ type: tableType, cells: nextRows });
                      }}
                      onBlur={(event) => onBlur(id, event.target.value)}
                      onFocus={(event) => onFocus(id, event.target.value)}
                      placeholder="—"
                    />
                  )}
                </td>
              ))}
            </tr>
          ) : null}

          {config.showTotal ? (
            <tr>
              {columns.map((column, colIndex) => (
                <td key={`total-${column}`} className="border border-gray-200 bg-gray-50/80 px-2 py-1">
                  {colIndex === 0 ? (
                    <span className="text-xs font-semibold text-gray-700">Total</span>
                  ) : (
                    <Input
                      type="text"
                      value={typeof totalRow?.[colIndex] === 'string' ? totalRow[colIndex] : ''}
                      disabled={isReadOnly}
                      className={inputCls}
                      onChange={(event) => {
                        const nextRows = cells.map((existingRow) => [...existingRow]);
                        const totalIndex = extrasStart + (config.showOutros ? 1 : 0);
                        nextRows[totalIndex] = nextRows[totalIndex] ?? Array.from({ length: columns.length }, () => '');
                        nextRows[totalIndex][colIndex] = event.target.value;
                        updateValue({ type: tableType, cells: nextRows });
                      }}
                      onBlur={(event) => onBlur(id, event.target.value)}
                      onFocus={(event) => onFocus(id, event.target.value)}
                      placeholder="—"
                    />
                  )}
                </td>
              ))}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
