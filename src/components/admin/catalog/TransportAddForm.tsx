import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type TransporteCategoria } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { DatePickerField } from '../../ui/date-picker-field';
import {
  AVAILABLE_TRANSPORT_CATEGORIES,
  type NewItemFields,
  type NewItemSetters,
} from '../../../hooks/requisitions/useTransportCatalogForm';

interface TransportAddFormProps {
  nextCode: string;
  fields: NewItemFields;
  setters: NewItemSetters;
  saving: boolean;
  onSubmit: () => void;
  getCategoryDisplayName: (cat: TransporteCategoria) => string;
}

export function TransportAddForm({
  nextCode,
  fields,
  setters,
  saving,
  onSubmit,
  getCategoryDisplayName,
}: Readonly<TransportAddFormProps>) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-end">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.nextCodeLabel')}</label>
        <Input value={nextCode} readOnly disabled className="h-11 rounded-xl bg-muted/30 font-mono font-bold text-primary" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.type')}</label>
        <Input className="h-11 rounded-xl" placeholder="Ex: Furgão, Autocarro..." value={fields.novoTipo} onChange={(e) => setters.setNovoTipo(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.category')}</label>
        <select
          value={fields.novaCategoria}
          onChange={(e) => setters.setNovaCategoria(e.target.value as TransporteCategoria)}
          className="w-full h-11 rounded-xl border border-border/40 bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        >
          {AVAILABLE_TRANSPORT_CATEGORIES.map(cat => <option key={cat} value={cat}>{getCategoryDisplayName(cat)}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.plate')}</label>
        <Input className="h-11 rounded-xl font-mono uppercase" placeholder={t('dashboard.admin.catalogs.platePlaceholder')} value={fields.novaMatricula} onChange={(e) => setters.setNovaMatricula(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.brand')}</label>
        <Input className="h-11 rounded-xl" placeholder="Ex: Renault, Mercedes..." value={fields.novaMarca} onChange={(e) => setters.setNovaMarca(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.model')}</label>
        <Input className="h-11 rounded-xl" placeholder="Ex: Kangoo, Sprinter..." value={fields.novoModelo} onChange={(e) => setters.setNovoModelo(e.target.value)} />
      </div>

      <div className="space-y-2 text-center md:text-left">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.capacity')}</label>
        <Input type="number" className="h-11 rounded-xl" placeholder="Ex: 5, 9, 50..." value={fields.novaLotacao} onChange={(e) => setters.setNovaLotacao(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-muted-foreground ml-1">{t('dashboard.admin.catalogs.regDate')}</label>
        <DatePickerField value={fields.novaDataMatricula} onChange={setters.setNovaDataMatricula} />
      </div>

      <Button
        onClick={onSubmit}
        disabled={saving}
        className="h-11 w-full bg-primary rounded-xl shadow-lg shadow-primary/20 text-base font-semibold"
      >
        {saving ? '...' : <Plus className="w-5 h-5" />}
      </Button>
    </div>
  );
}
