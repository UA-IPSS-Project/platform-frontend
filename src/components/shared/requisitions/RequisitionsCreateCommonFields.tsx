import { DatePickerField } from '../../ui/date-picker-field';
import { Textarea } from '../../ui/textarea';
import { RequisicaoPrioridade, RequisicaoTipo } from '../../../services/api';
import { PRIORIDADE_OPTIONS } from '../../../pages/requisitions/sharedRequisitions.helpers';

const toDateInputValue = (date?: Date): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateInputValue = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

interface RequisitionsCreateCommonFieldsProps {
  descricao: string;
  onChangeDescricao: (value: string) => void;
  prioridade: RequisicaoPrioridade;
  onChangePrioridade: (value: RequisicaoPrioridade) => void;
  tempoLimite: Date | undefined;
  onChangeTempoLimite: (value: Date | undefined) => void;
  tipo: RequisicaoTipo;
  descricaoError?: string;
  tempoLimiteError?: string;
  inputFieldClassName: string;
  textareaFieldClassName: string;
  selectFieldClassName: string;
  t: (key: string) => string;
}

export function RequisitionsCreateCommonFields({
  descricao,
  onChangeDescricao,
  prioridade,
  onChangePrioridade,
  tempoLimite,
  onChangeTempoLimite,
  descricaoError,
  tempoLimiteError,
  textareaFieldClassName,
  selectFieldClassName,
  t,
}: Readonly<RequisitionsCreateCommonFieldsProps>) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="req-create-descricao" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.description')}</label>
        <Textarea
          id="req-create-descricao"
          className={textareaFieldClassName}
          value={descricao}
          onChange={(e) => onChangeDescricao(e.target.value)}
          placeholder={t('requisitions.ui.descriptionPlaceholder')}
          rows={3}
        />
        {descricaoError && <p className="text-red-500 text-xs mt-1">{descricaoError}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="req-create-prioridade" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.priority')}</label>
          <select
            id="req-create-prioridade"
            value={prioridade}
            onChange={(e) => onChangePrioridade(e.target.value as RequisicaoPrioridade)}
            className={selectFieldClassName}
          >
            {PRIORIDADE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.label)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="req-create-tempo-limite" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.deadlineOptional')}</label>
          <DatePickerField
            id="req-create-tempo-limite"
            value={toDateInputValue(tempoLimite)}
            onChange={(value) => onChangeTempoLimite(fromDateInputValue(value))}
            buttonClassName={`mt-1 ${tempoLimiteError ? 'border-red-500' : ''}`}
          />
          {tempoLimiteError && <p className="text-red-500 text-xs mt-1">{tempoLimiteError}</p>}
        </div>
      </div>
    </div>
  );
}
