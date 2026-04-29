import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { DatePickerField } from '../../ui/date-picker-field';
import { RequisicaoPrioridade, RequisicaoTipo } from '../../../services/api';
import { PRIORIDADE_OPTIONS, TIPO_OPTIONS } from '../../../pages/requisitions/sharedRequisitions.helpers';
import { PeriodicidadeFrequencia } from '../../../services/api/requisicoes/types';

/* 
i18n keys needed (inform only):
requisitions.periodica.label
requisitions.periodica.frequencia.label
requisitions.periodica.frequencia.DIARIA
requisitions.periodica.frequencia.SEMANAL
requisitions.periodica.frequencia.MENSAL
requisitions.periodica.dataInicio
requisitions.periodica.dataFim
requisitions.periodica.dataFimHint
*/

interface RequisitionsCreateCommonFieldsProps {
  descricao: string;
  onChangeDescricao: (value: string) => void;
  onChangeTipo: (value: RequisicaoTipo) => void;
  prioridade: RequisicaoPrioridade;
  onChangePrioridade: (value: RequisicaoPrioridade) => void;
  isPeriodica: boolean;
  onChangeIsPeriodica: (value: boolean) => void;
  periodicaFrequencia: PeriodicidadeFrequencia;
  onChangePeriodicaFrequencia: (value: PeriodicidadeFrequencia) => void;
  periodicaDataInicio: string;
  onChangePeriodicaDataInicio: (value: string) => void;
  periodicaDataFim: string;
  onChangePeriodicaDataFim: (value: string) => void;
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
  isPeriodica,
  onChangeIsPeriodica,
  periodicaFrequencia,
  onChangePeriodicaFrequencia,
  periodicaDataInicio,
  onChangePeriodicaDataInicio,
  periodicaDataFim,
  onChangePeriodicaDataFim,
  descricaoError,  inputFieldClassName,  textareaFieldClassName,
  selectFieldClassName,
  t,
}: Readonly<RequisitionsCreateCommonFieldsProps>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="req-create-tipo" className="text-sm text-muted-foreground">{t('requisitions.ui.type')}</label>
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
          <label htmlFor="req-create-prioridade" className="text-sm text-muted-foreground">{t('requisitions.ui.priority')}</label>
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
        <label htmlFor="req-create-descricao" className="text-sm text-muted-foreground">{t('requisitions.ui.description')}</label>
        <Textarea
          id="req-create-descricao"
          className={textareaFieldClassName}
          value={descricao}
          onChange={(e) => onChangeDescricao(e.target.value)}
          placeholder={t('requisitions.ui.descriptionPlaceholder')}
          rows={3}
        />
        {descricaoError && <p className="text-status-error text-xs mt-1">{descricaoError}</p>}
      </div>

      <div className="pt-2 border-t mt-4 border-input-border/30">
        <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
          <Checkbox
            checked={isPeriodica}
            onCheckedChange={(checked) => onChangeIsPeriodica(checked === true)}
          />
          <span>{t('requisitions.periodica.label')}</span>
        </label>

        {isPeriodica && (
          <div className="grid grid-cols-1 gap-3 mt-3 sm:grid-cols-3">
            <div>
              <label htmlFor="req-periodica-frequencia" className="text-sm text-muted-foreground">
                {t('requisitions.periodica.frequencia.label')}
              </label>
              <select
                id="req-periodica-frequencia"
                value={periodicaFrequencia}
                onChange={(e) => onChangePeriodicaFrequencia(e.target.value as PeriodicidadeFrequencia)}
                className={selectFieldClassName}
              >
                <option value="DIARIA">{t('requisitions.periodica.frequencia.DIARIA')}</option>
                <option value="SEMANAL">{t('requisitions.periodica.frequencia.SEMANAL')}</option>
                <option value="MENSAL">{t('requisitions.periodica.frequencia.MENSAL')}</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="req-periodica-dataInicio" className="text-sm text-muted-foreground">
                {t('requisitions.periodica.dataInicio')}
              </label>
              <DatePickerField
                id="req-periodica-dataInicio"
                value={periodicaDataInicio}
                onChange={onChangePeriodicaDataInicio}
                buttonClassName={inputFieldClassName}
              />
            </div>
            
            <div>
              <label htmlFor="req-periodica-dataFim" className="text-sm text-muted-foreground">
                {t('requisitions.periodica.dataFim')}
              </label>
              <DatePickerField
                id="req-periodica-dataFim"
                value={periodicaDataFim}
                onChange={onChangePeriodicaDataFim}
                placeholder={t('requisitions.periodica.dataFimHint')}
                buttonClassName={inputFieldClassName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
