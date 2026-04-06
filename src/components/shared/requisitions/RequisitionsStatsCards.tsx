import { AlertTriangleIcon, ClipboardListIcon, PackageIcon, TruckIcon, WrenchIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { GlassCard } from '../../ui/glass-card';
import { RequisicoesTab } from '../../../pages/requisitions/sharedRequisitions.helpers';

interface RequisitionsStatsCardsProps {
  stats: {
    total: number;
    urgentes: number;
    material: number;
    manutencao: number;
    transporte: number;
  };
  onCardShortcut: (tab: RequisicoesTab) => void;
  t: (key: string) => string;
}

export function RequisitionsStatsCards({ stats, onCardShortcut, t }: Readonly<RequisitionsStatsCardsProps>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <GlassCard className="p-0 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCardShortcut('GERAL')}
          className="w-full h-full p-4 justify-between rounded-none hover:bg-accent"
          aria-label={t('requisitions.ui.goToGeneralRequests')}
        >
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.requests')}</p>
            <p className="text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <ClipboardListIcon className="w-5 h-5 text-primary" />
          </div>
        </Button>
      </GlassCard>



      <GlassCard className="hidden xl:block p-0 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCardShortcut('MATERIAL')}
          className="w-full h-full p-4 justify-between rounded-none hover:bg-accent"
          aria-label={t('requisitions.ui.goToMaterialRequests')}
        >
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.material')}</p>
            <p className="text-3xl font-semibold text-foreground">{stats.material}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <PackageIcon className="w-5 h-5 text-primary" />
          </div>
        </Button>
      </GlassCard>

      <GlassCard className="hidden xl:block p-0 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCardShortcut('MANUTENCAO')}
          className="w-full h-full p-4 justify-between rounded-none hover:bg-accent"
          aria-label={t('requisitions.ui.goToMaintenanceRequests')}
        >
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.maintenance')}</p>
            <p className="text-3xl font-semibold text-foreground">{stats.manutencao}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <WrenchIcon className="w-5 h-5 text-primary" />
          </div>
        </Button>
      </GlassCard>

      <GlassCard className="hidden md:block p-0 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCardShortcut('TRANSPORTE')}
          className="w-full h-full p-4 justify-between rounded-none hover:bg-accent"
          aria-label={t('requisitions.ui.goToTransportRequests')}
        >
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.transport')}</p>
            <p className="text-3xl font-semibold text-foreground">{stats.transporte}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <TruckIcon className="w-5 h-5 text-primary" />
          </div>
        </Button>
      </GlassCard>

      <GlassCard className="hidden md:block p-0 overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onCardShortcut('URGENTE')}
          className="w-full h-full p-4 justify-between rounded-none hover:bg-accent"
          aria-label={t('requisitions.ui.goToUrgentRequests')}
        >
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('requisitions.ui.urgent')}</p>
            <p className="text-3xl font-semibold text-foreground">{stats.urgentes}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-status-error-soft flex items-center justify-center">
            <AlertTriangleIcon className="w-5 h-5 text-status-error" />
          </div>
        </Button>
      </GlassCard>
    </div>
  );
}
