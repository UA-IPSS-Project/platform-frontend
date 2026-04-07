import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type RjsfFieldTemplateProps = {
  id: string;
  label?: string;
  required?: boolean;
  hidden?: boolean;
  schema?: {
    type?: string;
  };
  children: ReactNode;
  rawErrors?: string[];
  rawHelp?: ReactNode;
};

export function RjsfFieldTemplate(props: RjsfFieldTemplateProps) {
  const { id, label, required, hidden, schema, children, rawErrors = [], rawHelp } = props;
  const isBooleanField = schema?.type === 'boolean';

  if (hidden) {
    return <>{children}</>;
  }

  return (
    <div className="mb-6 space-y-2">
      {isBooleanField ? (
        <div className="flex items-center gap-3">
          {children}
          {label ? (
            <Label htmlFor={id} className="cursor-pointer">
              {label}
              {required ? ' *' : ''}
            </Label>
          ) : null}
        </div>
      ) : (
        <>
          {label ? (
            <Label htmlFor={id}>
              {label}
              {required ? ' *' : ''}
            </Label>
          ) : null}
          {children}
        </>
      )}

      {rawHelp ? <p className="text-xs text-muted-foreground">{rawHelp}</p> : null}

      {rawErrors.length > 0 ? (
        <ul className="space-y-1 text-xs text-status-error">
          {rawErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
