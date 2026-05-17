import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { RjsfCandidaturaForm } from '../../components/rjsf/RjsfCandidaturaForm';
import { CandidaturasCard } from '../../components/candidaturas/CandidaturasCard';
import { candidaturasApi } from '../../services/api';

export function RjsfCandidaturaPage() {
  const navigate = useNavigate();
  const { candidaturaType, candidaturaId } = useParams();

  const [existingRespostas, setExistingRespostas] = useState<Record<string, unknown> | undefined>();
  const [loading, setLoading] = useState(Boolean(candidaturaId));

  useEffect(() => {
    if (!candidaturaId) return;
    candidaturasApi.obterCandidaturaPorId(candidaturaId)
      .then((c) => setExistingRespostas(c.respostas ?? {}))
      .catch(() => toast.error('Erro ao carregar candidatura'))
      .finally(() => setLoading(false));
  }, [candidaturaId]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}>
            Voltar
          </Button>
        </div>

        <CandidaturasCard className="p-6 md:p-8">
          <RjsfCandidaturaForm
            showPreview={false}
            showTitle={true}
            candidaturaType={candidaturaType}
            existingCandidaturaId={candidaturaId}
            existingRespostas={existingRespostas}
            onSuccess={() => navigate(`/dashboard/${candidaturaType ?? ''}`)}
          />
        </CandidaturasCard>
      </div>
    </div>
  );
}
