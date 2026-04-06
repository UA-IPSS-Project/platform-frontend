import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type RjsfFieldTemplateProps = {
  id: string;
  label?: string;
  required?: boolean;
  hidden?: boolean;
  children: ReactNode;
  rawErrors?: string[];
  rawHelp?: ReactNode;
};

export function RjsfFieldTemplate(props: RjsfFieldTemplateProps) {
  const { id, label, required, hidden, children, rawErrors = [], rawHelp } = props;

  if (hidden) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required ? ' *' : ''}
        </Label>
      )}

      {children}

      {rawHelp ? <p className="text-xs text-slate-500 dark:text-slate-400">{rawHelp}</p> : null}

      {rawErrors.length > 0 ? (
        <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
          {rawErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
