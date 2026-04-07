import { Input } from '../../ui/input';

interface RequisitionsCreateMaintenanceFormProps {
  assunto: string;
  onChangeAssunto: (value: string) => void;
  inputFieldClassName: string;
  t: (key: string) => string;
}

export function RequisitionsCreateMaintenanceForm({
  assunto,
  onChangeAssunto,
  inputFieldClassName,
  t,
}: Readonly<RequisitionsCreateMaintenanceFormProps>) {
  return (
    <div>
      <label htmlFor="req-create-assunto" className="text-sm text-muted-foreground">{t('requisitions.ui.subjectOptional')}</label>
      <Input id="req-create-assunto" className={inputFieldClassName} type="text" value={assunto} onChange={(e) => onChangeAssunto(e.target.value)} placeholder={t('requisitions.ui.subjectPlaceholder')} />
    </div>
  );
}
