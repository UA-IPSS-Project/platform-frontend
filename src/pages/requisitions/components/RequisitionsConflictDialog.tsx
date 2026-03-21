import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { ConflitoDialogMode, RequisicaoConflito } from '../sharedRequisitions.helpers';

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
      <DialogContent className="max-w-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>Conflitos de transporte detetados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {conflitoDialogMode === 'blocked'
              ? `Já existe uma requisição aceite que envolve o(s) veículo(s) ${conflitoTransportesNomes.join(', ')}.`
              : `Existem outras requisições que envolvem o ou os veículos ${conflitoTransportesNomes.join(', ')}.`}
          </p>

          {conflitoDialogMode === 'blocked' && (
            <p className="text-sm text-red-700 dark:text-red-300 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2">
              Impossível aceitar esta marcação porque já existe uma marcação aceite com este(s) veículo(s).
            </p>
          )}

          <div className="space-y-2">
            {conflitosPendentes.map((conflito) => {
              const dataPedido = conflito.criadoEm
                ? new Date(conflito.criadoEm).toLocaleString(locale)
                : 'Data indisponível';

              return (
                <div key={conflito.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-2">
                  <span className="text-sm text-gray-800 dark:text-gray-200">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updatingEstadoId === openedRequisicaoId ? savingLabel : 'Continuar com o Aceitar Requisição'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
