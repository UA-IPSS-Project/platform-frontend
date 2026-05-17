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
import { inputCls, type RjsfWidgetProps } from './types';

export function TextWidget(props: RjsfWidgetProps) {
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

export function TextareaWidget(props: RjsfWidgetProps) {
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

export function EmailWidget(props: RjsfWidgetProps) {
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

export function DateWidget(props: RjsfWidgetProps) {
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

export function CheckboxWidget(props: RjsfWidgetProps) {
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

export function SelectWidget(props: RjsfWidgetProps) {
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

export function RadioWidget(props: RjsfWidgetProps) {
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
