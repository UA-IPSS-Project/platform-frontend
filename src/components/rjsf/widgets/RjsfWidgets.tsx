import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

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
  };
  schema: {
    format?: string;
  };
  onChange: (value: unknown) => void;
  onBlur: (id: string, value: unknown) => void;
  onFocus: (id: string, value: unknown) => void;
};

function TextWidget(props: RjsfWidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    placeholder,
    onChange,
    onBlur,
    onFocus,
    options,
    schema,
  } = props;

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
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      onBlur={(event: React.FocusEvent<HTMLInputElement>) => onBlur(id, event.target.value)}
      onFocus={(event: React.FocusEvent<HTMLInputElement>) => onFocus(id, event.target.value)}
    />
  );
}

function TextareaWidget(props: RjsfWidgetProps) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    placeholder,
    onChange,
    onBlur,
    onFocus,
    options,
  } = props;

  return (
    <Textarea
      id={id}
      value={typeof value === 'string' ? value : ''}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      rows={typeof options.rows === 'number' ? options.rows : 4}
      placeholder={placeholder}
      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
      onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, event.target.value)}
      onFocus={(event: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, event.target.value)}
    />
  );
}

function CheckboxWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, onChange } = props;

  return (
    <div className="flex items-center h-9">
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
      <SelectTrigger id={id}>
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

export const rjsfWidgets = {
  TextWidget,
  TextareaWidget,
  CheckboxWidget,
  SelectWidget,
};
