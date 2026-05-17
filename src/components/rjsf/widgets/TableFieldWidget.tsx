import { Trash2, Plus } from 'lucide-react';
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

  if (tableType === 'family_aggregate') {
    const columns = config.columns || [];
    if (columns.length < 2) {
      return <p className="text-sm text-muted-foreground">Tabela Agregado Familiar requer pelo menos 2 colunas.</p>;
    }

    const parsed = safeParseJson(value);
    const rows: Array<{ id: string; values: string[] }> = Array.isArray(parsed?.rows)
      ? parsed.rows
      : [{ id: 'row-0', values: Array.from({ length: columns.length }, () => '') }];
    const outros = typeof parsed?.outros === 'string' ? parsed.outros : '';

    const parseAmount = (s: string) => {
      const n = parseFloat(String(s).replace(',', '.').replace(/\s/g, ''));
      return isNaN(n) ? 0 : n;
    };
    const fmtAmount = (n: number) =>
      n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const lastColIdx = columns.length - 1;
    const subTotal = rows.reduce((acc, row) => acc + parseAmount(row.values[lastColIdx] ?? ''), 0);
    const outrosNum = parseAmount(outros);
    const grandTotal = config.showOutros ? subTotal + outrosNum : subTotal;

    const save = (nextRows: typeof rows, nextOutros = outros) =>
      updateValue({ type: tableType, rows: nextRows, outros: nextOutros });

    const addRow = () =>
      save([...rows, { id: `row-${Date.now()}`, values: Array.from({ length: columns.length }, () => '') }]);

    const removeRow = (idx: number) => save(rows.filter((_, i) => i !== idx));

    const updateCell = (rowIdx: number, colIdx: number, val: string) =>
      save(rows.map((row, i) =>
        i === rowIdx ? { ...row, values: row.values.map((v, j) => (j === colIdx ? val : v)) } : row,
      ));

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500">{col}</th>
              ))}
              {!isReadOnly && <th className="w-8 border border-gray-200 bg-gray-50 px-1 py-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {columns.map((_, colIdx) => (
                  <td key={colIdx} className="border border-gray-200 px-2 py-1">
                    <Input
                      type="text"
                      value={row.values[colIdx] ?? ''}
                      disabled={isReadOnly}
                      className={inputCls}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      onBlur={(e) => onBlur(id, e.target.value)}
                      onFocus={(e) => onFocus(id, e.target.value)}
                      placeholder={colIdx === 0 ? '—' : '0,00'}
                    />
                  </td>
                ))}
                {!isReadOnly && (
                  <td className="border border-gray-200 px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIdx)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label="Remover linha"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {/* Sub-total — only when showOutros */}
            {config.showOutros && (
              <tr>
                <td className="border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm font-medium text-gray-600">Sub-total</td>
                {columns.slice(1).map((_, i) => (
                  <td key={`sub-${i}`} className="border border-gray-200 bg-gray-50/80 px-3 py-2 text-right text-sm font-medium text-gray-700">
                    {i + 1 === lastColIdx ? fmtAmount(subTotal) : '—'}
                  </td>
                ))}
                {!isReadOnly && <td className="border border-gray-200 bg-gray-50/80" />}
              </tr>
            )}

            {/* Outros rendimentos — only when showOutros */}
            {config.showOutros && (
              <tr>
                <td className="border border-gray-200 px-3 py-2 text-sm text-gray-700">Outros rendimentos</td>
                {columns.slice(1).map((_, i) => (
                  <td key={`outros-${i}`} className="border border-gray-200 px-2 py-1">
                    {i + 1 === lastColIdx ? (
                      <Input
                        type="text"
                        value={outros}
                        disabled={isReadOnly}
                        className={inputCls}
                        onChange={(e) => save(rows, e.target.value)}
                        onBlur={(e) => onBlur(id, e.target.value)}
                        onFocus={(e) => onFocus(id, e.target.value)}
                        placeholder="0,00"
                      />
                    ) : (
                      <span className="block px-1 text-center text-gray-400">—</span>
                    )}
                  </td>
                ))}
                {!isReadOnly && <td className="border border-gray-200" />}
              </tr>
            )}

            {/* Total — always shown */}
            <tr>
              <td className="border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm font-semibold text-gray-700">Total</td>
              {columns.slice(1).map((_, i) => (
                <td key={`total-${i}`} className="border border-gray-200 bg-gray-50/80 px-3 py-2 text-right text-sm font-semibold text-gray-700">
                  {i + 1 === lastColIdx ? fmtAmount(grandTotal) : '—'}
                </td>
              ))}
              {!isReadOnly && <td className="border border-gray-200 bg-gray-50/80" />}
            </tr>
          </tbody>
        </table>

        {!isReadOnly && (
          <button
            type="button"
            onClick={addRow}
            className="mt-2 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar linha
          </button>
        )}
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
