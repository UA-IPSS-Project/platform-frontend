import { Textarea } from '../../ui/textarea';
import { RequisicaoPrioridade, RequisicaoTipo } from '../../../services/api';
import { PRIORIDADE_OPTIONS, TIPO_OPTIONS } from '../../../pages/requisitions/sharedRequisitions.helpers';

interface RequisitionsCreateCommonFieldsProps {
  descricao: string;
  onChangeDescricao: (value: string) => void;
  onChangeTipo: (value: RequisicaoTipo) => void;
  prioridade: RequisicaoPrioridade;
  onChangePrioridade: (value: RequisicaoPrioridade) => void;
  tipo: RequisicaoTipo;
  descricaoError?: string;
  inputFieldClassName: string;
  textareaFieldClassName: string;
  selectFieldClassName: string;
  t: (key: string) => string;
}

export function RequisitionsCreateCommonFields({
  tipo,
  descricao,
  onChangeDescricao,
  onChangeTipo,
  prioridade,
  onChangePrioridade,
  descricaoError,
  textareaFieldClassName,
  selectFieldClassName,
  t,
}: Readonly<RequisitionsCreateCommonFieldsProps>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="req-create-tipo" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.type')}</label>
          <select
            id="req-create-tipo"
            value={tipo}
            onChange={(e) => onChangeTipo(e.target.value as RequisicaoTipo)}
            className={selectFieldClassName}
          >
            {TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{t(option.label)}</option>
            ))}
          </select>
        </div>

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
      </div>

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
    </div>
  );
}
