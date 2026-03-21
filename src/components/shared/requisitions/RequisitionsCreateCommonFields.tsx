import { DatePickerField } from '../../ui/date-picker-field';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { RequisicaoPrioridade, RequisicaoTipo } from '../../../services/api';
import { PRIORIDADE_OPTIONS, formatDateInput, parseDateInput } from '../../../pages/requisitions/sharedRequisitions.helpers';

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
  tipo,
  descricaoError,
  tempoLimiteError,
  inputFieldClassName,
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
            value={formatDateInput(tempoLimite)}
            onChange={(value) => onChangeTempoLimite(value ? parseDateInput(value) : undefined)}
            buttonClassName={`mt-1 ${tempoLimiteError ? 'border-red-500' : ''}`}
          />
          {tempoLimiteError && <p className="text-red-500 text-xs mt-1">{tempoLimiteError}</p>}
        </div>
      </div>
    </div>
  );
}
