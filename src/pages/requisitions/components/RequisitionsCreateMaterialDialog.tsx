import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { MaterialCategoria } from '../../../services/api';
import { MATERIAL_CATEGORIA_OPTIONS } from '../sharedRequisitions.helpers';

interface RequisitionsCreateMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputFieldClassName: string;
  textareaFieldClassName: string;
  novoMaterialNome: string;
  novoMaterialDescricao: string;
  novoMaterialCategoria: MaterialCategoria;
  novoMaterialAtributo: string;
  novoMaterialValorAtributo: string;
  submittingMaterial: boolean;
  onChangeNome: (value: string) => void;
  onChangeDescricao: (value: string) => void;
  onChangeCategoria: (value: MaterialCategoria) => void;
  onChangeAtributo: (value: string) => void;
  onChangeValorAtributo: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
  t: (key: string) => string;
}

export function RequisitionsCreateMaterialDialog({
  open,
  onOpenChange,
  inputFieldClassName,
  textareaFieldClassName,
  novoMaterialNome,
  novoMaterialDescricao,
  novoMaterialCategoria,
  novoMaterialAtributo,
  novoMaterialValorAtributo,
  submittingMaterial,
  onChangeNome,
  onChangeDescricao,
  onChangeCategoria,
  onChangeAtributo,
  onChangeValorAtributo,
  onCancel,
  onCreate,
  t,
}: Readonly<RequisitionsCreateMaterialDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>{t('requisitions.ui.newMaterial')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="novo-material-nome" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.name')}</label>
            <Input id="novo-material-nome" className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => onChangeNome(e.target.value)} placeholder={t('requisitions.ui.materialNamePlaceholder')} />
          </div>
          <div>
            <label htmlFor="novo-material-descricao" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.descriptionOptional')}</label>
            <Textarea id="novo-material-descricao" className={textareaFieldClassName} value={novoMaterialDescricao} onChange={(e) => onChangeDescricao(e.target.value)} placeholder={t('requisitions.ui.materialDescriptionPlaceholder')} />
          </div>
          <div>
            <label htmlFor="novo-material-categoria" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.category')}</label>
            <select
              id="novo-material-categoria"
              value={novoMaterialCategoria}
              onChange={(e) => onChangeCategoria(e.target.value as MaterialCategoria)}
              className="w-full mt-1 h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 px-3 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none"
            >
              {MATERIAL_CATEGORIA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(option.label)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="novo-material-atributo" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.attribute')}</label>
              <Input
                id="novo-material-atributo"
                className={inputFieldClassName}
                value={novoMaterialAtributo}
                onChange={(e) => onChangeAtributo(e.target.value)}
                placeholder={t('requisitions.ui.attributePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="novo-material-valor-atributo" className="text-sm text-gray-600 dark:text-gray-300">{t('requisitions.ui.attributeValue')}</label>
              <Input
                id="novo-material-valor-atributo"
                className={inputFieldClassName}
                value={novoMaterialValorAtributo}
                onChange={(e) => onChangeValorAtributo(e.target.value)}
                placeholder={t('requisitions.ui.attributeValuePlaceholder')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} disabled={submittingMaterial}>
              {t('appointmentDialog.actions.cancel')}
            </Button>
            <Button onClick={onCreate} disabled={submittingMaterial} className="bg-purple-600 hover:bg-purple-700 text-white">
              {submittingMaterial ? t('requisitions.ui.creating') : t('requisitions.ui.createMaterial')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
