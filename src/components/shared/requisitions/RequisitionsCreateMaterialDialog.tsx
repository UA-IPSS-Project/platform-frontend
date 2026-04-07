import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { MaterialCategoria } from '../../../services/api';
import { MATERIAL_CATEGORIA_OPTIONS } from '../../../pages/requisitions/sharedRequisitions.helpers';

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
      <DialogContent className="max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{t('requisitions.ui.newMaterial')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label htmlFor="novo-material-nome" className="text-sm text-muted-foreground">{t('requisitions.ui.name')}</label>
            <Input id="novo-material-nome" className={inputFieldClassName} value={novoMaterialNome} onChange={(e) => onChangeNome(e.target.value)} placeholder={t('requisitions.ui.materialNamePlaceholder')} />
          </div>
          <div>
            <label htmlFor="novo-material-descricao" className="text-sm text-muted-foreground">{t('requisitions.ui.descriptionOptional')}</label>
            <Textarea id="novo-material-descricao" className={textareaFieldClassName} value={novoMaterialDescricao} onChange={(e) => onChangeDescricao(e.target.value)} placeholder={t('requisitions.ui.materialDescriptionPlaceholder')} />
          </div>
          <div>
            <label htmlFor="novo-material-categoria" className="text-sm text-muted-foreground">{t('requisitions.ui.category')}</label>
            <select
              id="novo-material-categoria"
              value={novoMaterialCategoria}
              onChange={(e) => onChangeCategoria(e.target.value as MaterialCategoria)}
              className="w-full mt-1 h-10 rounded-md border-2 border-border bg-card px-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
            >
              {MATERIAL_CATEGORIA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{t(option.label)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="novo-material-atributo" className="text-sm text-muted-foreground">{t('requisitions.ui.attribute')}</label>
              <Input
                id="novo-material-atributo"
                className={inputFieldClassName}
                value={novoMaterialAtributo}
                onChange={(e) => onChangeAtributo(e.target.value)}
                placeholder={t('requisitions.ui.attributePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="novo-material-valor-atributo" className="text-sm text-muted-foreground">{t('requisitions.ui.attributeValue')}</label>
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
            <Button onClick={onCreate} disabled={submittingMaterial} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {submittingMaterial ? t('requisitions.ui.creating') : t('requisitions.ui.createMaterial')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
