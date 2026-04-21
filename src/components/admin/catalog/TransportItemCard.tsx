import { Calendar, Info, Pencil, Truck, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type TransporteCategoria, type TransporteCatalogo } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { DatePickerField } from '../../ui/date-picker-field';
import { cn } from '../../ui/utils';
import {
  AVAILABLE_TRANSPORT_CATEGORIES,
  type EditFields,
  type EditSetters,
} from '../../../hooks/requisitions/useTransportCatalogForm';

interface TransportItemCardProps {
  item: TransporteCatalogo;
  isEditing: boolean;
  editFields: EditFields;
  setters: EditSetters;
  onEditStart: (item: TransporteCatalogo) => void;
  onEditCancel: () => void;
  onEditSave: (id: number, categoria: TransporteCategoria, codigo: string) => void;
  onScrap: (item: TransporteCatalogo) => void;
  getCategoryDisplayName: (cat: TransporteCategoria) => string;
}

export function TransportItemCard({
  item,
  isEditing,
  editFields,
  setters,
  onEditStart,
  onEditCancel,
  onEditSave,
  onScrap,
  getCategoryDisplayName,
}: Readonly<TransportItemCardProps>) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'group/item relative p-5 rounded-2xl border transition-all duration-300',
        isEditing
          ? 'bg-primary/5 border-primary shadow-inner'
          : 'bg-background/40 border-border/40 hover:border-primary/40 hover:bg-muted/30'
      )}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.internalCode')}</label>
              <Input value={editFields.editCodigo} onChange={(e) => setters.setEditCodigo(e.target.value.toUpperCase())} className="h-10 font-mono" placeholder="Ex: V01" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.plate')}</label>
              <Input value={editFields.editMatricula} onChange={(e) => setters.setEditMatricula(e.target.value.toUpperCase())} className="h-10 font-mono" placeholder="Matrícula" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.type')}</label>
              <Input value={editFields.editTipo} onChange={(e) => setters.setEditTipo(e.target.value)} className="h-10" placeholder="Tipo" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.brand')}</label>
              <Input value={editFields.editMarca} onChange={(e) => setters.setEditMarca(e.target.value)} className="h-10" placeholder="Marca" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.model')}</label>
              <Input value={editFields.editModelo} onChange={(e) => setters.setEditModelo(e.target.value)} className="h-10" placeholder="Modelo" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.capacity')}</label>
              <Input value={editFields.editLotacao} onChange={(e) => setters.setEditLotacao(e.target.value)} className="h-10" placeholder="Lotação" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.regDate')}</label>
              <DatePickerField value={editFields.editDataMatricula} onChange={setters.setEditDataMatricula} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{t('dashboard.admin.catalogs.category')}</label>
              <Select value={editFields.editCategoria} onValueChange={(value) => setters.setEditCategoria(value as TransporteCategoria)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('dashboard.admin.catalogs.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TRANSPORT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryDisplayName(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button size="sm" variant="ghost" onClick={onEditCancel}>{t('common.cancel')}</Button>
            <Button size="sm" onClick={() => void onEditSave(item.id, editFields.editCategoria, editFields.editCodigo)}>{t('common.ok')}</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {item.codigo}
              </span>
              <span className="font-mono font-bold text-lg tracking-wider">{item.matricula}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{item.marca} {item.modelo}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                  <Info className="w-3 h-3" /> {item.tipo}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                  <Truck className="w-3 h-3" /> {t('dashboard.admin.catalogs.seatsCount', { count: item.lotacao })}
                </span>
                {item.dataMatricula && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {new Date(item.dataMatricula).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg"
              onClick={() => onEditStart(item)}
              title={t('common.edit')}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            {item.categoria !== 'ABATIDO_VENDIDO_DESCONTINUADO' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => onScrap(item)}
                title={t('dashboard.admin.catalogs.confirm.scrapTransport')}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
