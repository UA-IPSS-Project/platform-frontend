export const inputCls = 'border border-border focus-visible:ring-2 focus-visible:ring-primary/30';

export type RjsfWidgetProps = {
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
    title?: string;
  };
  onChange: (value: unknown) => void;
  onBlur: (id: string, value: unknown) => void;
  onFocus: (id: string, value: unknown) => void;
};

export function safeParseJson(value: unknown): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
