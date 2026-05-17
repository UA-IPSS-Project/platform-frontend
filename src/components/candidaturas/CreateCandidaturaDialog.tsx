import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { candidaturasApi, utilizadoresApi } from '../../services/api';
import type { UtilizadorInfo } from '../../services/api';

type Step = 'nif' | 'create-utente' | 'confirm-no-email';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidaturaType: string;
  onCreated?: () => void;
}

export function CreateCandidaturaDialog({ open, onOpenChange, candidaturaType, onCreated }: Props) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('nif');
  const [nif, setNif] = useState('');
  const [nifError, setNifError] = useState('');
  const [looking, setLooking] = useState(false);

  // create-utente form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [contacto, setContacto] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [creating, setCreating] = useState(false);

  function reset() {
    setStep('nif');
    setNif('');
    setNifError('');
    setNome('');
    setEmail('');
    setContacto('');
    setDataNasc('');
    setCreating(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function createCandidatura(resolvedNif: string, resolvedNome: string) {
    const created = await candidaturasApi.criarCandidatura({
      formId: candidaturaType,
      nif: resolvedNif,
      nome: resolvedNome,
      respostas: {},
      estado: 'RASCUNHO',
    });
    onCreated?.();
    onOpenChange(false);
    reset();
    navigate(`/dashboard/${candidaturaType}/${created.id}/fill`);
  }

  async function handleLookup() {
    if (nif.length !== 9) {
      setNifError('O NIF deve ter exatamente 9 dígitos');
      return;
    }
    setNifError('');
    setLooking(true);
    try {
      const utente: UtilizadorInfo = await utilizadoresApi.buscarPorNif(nif);
      // Utente exists — create candidatura immediately
      toast.success('Utente encontrado. A criar candidatura…');
      await createCandidatura(utente.nif, utente.nome);
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('404') || String(err).includes('404')) {
        setStep('create-utente');
      } else {
        toast.error('Erro ao pesquisar NIF. Tente novamente.');
      }
    } finally {
      setLooking(false);
    }
  }

  async function handleCreateUtente() {
    setCreating(true);
    try {
      await utilizadoresApi.createBySecretary({
        name: nome.trim(),
        nif,
        email: email.trim() || undefined,
        contact: contacto.trim() || undefined,
        birthDate: dataNasc || new Date().toISOString().split('T')[0],
        isEmployee: false,
      });
      toast.success('Utente criado com sucesso.');
      await createCandidatura(nif, nome.trim());
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao criar utente.');
    } finally {
      setCreating(false);
    }
  }

  function handleCreateAndContinue() {
    if (!nome.trim()) return;
    if (!email.trim()) {
      setStep('confirm-no-email');
    } else {
      void handleCreateUtente();
    }
  }

  return (
    <>
      <Dialog open={open && step !== 'confirm-no-email'} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>
              {step === 'nif' ? 'Criar candidatura' : 'Novo utente'}
            </DialogTitle>
          </DialogHeader>

          {step === 'nif' && (
            <>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">NIF</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={nif}
                    placeholder="123456789"
                    className="border-border"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setNif(val);
                      setNifError(val.length > 0 && val.length !== 9 ? 'O NIF deve ter exatamente 9 dígitos' : '');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && nif.length === 9) void handleLookup(); }}
                  />
                  {nifError ? <p className="mt-1 text-xs text-destructive">{nifError}</p> : null}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={looking}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void handleLookup()} disabled={looking || nif.length !== 9}>
                  {looking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {looking ? 'A verificar…' : 'Procurar'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'create-utente' && (
            <>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">NIF</label>
                  <Input type="text" value={nif} disabled className="border-border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={nome}
                    placeholder="Nome completo"
                    className="border-border"
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Input
                    type="email"
                    value={email}
                    placeholder="exemplo@email.com"
                    className="border-border"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {!email.trim() && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Sem email: o utente não receberá notificações da plataforma.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contacto</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    value={contacto}
                    placeholder="9XXXXXXXX"
                    className="border-border"
                    onChange={(e) => setContacto(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Data de nascimento</label>
                  <Input
                    type="date"
                    value={dataNasc}
                    className="border-border"
                    onChange={(e) => setDataNasc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStep('nif')} disabled={creating}>
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateAndContinue}
                  disabled={creating || !nome.trim()}
                >
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {creating ? 'A criar…' : 'Criar e continuar'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={step === 'confirm-no-email'} onOpenChange={(o) => { if (!o) setStep('create-utente'); }}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Criar conta sem email?</AlertDialogTitle>
            <AlertDialogDescription>
              O utente não receberá notificações da plataforma (confirmações, atualizações de estado, etc.).
              Confirma que pretende criar a conta sem endereço de email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStep('create-utente')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleCreateUtente()} disabled={creating}>
              {creating ? 'A criar…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
