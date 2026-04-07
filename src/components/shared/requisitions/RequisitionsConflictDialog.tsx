import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ConflitoDialogMode, RequisicaoConflito } from '../../../pages/requisitions/sharedRequisitions.helpers';

interface RequisitionsConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflitosPendentes: RequisicaoConflito[];
  conflitoTransportesNomes: string[];
  conflitoDialogMode: ConflitoDialogMode;
  locale: string;
  updatingEstadoId: number | null;
  openedRequisicaoId: number | null;
  onOpenRequisicao: (id: number) => Promise<void>;
  onCloseRequisicao: () => void;
  onCancel: () => void;
  onContinueAccept: () => void;
  savingLabel: string;
}

export function RequisitionsConflictDialog({
  open,
  onOpenChange,
  conflitosPendentes,
  conflitoTransportesNomes,
  conflitoDialogMode,
  locale,
  updatingEstadoId,
  openedRequisicaoId,
  onOpenRequisicao,
  onCloseRequisicao,
  onCancel,
  onContinueAccept,
  savingLabel,
}: Readonly<RequisitionsConflictDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Conflitos de transporte detetados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {conflitoDialogMode === 'blocked'
              ? `Já existe uma requisição fechada que envolve o(s) veículo(s) ${conflitoTransportesNomes.join(', ')}.`
              : `Existem outras requisições que envolvem o ou os veículos ${conflitoTransportesNomes.join(', ')}.`}
          </p>

          {conflitoDialogMode === 'blocked' && (
            <p className="text-sm text-status-error rounded-md border border-status-error/40 bg-status-error-soft p-2">
              Impossível finalizar esta marcação porque já existe uma marcação fechada com este(s) veículo(s).
            </p>
          )}

          <div className="space-y-2">
            {conflitosPendentes.map((conflito) => {
              const dataPedido = conflito.criadoEm
                ? new Date(conflito.criadoEm).toLocaleString(locale)
                : 'Data indisponível';

              return (
                <div key={conflito.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2">
                  <span className="text-sm text-foreground">
                    {conflito.criadoPorNome} - {dataPedido}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => onOpenRequisicao(conflito.id)}
                  >
                    Ver requisição
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            {conflitoDialogMode === 'blocked' ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCloseRequisicao}
                disabled={updatingEstadoId === openedRequisicaoId}
              >
                Fechar requisição
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={updatingEstadoId === openedRequisicaoId}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={onContinueAccept}
                  disabled={updatingEstadoId === openedRequisicaoId}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {updatingEstadoId === openedRequisicaoId ? savingLabel : 'Continuar com a alteração de estado'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
