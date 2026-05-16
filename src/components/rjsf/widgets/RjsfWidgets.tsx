import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerField } from '@/components/ui/date-picker-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

const inputCls = 'border border-border focus-visible:ring-2 focus-visible:ring-primary/30';

type RjsfWidgetProps = {
  id: string;
  value?: unknown;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  autofocus?: boolean;
  placeholder?: string;
  options: {
    autocomplete?: unknown;
    rows?: unknown;
    enumOptions?: Array<{ value: string | number | boolean; label: string }>;
    tableType?: string;
    fieldConfig?: Record<string, unknown>;
  };
  schema: {
    format?: string;
  };
  onChange: (value: unknown) => void;
  onBlur: (id: string, value: unknown) => void;
  onFocus: (id: string, value: unknown) => void;
};

type TableConfig = {
  columns?: string[];
  rows?: number | string[];
  showOutros?: boolean;
  showTotal?: boolean;
};

function safeParseJson(value: unknown): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

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

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function TextWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, autofocus, placeholder, onChange, onBlur, onFocus, options, schema } = props;

  return (
    <Input
      id={id}
      type={schema.format === 'date' ? 'date' : 'text'}
      value={typeof value === 'string' ? value : ''}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      autoComplete={(options.autocomplete as string) || undefined}
      className={inputCls}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur(id, e.target.value)}
      onFocus={(e) => onFocus(id, e.target.value)}
    />
  );
}

function TextareaWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, autofocus, placeholder, onChange, onBlur, onFocus, options } = props;

  const displayValue =
    typeof value === 'string'
      ? value
      : value != null
        ? JSON.stringify(value, null, 2)
        : '';

  return (
    <Textarea
      id={id}
      value={displayValue}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      rows={typeof options.rows === 'number' ? options.rows : 4}
      placeholder={placeholder}
      className={inputCls}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur(id, e.target.value)}
      onFocus={(e) => onFocus(id, e.target.value)}
    />
  );
}

function EmailWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, autofocus, placeholder, onChange, onBlur, onFocus, options } = props;

  return (
    <Input
      id={id}
      type="email"
      value={typeof value === 'string' ? value : ''}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      autoComplete={(options.autocomplete as string) || 'email'}
      className={inputCls}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur(id, e.target.value)}
      onFocus={(e) => onFocus(id, e.target.value)}
    />
  );
}

function DateWidget(props: RjsfWidgetProps) {
  const { id, value, disabled, readonly, placeholder, onChange, onBlur } = props;
  const currentValue = typeof value === 'string' ? value : '';

  return (
    <DatePickerField
      id={id}
      value={currentValue}
      placeholder={placeholder || 'Selecionar data'}
      buttonClassName={`${inputCls} bg-muted text-foreground`}
      disabled={Boolean(disabled || readonly)}
      onChange={(nextValue: string) => {
        onChange(nextValue);
        onBlur(id, nextValue);
      }}
    />
  );
}

function CheckboxWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, onChange } = props;

  return (
    <div className="flex items-center">
      <Checkbox
        id={id}
        checked={Boolean(value)}
        required={required}
        disabled={disabled || readonly}
        onCheckedChange={(checked: boolean) => onChange(Boolean(checked))}
      />
    </div>
  );
}

function SelectWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, placeholder, options, onChange } = props;
  const enumOptions = options.enumOptions || [];

  return (
    <Select
      value={typeof value === 'string' ? value : ''}
      disabled={disabled || readonly}
      required={required}
      onValueChange={(nextValue: string) => onChange(nextValue)}
    >
      <SelectTrigger id={id} className={inputCls}>
        <SelectValue placeholder={placeholder || 'Selecione uma opção'} />
      </SelectTrigger>
      <SelectContent>
        {enumOptions.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RadioWidget(props: RjsfWidgetProps) {
  const { id, value, disabled, readonly, options, onChange } = props;
  const enumOptions = options.enumOptions || [];

  return (
    <div className="flex flex-col gap-2 mt-1">
      {enumOptions.map((option) => {
        const optionId = `${id}_${String(option.value)}`;
        const checked = String(value) === String(option.value);
        return (
          <label key={String(option.value)} htmlFor={optionId} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              id={optionId}
              name={id}
              value={String(option.value)}
              checked={checked}
              disabled={disabled || readonly}
              onChange={() => onChange(String(option.value))}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function TableFieldWidget(props: RjsfWidgetProps) {
  const { id, value, disabled, readonly, onChange, onBlur, onFocus, options } = props;
  const tableType = options.tableType || 'table';
  const config = getTableConfig(options);
  const isReadOnly = Boolean(disabled || readonly);

  const updateValue = (nextValue: unknown) => {
    const serialized = serializeJson(nextValue);
    onChange(serialized);
  };

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

export const rjsfWidgets = {
  TextWidget,
  EmailWidget,
  DateWidget,
  TextareaWidget,
  CheckboxWidget,
  SelectWidget,
  RadioWidget,
  TableFieldWidget,
  tableField: TableFieldWidget,
};
